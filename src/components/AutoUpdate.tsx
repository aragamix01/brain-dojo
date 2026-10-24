"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const CHECK_EVERY_MS = 60_000;

async function liveVersion(): Promise<string | null> {
  try {
    const res = await fetch("/api/version", { cache: "no-store" });
    return res.ok ? ((await res.json()).v as string) : null;
  } catch {
    return null;
  }
}

/**
 * A tab left open keeps running the code it loaded. When the player comes back to the app, check
 * whether a newer version is live; if so, reload on the next page change — never in the middle of a
 * puzzle. Opening the Daily is a page change, so a Daily always starts on the newest rules.
 */
export function AutoUpdate() {
  const pathname = usePathname();
  const s = useRef({ base: null as string | null, stale: false, checkedAt: 0, path: pathname });

  useEffect(() => {
    void liveVersion().then((v) => {
      s.current.base = v;
      s.current.checkedAt = Date.now();
    });
    const check = async () => {
      const cur = s.current;
      if (document.hidden || cur.stale || !cur.base || Date.now() - cur.checkedAt < CHECK_EVERY_MS) return;
      cur.checkedAt = Date.now();
      const v = await liveVersion();
      if (v && v !== cur.base) {
        cur.stale = true;
        // Nothing to lose on the home page: update right away.
        if (location.pathname === "/") location.reload();
      }
    };
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    return () => {
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("focus", check);
    };
  }, []);

  useEffect(() => {
    if (s.current.path === pathname) return;
    s.current.path = pathname;
    if (s.current.stale) location.reload();
  }, [pathname]);

  return null;
}
