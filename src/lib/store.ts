"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { dayKey, yesterdayKey } from "./date";

export type GameStat = {
  wins: number;
  bestStars: number;
  bestTimeMs: number | null;
  bestScore: number | null;
};

export type DailyResult = {
  timeMs: number;
  sprintScore: number;
  hints: number;
  lightsMoves: number;
  jugsMoves: number;
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
};

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
});

function touchStreak(s: ProgressData): Pick<ProgressData, "streak" | "bestStreak" | "lastActive"> {
  const today = dayKey();
  if (s.lastActive === today) return s;
  const streak = s.lastActive === yesterdayKey() ? s.streak + 1 : 1;
  return { streak, bestStreak: Math.max(s.bestStreak, streak), lastActive: today };
}

export const useProgress = create<ProgressData & Actions>()(
  persist(
    (set, get) => ({
      ...emptyProgress(),
      setName: (name) => set({ name: name.slice(0, 24) }),
      recordWin: (key, r) => {
        const s = get();
        const prev = s.games[key] ?? { wins: 0, bestStars: 0, bestTimeMs: null, bestScore: null };
        const xp = (r.xpBase ?? 10) * r.stars;
        set({
          ...touchStreak(s),
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
        const xp = 60 + r.sprintScore * 2;
        set({ ...touchStreak(s), xp: s.xp + xp, daily: { ...s.daily, [date]: r } });
        return xp;
      },
      addHint: () => set((s) => ({ hintsUsed: s.hintsUsed + 1 })),
      openChest: (id) => set((s) => (s.chests[id] ? s : { chests: { ...s.chests, [id]: Date.now() } })),
      markDelivered: (code) => set((s) => ({ delivered: { ...s.delivered, [code]: Date.now() } })),
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
