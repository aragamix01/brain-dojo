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
 * After the Daily: what it earned in PC time. The parent pays it out from Weekly Life Quest:
 * 70% straight away, the last 30% once the week's check-in is sent.
 */
export function RewardNote({ r }: { r: DailyResult }) {
  return (
    <div className="mt-4 rounded-2xl border-[2.5px] border-dashed border-ink bg-yellow/40 p-4 text-center">
      <p className="font-display text-base font-extrabold">🎁 ได้เวลาคอม +{formatMinutes(rewardMinutes(rewardStars(r)))}</p>
      <p className="mt-1 text-xs leading-relaxed">
        ส่งเข้า <b>Weekly Life Quest</b> ให้แล้ว · ได้ 70% ทันที อีก 30% ปลดล็อกเมื่อส่ง<b>เช็กอินประจำสัปดาห์</b> · น้าแลกเป็นโค้ดให้
      </p>
      <Link href="/life" className="btn btn-ghost mt-2 w-full text-sm">
        📓 ไป Weekly Life Quest
      </Link>
    </div>
  );
}
