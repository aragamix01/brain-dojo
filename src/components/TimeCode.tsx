"use client";

import Link from "next/link";
import { useState } from "react";
import { formatMinutes, rewardMinutes, rewardStars } from "@/lib/kidtimer/reward";
import type { DailyResult } from "@/lib/store";

/** Big, copyable code. */
export function CodeDisplay({ code, minutes }: { code: string; minutes: number }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <p className="font-display text-sm">⏰ เวลาคอม {formatMinutes(minutes)}</p>
      <p className="mt-1 select-all rounded-xl border-[2.5px] border-ink bg-white py-3 font-mono text-2xl font-bold tracking-wider">
        {code}
      </p>
      <button
        className="btn btn-cyan mt-2 w-full text-sm"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
          } catch {
            /* clipboard blocked: the code is selectable */
          }
        }}
      >
        {copied ? "คัดลอกแล้ว ✔" : "📋 คัดลอกโค้ด"}
      </button>
    </div>
  );
}

/**
 * After the Daily: what it earned in PC time. No code here any more — the parent turns the week's
 * Dailies into one code from the report the player sends (so sending it is how the time gets paid).
 */
export function RewardNote({ r }: { r: DailyResult }) {
  return (
    <div className="mt-4 rounded-2xl border-[2.5px] border-dashed border-ink bg-yellow/40 p-4 text-center">
      <p className="font-display text-base font-extrabold">🎁 ได้เวลาคอม +{formatMinutes(rewardMinutes(rewardStars(r)))}</p>
      <p className="mt-1 text-xs leading-relaxed">
        สะสมไว้ก่อน · ไปหน้า 📊 Progress กด <b>ส่งลิงก์ผลงาน</b> หรือโชว์ <b>QR</b> ให้ผู้ปกครอง แล้วจะได้โค้ดเดียวรวมทุกวัน
      </p>
      <Link href="/progress" className="btn btn-ghost mt-2 w-full text-sm">
        📤 ไปส่งผลงาน
      </Link>
    </div>
  );
}
