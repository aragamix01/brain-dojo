"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { QUEST_NODES } from "@/games/quest/data";
import {
  COINS,
  applyRewards,
  chestReward,
  dailyRewards,
  spend,
  streakRewards,
  winRewards,
  type CoinEntry,
  type Reward,
} from "./coins";
import { BADGE_COINS, newlyEarned } from "./achievements";
import { dayKey, daysBetween, shiftDay, yesterdayKey } from "./date";
import { FREEZE, SKINS, TITLES } from "./shop";

export type GameStat = {
  wins: number;
  bestStars: number;
  bestTimeMs: number | null;
  bestScore: number | null;
};

export type DailyStage = { kind: string; label: string; stars: number; detail: string };

export type DailyResult = {
  timeMs: number;
  hints: number;
  /** games picked for that day and how each went */
  stages?: DailyStage[];
  // Old fixed-format days (Speed Math → Lights → Jugs) saved these instead of `stages`.
  sprintScore?: number;
  lightsMoves?: number;
  jugsMoves?: number;
};

export type ProgressData = {
  name: string;
  xp: number;
  streak: number;
  bestStreak: number;
  lastActive: string | null;
  hintsUsed: number;
  /** keyed like "logic:lights", "robot:r03", "situation:camp", "sprint" */
  games: Record<string, GameStat>;
  daily: Record<string, DailyResult>;
  /** quest chest id → time opened */
  chests: Record<string, number>;
  /** claim codes the uncle marked as paid out on this device */
  delivered: Record<string, number>;
  /** guides/tutorials already shown, by id */
  seen: Record<string, number>;
  /** hint coins in the wallet */
  coins: number;
  coinLog: CoinEntry[];
  /** one-time coin rewards already paid out */
  rewarded: Record<string, number>;
  /** badge id → time earned */
  badges: Record<string, number>;
  /** shop item ids bought ("skin:gold", "title:planner") → time */
  owned: Record<string, number>;
  equipped: { skin?: string; title?: string };
  /** streak freezes in hand; each covers one missed day */
  freezes: number;
  /** day key → how that day kept the streak alive */
  activeDays: Record<string, DayMark>;
};

export type DayMark = "play" | "freeze";

/** Not persisted: the latest pay-out / news, shown as a toast. */
export type CoinToast = { id: number; text: string } | null;

export type ShopKind = "skin" | "title";

type Actions = {
  setName: (name: string) => void;
  recordWin: (
    key: string,
    r: { stars: number; timeMs?: number; score?: number; xpBase?: number },
  ) => number;
  recordDaily: (date: string, r: DailyResult) => number;
  addHint: () => void;
  openChest: (id: string) => void;
  markDelivered: (code: string) => void;
  markSeen: (id: string) => void;
  /** Pay one coin for an extra hint; false when the wallet is empty. */
  spendCoin: (reason: string) => boolean;
  /** Buy a cosmetic; false when already owned or too expensive. */
  buyItem: (kind: ShopKind, id: string) => boolean;
  equip: (kind: ShopKind, id: string) => void;
  buyFreeze: () => boolean;
  /** Award any badges the current progress has earned. */
  checkBadges: () => void;
  importData: (d: ProgressData) => void;
  reset: () => void;
};

export const emptyProgress = (): ProgressData => ({
  name: "",
  xp: 0,
  streak: 0,
  bestStreak: 0,
  lastActive: null,
  hintsUsed: 0,
  games: {},
  daily: {},
  chests: {},
  delivered: {},
  seen: {},
  coins: COINS.start,
  coinLog: [],
  rewarded: {},
  badges: {},
  owned: {},
  equipped: {},
  freezes: 0,
  activeDays: {},
});

/** Days skipped since the last activity (0 = played yesterday or today). */
function missedDays(lastActive: string | null, today: string): number {
  return lastActive ? Math.max(0, daysBetween(lastActive, today) - 1) : Infinity;
}

