"use client";

import Link from "next/link";
import { useState } from "react";
import { WhatsNew } from "./WhatsNew";
import { COINS, todayRemaining } from "@/lib/coins";
import { dayKey } from "@/lib/date";
import { liveStreak, useProgress } from "@/lib/store";

/** Most coins the daily-limited sources can pay: Free Play cap + Daily finish + Daily all-3★. */
const DAILY_MAX = COINS.freePlayPerDay + 2;

const TIPS = [
  "คิดเองให้ครบ 30 วิก่อน — ส่วนใหญ่จะเห็นทางเองโดยไม่ต้องใช้คำใบ้",
  "ใช้ Undo, เริ่มใหม่ และท่าไล่ไฟให้หมดก่อน พวกนี้ฟรีและไม่หักดาว",
  "คำใบ้ฟรี 2 ครั้งแรกของแต่ละด่านไม่เสียเหรียญ เก็บเหรียญไว้ใช้ตอนติดหนักจริงๆ",
  "ด่านบนแผนที่ที่ยังไม่ได้ 3★ กลับไปเล่นให้ได้ 3★ รับเหรียญเพิ่มได้",
];

function Row({ icon, label, value, done }: { icon: string; label: string; value: string; done?: boolean }) {
  return (
    <li className={`flex items-center justify-between gap-2 py-1.5 ${done ? "text-muted line-through" : ""}`}>
      <span>
        <span className="mr-1.5">{icon}</span>
        {label}
      </span>
      <span className="font-display font-bold">{value}</span>
    </li>
  );
}

/** Wallet details: balance, what can still be earned today, where coins come from, and tips. */
export function CoinSheet({ onClose }: { onClose: () => void }) {
  const [guide, setGuide] = useState(false);
  const coins = useProgress((s) => s.coins);
  const rewarded = useProgress((s) => s.rewarded);
  const streak = useProgress((s) => liveStreak(s));
  const today = todayRemaining(rewarded, dayKey());
  const room = COINS.cap - coins;
  const todayTotal = today.freePlay + (today.dailyFinish ? 1 : 0) + (today.dailyAllStars ? 1 : 0);
  const toWeekBonus = 7 - (streak % 7);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 p-3 sm:items-center" onClick={onClose}>
      <div
        className="panel animate-pop max-h-[90dvh] w-full max-w-md overflow-y-auto bg-white p-5"
        role="dialog"
        aria-modal="true"
        aria-label="เหรียญคำใบ้"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-ink bg-yellow text-3xl shadow-[0_4px_0_#1e2a3a]">
            🪙
          </span>
          <div className="flex-1">
            <p className="font-display text-xl font-extrabold">เหรียญคำใบ้</p>
            <p className="text-sm text-muted">
              มี <b className="text-fg">{coins}</b> / {COINS.cap} ·{" "}
              {room > 0 ? `ว่างอีก ${room}` : "กระเป๋าเต็ม — ใช้ก่อนถึงเก็บเพิ่มได้"}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border-[2.5px] border-ink bg-sand p-3">
          <p className="font-comic text-sm tracking-[2px] text-[#b3261e]">DAILY BOUNTY</p>
          <div className="my-2 flex flex-wrap gap-1.5" aria-hidden="true">
            {Array.from({ length: DAILY_MAX }, (_, i) => {
              const collected = i < DAILY_MAX - todayTotal;
              return (
                <span
                  key={i}
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-[2.5px] text-base ${
                    collected
                      ? "border-ink/30 bg-white text-ink/30"
                      : "animate-bounce border-ink bg-yellow shadow-[0_3px_0_#1e2a3a]"
                  }`}
                  style={collected ? undefined : { animationDelay: `${i * 90}ms`, animationDuration: "1.6s" }}
                >
                  {collected ? "✔" : "🪙"}
                </span>
              );
            })}
          </div>
          <p className="font-display font-bold">
            วันนี้เก็บได้อีก <span className="text-lg">🪙 {Math.min(todayTotal, room)}</span>
            {todayTotal > room && <span className="text-xs font-medium text-muted"> (กระเป๋าเหลือที่แค่ {room})</span>}
          </p>
          <ul className="mt-1 text-sm">
            <Row icon="⚔️" label="3★ ในลานฝึกดาบ" value={`${today.freePlay} / ${COINS.freePlayPerDay}`} done={!today.freePlay} />
            <Row icon="📅" label="เล่น Daily จบ" value={today.dailyFinish ? "+1" : "✔ รับแล้ว"} done={!today.dailyFinish} />
            <Row icon="⭐" label="Daily 3★ ทุกด่าน" value={today.dailyAllStars ? "+1" : "✔ รับแล้ว"} done={!today.dailyAllStars} />
          </ul>
          <p className="mt-1 text-xs text-muted">
            + รางวัลบนแผนที่ไม่จำกัดต่อวัน · อีก {toWeekBonus} วันติดได้โบนัส 🔥 +2
          </p>
        </div>

        <p className="mt-4 font-display font-bold">หาเหรียญได้จาก</p>
        <ul className="mt-1 text-sm">
          <Row icon="🗺️" label="3★ ครั้งแรกของแต่ละด่านบนแผนที่" value="+1" />
          <Row icon="👹" label="ชนะบอสครั้งแรก" value="+2" />
          <Row icon="🎁" label="เปิดหีบสมบัติ" value="+3" />
          <Row icon="⚔️" label={`3★ ในลานฝึกดาบ (วันละ ${COINS.freePlayPerDay})`} value="+1" />
          <Row icon="📅" label="Daily เล่นจบ / 3★ ทุกด่าน" value="+1 / +1" />
          <Row icon="🔥" label="เล่นต่อเนื่องครบทุก 7 วัน" value="+2" />
        </ul>

        <p className="mt-4 font-display font-bold">💡 คำแนะนำ</p>
        <ul className="mt-1 space-y-1.5 text-sm leading-relaxed">
          <li>
            ทุกด่านมีคำใบ้ <b>ฟรี {COINS.freePerPuzzle} ครั้ง</b> ครั้งต่อไปใช้ 🪙 1 เหรียญ — และทุกคำใบ้หักดาว
          </li>
          {TIPS.map((t) => (
            <li key={t} className="flex gap-2">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-coral" />
              <span>{t}</span>
            </li>
          ))}
        </ul>

        <button
          className="mt-4 w-full rounded-xl border-2 border-dashed border-ink/40 py-1.5 font-display text-sm font-bold text-ink/80"
          onClick={() => setGuide(true)}
        >
          ❓ วิธีใช้เหรียญ · ร้านค้า · ตรา
        </button>

        <div className="mt-3 flex gap-2">
          <Link href="/quest" className="btn btn-gold flex-1 text-sm" onClick={onClose}>
            🗺️ ไปหาเหรียญ
          </Link>
          <button className="btn btn-ghost flex-1 text-sm" onClick={onClose}>
            ปิด
          </button>
        </div>
      </div>
      {guide && <WhatsNew onClose={() => setGuide(false)} />}
    </div>
  );
}
