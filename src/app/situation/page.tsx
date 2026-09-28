"use client";

import Link from "next/link";
import { BackHeader, ClientOnly, Stars } from "@/components/ui";
import { SCENARIOS } from "@/games/situation/data";
import { useProgress } from "@/lib/store";

export default function SituationList() {
  const games = useProgress((s) => s.games);
  return (
    <>
      <BackHeader title="🎯 Situations" sub="ปัญหาเฉพาะหน้า — ไม่มีคำตอบเดียว แต่มีคำตอบที่ดีที่สุด" />
      <div className="space-y-3">
        {SCENARIOS.map((sc) => (
          <Link key={sc.id} href={`/situation/${sc.id}`} className="card flex items-center gap-3 p-4 active:scale-[0.98]">
            <span className="text-3xl">{sc.kind === "budget" ? "🎒" : "⏱️"}</span>
            <div className="min-w-0 flex-1">
              <p className="font-display leading-tight">{sc.title}</p>
              <p className="text-xs text-muted">
                {sc.titleEn} · {sc.kind === "budget" ? "เลือกของให้คุ้ม" : "จัดลำดับงาน"}
              </p>
            </div>
            <ClientOnly>
              <Stars n={games[`situation:${sc.id}`]?.bestStars ?? 0} size="text-sm" />
            </ClientOnly>
          </Link>
        ))}
      </div>
    </>
  );
}