/** Record today's activity: extend the streak, spending freezes to cover skipped days if there are enough. */
function touchStreak(s: ProgressData) {
  const today = dayKey();
  const freezes = s.freezes ?? 0;
  const activeDays = { ...(s.activeDays ?? {}), [today]: "play" as DayMark };
  if (s.lastActive === today) return { streak: s.streak, bestStreak: s.bestStreak, lastActive: today, freezes, activeDays };
  const missed = missedDays(s.lastActive, today);
  const saved = missed > 0 && missed <= freezes;
  // Frozen days show as blue flames on the weekly strip.
  if (saved) for (let i = 1; i <= missed; i++) activeDays[shiftDay(today, -i)] = "freeze";
  const streak = missed === 0 || saved ? s.streak + 1 : 1;
  return {
    streak,
    bestStreak: Math.max(s.bestStreak, streak),
    lastActive: today,
    freezes: saved ? freezes - missed : freezes,
    activeDays,
  };
}

const bossIds = new Set(QUEST_NODES.filter((n) => n.boss).map((n) => n.id));

type State = ProgressData & { coinToast: CoinToast };

/** Pay rewards into the wallet; coins past the cap become XP. Returns state changes including the toast. */
function payout(s: State, rewards: Reward[], notes: string[] = []) {
  const { wallet, gained, overflow } = applyRewards(s, rewards);
  const parts = [
    ...gained.map((g) => `+${g.amount} 🪙 ${g.reason}`),
    ...(overflow ? [`กระเป๋าเต็ม: ${overflow} 🪙 → +${overflow * COINS.overflowXp} XP`] : []),
    ...notes,
  ];
  const coinToast: CoinToast = parts.length ? { id: Date.now(), text: parts.join(" · ") } : s.coinToast;
  return { ...wallet, xp: s.xp + overflow * COINS.overflowXp, coinToast };
}

/** Streak update for an activity, with its 7-day bonus and a note when a freeze was used. */
function activity(s: State, rewards: Reward[]) {
  const streak = touchStreak(s);
  const used = (s.freezes ?? 0) - streak.freezes;
  const bonus = streak.lastActive !== s.lastActive ? streakRewards(streak.streak, dayKey()) : [];
  const pay = payout(s, [...rewards, ...bonus], used ? [`🧊 ใช้น้ำแข็ง ${used} อัน วันติดยังอยู่!`] : []);
  return { ...streak, ...pay };
}

