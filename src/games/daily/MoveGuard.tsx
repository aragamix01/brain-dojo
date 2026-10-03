"use client";

import { useState } from "react";
import { NovaFace } from "@/components/Nova";

/** Multiples of par: Nova warns, then warns the ship is breaking, then the stage restarts. */
export const GUARD = { warn: 3, danger: 5, wreck: 6 };

type Mood = "warn" | "danger" | "wrecked";

function Banner({ mood, count, par, limit }: { mood: Mood; count: number; par: number; limit: number }) {
  const text =
    mood === "wrecked"
      ? "💥 เรือแตก! ด่านเริ่มใหม่แล้ว — คราวนี้คิดก่อนกดนะ ลองวางแผนล่วงหน้าสัก 2–3 ตา"
      : mood === "danger"
        ? `🌊 เรือเริ่มรั่วแล้ว! อีก ${limit - count} ครั้งเรือจะแตก ต้องเริ่มด่านใหม่ — หยุดคิดก่อน หรือใช้คำใบ้`
        : `⚠️ กดไป ${count} ครั้งแล้ว (par ${par}) — กดมั่วไม่ช่วยนะ ลองหยุดคิดว่าแต่ละครั้งทำให้ใกล้เป้าหมายขึ้นไหม`;
  return (
    <div className="animate-pop mb-3 flex items-end gap-2">
      <NovaFace className="h-12 w-11 shrink-0" />
      <div
        className={`flex-1 rounded-[16px] rounded-bl-[4px] border-[2.5px] border-ink px-3 py-2 text-sm font-bold leading-snug shadow-[2px_2px_0_#1e2a3a] ${
          mood === "warn" ? "bg-yellow" : "bg-[#ffd6d6]"
        }`}
      >
        {text}
      </div>
    </div>
  );
}

/**
 * Daily only: brute-forcing a puzzle (way past par) gets a nudge, then a warning, then the
 * puzzle restarts. Every action counts — undo and reset don't wind the counter back.
 */
export function useMoveGuard(par: number) {
  const [attempt, setAttempt] = useState(0);
  const [count, setCount] = useState(0);
  const [wrecked, setWrecked] = useState(false);
  const limit = par * GUARD.wreck;

  const onAction = () => {
    const n = count + 1;
    if (n >= limit) {
      setAttempt(attempt + 1);
      setCount(0);
      setWrecked(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else setCount(n);
  };

  const mood: Mood | null =
    count >= par * GUARD.danger ? "danger" : count >= par * GUARD.warn ? "warn" : wrecked && count < par ? "wrecked" : null;
  return {
    /** remount key: bumps when the ship wrecks */
    key: attempt,
    onAction,
    banner: mood ? <Banner mood={mood} count={count} par={par} limit={limit} /> : null,
  };
}
