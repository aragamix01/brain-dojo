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
import { dayKey, yesterdayKey } from "./date";

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
};

/** Not persisted: the latest coin pay-out, shown as a toast. */
export type CoinToast = { id: number; text: string } | null;

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
});

function touchStreak(s: ProgressData): Pick<ProgressData, "streak" | "bestStreak" | "lastActive"> {
  const today = dayKey();
  if (s.lastActive === today) return s;
  const streak = s.lastActive === yesterdayKey() ? s.streak + 1 : 1;
  return { streak, bestStreak: Math.max(s.bestStreak, streak), lastActive: today };
}

const bossIds = new Set(QUEST_NODES.filter((n) => n.boss).map((n) => n.id));

/** Wallet changes for a batch of rewards, plus the toast announcing them. */
function payout(s: ProgressData & { coinToast: CoinToast }, rewards: Reward[]) {
  const { wallet, gained } = applyRewards(s, rewards);
  const coinToast: CoinToast = gained.length
    ? { id: Date.now(), text: gained.map((g) => `+${g.amount} 🪙 ${g.reason}`).join(" · ") }
    : s.coinToast;
  return { ...wallet, coinToast };
}

/** Streak update plus its every-7-days bonus. */
function streakRewardsFor(s: ProgressData, next: ReturnType<typeof touchStreak>): Reward[] {
  return next.lastActive !== s.lastActive ? streakRewards(next.streak, dayKey()) : [];
}

export const useProgress = create<ProgressData & Actions & { coinToast: CoinToast }>()(
  persist(
    (set, get) => ({
      ...emptyProgress(),
      coinToast: null,
      setName: (name) => set({ name: name.slice(0, 24) }),
      recordWin: (key, r) => {
        const s = get();
        const prev = s.games[key] ?? { wins: 0, bestStars: 0, bestTimeMs: null, bestScore: null };
        const xp = (r.xpBase ?? 10) * r.stars;
        const streak = touchStreak(s);
        const rewards = [
          ...winRewards({
            key,
            stars: r.stars,
            firstWin: prev.wins === 0,
            isBoss: key.startsWith("quest:") && bossIds.has(key.slice(6)),
            today: dayKey(),
            rewarded: s.rewarded,
          }),
          ...streakRewardsFor(s, streak),
        ];
        set({
          ...streak,
          ...payout(s, rewards),
          xp: s.xp + xp,
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
        return xp;
      },
      recordDaily: (date, r) => {
        const s = get();
        if (s.daily[date]) return 0;
        const xp = 40 + (r.stages ?? []).reduce((a, st) => a + st.stars * 10, 0);
        const streak = touchStreak(s);
        const allThree = !!r.stages?.length && r.stages.every((st) => st.stars === 3);
        set({
          ...streak,
          ...payout(s, [...dailyRewards(date, allThree), ...streakRewardsFor(s, streak)]),
          xp: s.xp + xp,
          daily: { ...s.daily, [date]: r },
        });
        return xp;
      },
      addHint: () => set((s) => ({ hintsUsed: s.hintsUsed + 1 })),
      openChest: (id) =>
        set((s) => (s.chests[id] ? s : { chests: { ...s.chests, [id]: Date.now() }, ...payout(s, [chestReward(id)]) })),
      markDelivered: (code) => set((s) => ({ delivered: { ...s.delivered, [code]: Date.now() } })),
      markSeen: (id) => set((s) => ({ seen: { ...s.seen, [id]: Date.now() } })),
      spendCoin: (reason) => {
        const w = spend(get(), reason);
        if (w) set(w);
        return !!w;
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
  };
}

export function snapshot(): ProgressData {
  return pickData(useProgress.getState());
}

/** Streak shown to the user: broken streaks read as 0 even before the next win. */
export function liveStreak(s: Pick<ProgressData, "streak" | "lastActive">): number {
  return s.lastActive === dayKey() || s.lastActive === yesterdayKey() ? s.streak : 0;
}

export function useHydrated(): boolean {
  return useSyncExternalStore(
    (cb) => useProgress.persist.onFinishHydration(cb),
    () => useProgress.persist.hasHydrated(),
    () => false,
  );
}
