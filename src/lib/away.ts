"use client";

import { useEffect, useRef } from "react";

/** Time spent outside the app during a Daily stage (another app, another window). Shown only to the uncle. */
export type Away = { n: number; ms: number };

/** Shorter trips (a notification shade, a stray tap) aren't counted. */
export const AWAY_MIN_MS = 1000;

/** In the Daily, every trip past this many quietly starts the stage over. */
export const AWAY_RESET_AFTER = 3;

/**
 * Counts how often, and how long, the page is hidden or loses focus — switching to an app on a phone
 * hides the page; switching windows on a computer only blurs it. The browser doesn't say where the
 * player went, only that they left.
 */
export function useAwayMeter(onTrip?: (trips: number) => void) {
  const m = useRef({ n: 0, ms: 0, since: null as number | null });
  const cb = useRef(onTrip);
  useEffect(() => {
    cb.current = onTrip;
  });

  useEffect(() => {
    // Driven by the events themselves, not document.hasFocus(): some webviews never report focus.
    const leave = () => {
      if (m.current.since === null) m.current.since = Date.now();
    };
    const back = () => {
      const s = m.current;
      if (s.since === null) return;
      const ms = Date.now() - s.since;
      s.since = null;
      if (ms >= AWAY_MIN_MS) {
        s.n++;
        s.ms += ms;
        cb.current?.(s.n);
      }
    };
    const visibility = () => (document.hidden ? leave() : back());
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("blur", leave);
    window.addEventListener("focus", back);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("blur", leave);
      window.removeEventListener("focus", back);
    };
  }, []);

  return {
    /** Start counting afresh (a new stage). */
    reset() {
      // Already out (e.g. left during the pause between stages)? That trip counts toward the new stage.
      m.current = { n: 0, ms: 0, since: document.hidden ? Date.now() : null };
    },
    /** What the current stage has added up to. */
    take(): Away {
      const { n, ms } = m.current;
      return { n, ms };
    },
  };
}
