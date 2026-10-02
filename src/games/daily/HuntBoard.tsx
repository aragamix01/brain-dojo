"use client";

import Link from "next/link";
import { NovaTip } from "@/components/NovaTip";
import { dayKey } from "@/lib/date";
import { useProgress } from "@/lib/store";
import { HUNT, huntLabel, huntTotal } from "./hunt";

/** Star Hunt day: progress toward today's stars and where to go earn them. */
export function HuntBoard() {
  const today = dayKey();
  const hunt = useProgress((s) => s.hunt);
  const total = huntTotal(hunt, today);
  const counted = hunt?.day === today ? Object.entries(hunt.stars) : [];
  const pct = Math.min(100, (total / HUNT.target) * 100);

  return (
    <>
      <NovaTip id="hunt">
        วันอาทิตย์กับวันพุธเป็นวันล่าดาว! Daily วันนี้ไม่มีด่านให้เล่น — ไปเก็บดาวจากด่านใหม่บนแผนที่ หรือเกมสุ่มในลานฝึกดาบให้ครบ {HUNT.target} ดวง (ด่านที่เคยผ่านแล้วเล่นซ้ำไม่นับนะ)
        ครบเมื่อไหร่ Daily เคลียร์ทันที ⚔️ วันติดก็ขึ้นด้วย
      </NovaTip>
      <div className="card speedlines p-5">
        <p className="font-comic text-sm tracking-[2px] text-pink">STAR HUNT DAY</p>
        <p className="font-display text-2xl font-extrabold">⭐ วันล่าดาว</p>
        <p className="text-sm text-muted">เก็บดาวให้ครบ {HUNT.target} ดวงจากแผนที่หรือลานฝึกดาบ</p>

        <div className="mt-4 flex items-end justify-between">
          <p className="font-display text-4xl font-extrabold">
            {total}
            <span className="text-xl text-muted"> / {HUNT.target} ⭐</span>
          </p>
          <p className="text-xs font-bold text-muted">อีก {Math.max(0, HUNT.target - total)} ดวง</p>
        </div>
        <div className="mt-2 h-4 overflow-hidden rounded-full border-[2.5px] border-ink bg-white">
          <div className="h-full bg-yellow transition-all" style={{ width: `${pct}%` }} />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <Link href="/quest" className="btn btn-gold text-sm">
            🗺️ ล่าสมบัติ
          </Link>
          <Link href="/play" className="btn btn-cyan text-sm">
            ⚔️ ลานฝึกดาบ
          </Link>
        </div>

        {counted.length > 0 && (
          <div className="mt-5">
            <p className="mb-2 font-display text-sm font-bold">ดาวที่เก็บได้วันนี้</p>
            <ul className="space-y-1.5">
              {counted.map(([key, stars]) => (
                <li key={key} className="flex items-center justify-between rounded-xl bg-ink/5 px-3 py-2 text-sm">
                  <span>{huntLabel(key)}</span>
                  <span className="font-display font-bold text-gold">
                    {"★".repeat(stars)}
                    <span className="text-ink/20">{"★".repeat(3 - stars)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="mt-4 text-xs leading-relaxed text-muted">
          เกมสุ่ม (ลานฝึกดาบ, Robot สุ่มด่าน, Situations, Speed Math) นับเกมละครั้งต่อวัน เอาดาวที่ดีที่สุด · ด่านบนแผนที่กับ Robot ตามบท นับเฉพาะด่านที่ผ่านครั้งแรก เล่นซ้ำไม่นับ · จับเวลาตั้งแต่ดาวดวงแรก
        </p>
      </div>
    </>
  );
}
