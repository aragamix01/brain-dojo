"use client";

import Link from "next/link";
import { BackHeader, ClientOnly, Stars } from "@/components/ui";
import { LOGIC_GAMES } from "@/games/catalog";
import { useProgress } from "@/lib/store";

export default function LogicList() {
  const games = useProgress((s) => s.games);
  return (
    <>
      <BackHeader title="🧩 Logic Lab" sub="ปริศนาตรรกะ — สุ่มโจทย์ใหม่ทุกครั้ง ไม่มีเฉลยให้ค้น" href="/play" />
      <div className="space-y-3">
        {LOGIC_GAMES.map((g) => {
          const stat = games[`logic:${g.id}`];
          return (
            <Link key={g.id} href={`/logic/${g.id}`} className="card flex items-center gap-4 p-4 active:scale-[0.98]">
              <span className="text-4xl">{g.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg leading-tight">{g.title}</p>
                <p className="text-xs text-cyan">{g.th}</p>
                <p className="mt-1 text-xs text-muted">{g.desc}</p>
              </div>
              <ClientOnly>
                {stat && (
                  <div className="text-right text-xs text-muted">
                    <Stars n={stat.bestStars} size="text-sm" />
                    <p>ชนะ {stat.wins}</p>
                  </div>
                )}
              </ClientOnly>
            </Link>
          );
        })}
      </div>
    </>
  );
}
