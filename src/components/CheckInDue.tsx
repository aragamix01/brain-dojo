"use client";

import { useEffect, useState } from "react";
import { dayKey } from "@/lib/date";
import { isCheckInDay } from "@/lib/life/model";
import { useHydrated, useProgress } from "@/lib/store";

/** Answers per day, so moving between pages doesn't ask again (cleared once the check-in is sent). */
const cache = new Map<string, boolean>();

export function forgetCheckInDue() {
  cache.clear();
}

/**
 * Whether today's Daily is the weekly check-in: a Friday or Saturday with today's Daily not done
 * and this week's check-in not sent. `null` while asking; offline counts as "no" so games still work.
 */
export function useCheckInDue(): boolean | null {
  const hydrated = useHydrated();
  const today = dayKey();
  const done = useProgress((s) => !!s.daily[today]);
  const ask = hydrated && !done && isCheckInDay(today);
  const [due, setDue] = useState<boolean | null>(() => cache.get(today) ?? null);
  useEffect(() => {
    if (!ask || cache.has(today)) return;
    let live = true;
    fetch("/api/lq/player?part=checkin", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { signedIn?: boolean; sent?: boolean }) => !!j.signedIn && j.sent === false)
      .catch(() => false)
      .then((v) => {
        cache.set(today, v);
        if (live) setDue(v);
      });
    return () => {
      live = false;
    };
  }, [ask, today]);
  if (!hydrated) return null;
  if (!ask) return false;
  return cache.get(today) ?? due;
}
