"use client";

import { useEffect } from "react";
import { shiftDay, dayKey } from "@/lib/date";
import { rewardStars } from "@/lib/kidtimer/reward";
import { useProgress, type ProgressData } from "@/lib/store";

const KEY = "lq-synced";

/** Recent Dailies worth PC time, minus days already paid with an old per-day code. */
function recent(p: Pick<ProgressData, "daily" | "timeCodes">) {
  const from = shiftDay(dayKey(), -13);
  return Object.entries(p.daily)
    .filter(([d]) => d >= from && !p.timeCodes?.[d])
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, r]) => ({ day, stars: rewardStars(r) }));
}

/** Sends recent Dailies unless this exact set already went up; resolves to how many were new. */
export async function syncDailies(force = false): Promise<number> {
  const days = recent(useProgress.getState());
  if (!days.length) return 0;
  const sig = days.map((d) => `${d.day}:${d.stars}`).join(",");
  try {
    if (!force && localStorage.getItem(KEY) === sig) return 0;
  } catch {
    /* storage blocked: just send */
  }
  try {
    const res = await fetch("/api/lq/player", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "syncDaily", days }),
    });
    if (!res.ok) return 0;
    try {
      localStorage.setItem(KEY, sig);
    } catch {
      /* fine: it resends next time */
    }
    return Number((await res.json()).added) || 0;
  } catch {
    return 0;
  }
}

/** Runs `fn` once the saved progress has loaded from storage. */
export function afterHydration(fn: () => void): () => void {
  if (useProgress.persist.hasHydrated()) {
    fn();
    return () => {};
  }
  return useProgress.persist.onFinishHydration(fn);
}

/**
 * Sends finished Dailies to Weekly Life Quest, where the parent turns them into PC time. Only
 * works once the player has signed in to Life Quest on this phone (the cookie says who it is);
 * until then the server says no, and the Life Quest home page sends them after sign-in.
 */
export function LifeSync() {
  const daily = useProgress((s) => s.daily);
  const timeCodes = useProgress((s) => s.timeCodes);
  useEffect(() => {
    if (useProgress.persist.hasHydrated()) void syncDailies();
  }, [daily, timeCodes]);
  return null;
}
