"use client";

import { useEffect, useState } from "react";
import { AWAY_MIN_MS, AWAY_RESET_AFTER, type Away } from "@/lib/away";
import { useNow } from "./ui";

type Entry = { t: number; type: string; ms?: number };

/**
 * Secret test overlay for the uncle (open /daily?awaydebug): shows which switches the browser
 * actually reports, so the trip rules can be checked on a real phone.
 */
export function AwayDebug({ take }: { take: () => Away }) {
  const [log, setLog] = useState<Entry[]>([]);
  useNow(500);

  useEffect(() => {
    let since: number | null = null;
    const add = (type: string, ms?: number) => setLog((l) => [{ t: Date.now(), type, ms }, ...l].slice(0, 8));
    const leave = (type: string) => {
      if (since === null) since = Date.now();
      add(type);
    };
    const back = (type: string) => {
      const ms = since === null ? undefined : Date.now() - since;
      since = null;
      add(type, ms);
    };
    const visibility = () => (document.hidden ? leave("hidden") : back("visible"));
    const blur = () => leave("blur");
    const focus = () => back("focus");
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("blur", blur);
    window.addEventListener("focus", focus);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("blur", blur);
      window.removeEventListener("focus", focus);
    };
  }, []);

  const { n, ms } = take();
  return (
    <div className="pointer-events-none fixed bottom-2 right-2 z-50 w-56 rounded-lg bg-black/80 p-2 font-mono text-[10px] leading-tight text-white">
      <p className="font-bold">
        trips {n} · {(ms / 1000).toFixed(1)}s · reset at {AWAY_RESET_AFTER + 1}
      </p>
      {log.map((e, i) => (
        <p key={i}>
          {new Date(e.t).toLocaleTimeString("en-GB")} {e.type}
          {e.ms !== undefined && ` ${(e.ms / 1000).toFixed(1)}s ${e.ms >= AWAY_MIN_MS ? "✔" : "✗"}`}
        </p>
      ))}
    </div>
  );
}