export const useProgress = create<State & Actions>()(
  persist(
    (set, get) => ({
      ...emptyProgress(),
      coinToast: null,
      setName: (name) => set({ name: name.slice(0, 24) }),
      recordWin: (key, r) => {
        const s = get();
        const prev = s.games[key] ?? { wins: 0, bestStars: 0, bestTimeMs: null, bestScore: null };
        const xp = (r.xpBase ?? 10) * r.stars;
        const changes = activity(
          s,
          winRewards({
            key,
            stars: r.stars,
            firstWin: prev.wins === 0,
            isBoss: key.startsWith("quest:") && bossIds.has(key.slice(6)),
            today: dayKey(),
            rewarded: s.rewarded,
          }),
        );
        set({
          ...changes,
          xp: changes.xp + xp,
          games: {
            ...s.games,
            [key]: {
              wins: prev.wins + 1,
              bestStars: Math.max(prev.bestStars, r.stars),
              bestTimeMs:
                r.timeMs == null ? prev.bestTimeMs : Math.min(prev.bestTimeMs ?? Infinity, r.timeMs),
              bestScore: r.score == null ? prev.bestScore : Math.max(prev.bestScore ?? 0, r.score),
            },
          },
        });
        get().checkBadges();
        return xp;
      },
      recordDaily: (date, r) => {
        const s = get();
        if (s.daily[date]) return 0;
        const xp = 40 + (r.stages ?? []).reduce((a, st) => a + st.stars * 10, 0);
        const allThree = !!r.stages?.length && r.stages.every((st) => st.stars === 3);
        const changes = activity(s, dailyRewards(date, allThree));
        set({ ...changes, xp: changes.xp + xp, daily: { ...s.daily, [date]: r } });
        get().checkBadges();
        return xp;
      },
      addHint: () => set((s) => ({ hintsUsed: s.hintsUsed + 1 })),
      openChest: (id) => {
        const s = get();
        if (s.chests[id]) return;
        set({ chests: { ...s.chests, [id]: Date.now() }, ...payout(s, [chestReward(id)]) });
        get().checkBadges();
      },
      markDelivered: (code) => set((s) => ({ delivered: { ...s.delivered, [code]: Date.now() } })),
      markSeen: (id) => set((s) => ({ seen: { ...s.seen, [id]: Date.now() } })),
      spendCoin: (reason) => {
        const w = spend(get(), reason);
        if (w) set(w);
        return !!w;
      },
      buyItem: (kind, id) => {
        const s = get();
        const item = kind === "skin" ? SKINS.find((x) => x.id === id) : TITLES.find((x) => x.id === id);
        const key = `${kind}:${id}`;
        if (!item || s.owned[key]) return false;
        const w = item.price ? spend(s, `ซื้อ${kind === "skin" ? "สกิน" : "ฉายา"} ${item.name}`, item.price) : s;
        if (!w) return false;
        set({ ...w, owned: { ...s.owned, [key]: Date.now() }, equipped: { ...s.equipped, [kind]: id } });
        return true;
      },
      equip: (kind, id) => set((s) => ({ equipped: { ...s.equipped, [kind]: id } })),
      buyFreeze: () => {
        const s = get();
        if ((s.freezes ?? 0) >= FREEZE.max) return false;
        const w = spend(s, "ซื้อน้ำแข็งกันไฟดับ 🧊", FREEZE.price);
        if (!w) return false;
        set({ ...w, freezes: (s.freezes ?? 0) + 1 });
        return true;
      },
      checkBadges: () => {
        const s = get();
        const fresh = newlyEarned(pickData(s));
        if (!fresh.length) return;
        const now = Date.now();
        const badges = { ...s.badges };
        for (const a of fresh) badges[a.id] = now;
        const pay = payout(
          s,
          fresh.map((a) => ({ amount: BADGE_COINS, reason: `ตรา ${a.emoji} ${a.name}`, once: `badge:${a.id}` })),
        );
        // Keep the win's own toast in front so both pieces of news show together.
        const prev = s.coinToast && now - s.coinToast.id < 1500 ? `${s.coinToast.text} · ` : "";
        set({ ...pay, badges, coinToast: { id: now, text: `🏅 ตราใหม่! ${prev}${pay.coinToast?.text ?? ""}` } });
      },
      importData: (d) => set({ ...emptyProgress(), ...d }),
      reset: () => set(emptyProgress()),
    }),
    {
      name: "brain-dojo-v1",
      skipHydration: true,
      partialize: (s) => pickData(s),
    },
  ),
);

function pickData(s: ProgressData): ProgressData {
  return {
    name: s.name,
    xp: s.xp,
    streak: s.streak,
    bestStreak: s.bestStreak,
    lastActive: s.lastActive,
    hintsUsed: s.hintsUsed,
    games: s.games,
    daily: s.daily,
    chests: s.chests,
    delivered: s.delivered,
    seen: s.seen,
    coins: s.coins,
    coinLog: s.coinLog,
    rewarded: s.rewarded,
    badges: s.badges,
    owned: s.owned,
    equipped: s.equipped,
    freezes: s.freezes,
    activeDays: s.activeDays,
  };
}

export function snapshot(): ProgressData {
  return pickData(useProgress.getState());
}

/** Streak shown to the user: 0 once it is broken, unless enough freezes are waiting to cover the gap. */
export function liveStreak(s: Pick<ProgressData, "streak" | "lastActive"> & { freezes?: number }): number {
  if (s.lastActive === dayKey() || s.lastActive === yesterdayKey()) return s.streak;
  return missedDays(s.lastActive, dayKey()) <= (s.freezes ?? 0) ? s.streak : 0;
}

export function useHydrated(): boolean {
  return useSyncExternalStore(
    (cb) => useProgress.persist.onFinishHydration(cb),
    () => useProgress.persist.hasHydrated(),
    () => false,
  );
}

/**
 * How a day kept the streak going. Days before daily tracking existed are inferred from
 * finished Dailies and from the streak counting back from the last active day.
 */
export function dayMark(p: Pick<ProgressData, "activeDays" | "daily" | "lastActive" | "streak">, key: string): DayMark | null {
  const recorded = p.activeDays?.[key];
  if (recorded) return recorded;
  if (p.daily[key]) return "play";
  if (p.lastActive) {
    const back = daysBetween(key, p.lastActive);
    if (back >= 0 && back < p.streak) return "play";
  }
  return null;
}
