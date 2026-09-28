"use client";

import Link from "next/link";
import { BackHeader, ClientOnly, Stars } from "@/components/ui";
import { ROBOT_LEVELS } from "@/games/robot/levels";
import { useProgress } from "@/lib/store";

function Levels() {
  const games = useProgress((s) => s.games);
  return (
    <div className="grid grid-cols-2 gap-3">
      {ROBOT_LEVELS.map((lv, i) => {
        const stars = games[`robot:${lv.id}`]?.bestStars ?? 0;
        const unlocked = i === 0 || !!games[`robot:${ROBOT_LEVELS[i - 1].id}`];
        const body = (
          <>
            <p className="font-display text-xs text-pink">MISSION {String(i + 1).padStart(2, "0")}</p>
            <p className="mt-1 font-display leading-tight">{lv.title}</p>
            <p className="text-xs text-muted">{lv.titleEn}</p>
            <div className="mt-2">{unlocked ? <Stars n={stars} /> : <span className="text-sm">🔒</span>}</div>
          </>
        );
        return unlocked ? (
          <Link key={lv.id} href={`/robot/${lv.id}`} className="card p-4 active:scale-[0.97]">
            {body}
          </Link>
        ) : (
          <div key={lv.id} className="card p-4 opacity-40">
            {body}
          </div>
        );
      })}
    </div>
  );
}

export default function RobotList() {
  return (
    <>
      <BackHeader title="🤖 Robot Code" sub="เขียนโปรแกรมด้วยบล็อกคำสั่ง — ฝึกคิดแบบ algorithm" />
      <p className="mb-4 text-sm text-muted">
        ผ่านด่านก่อนหน้าเพื่อปลดล็อกด่านถัดไป ด่านหลังๆ ต้องใช้ recursion และเงื่อนไขสี — ยากจริงนะ 😤
      </p>
      <ClientOnly>
        <Levels />
      </ClientOnly>
    </>
  );
}
