"use client";

import Link from "next/link";
import { BackHeader, ClientOnly } from "@/components/ui";
import { ROBOT_LEVELS } from "@/games/robot/levels";
import { THEMES } from "@/games/situation/data";
import { useProgress } from "@/lib/store";

function ModeCard({
  href,
  emoji,
  title,
  th,
  meta,
  accent,
}: {
  href: string;
  emoji: string;
  title: string;
  th: string;
  meta: React.ReactNode;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className="card group relative overflow-hidden p-4 transition active:scale-[0.97]"
      style={{ boxShadow: `inset 0 -3px 0 ${accent}` }}
    >
      <p className="text-3xl transition group-hover:scale-110">{emoji}</p>
      <p className="mt-2 font-display text-base leading-tight">{title}</p>
      <p className="text-xs text-muted">{th}</p>
      <p className="mt-2 text-xs" style={{ color: accent }}>
        {meta}
      </p>
    </Link>
  );
}

function Modes() {
  const games = useProgress((s) => s.games);
  const robotDone = ROBOT_LEVELS.filter((l) => games[`robot:${l.id}`]).length;
  const sitDone = THEMES.filter((s) => games[`situation:${s.id}`]).length;
  const logicWins = ["lights", "jugs", "nonogram", "hanoi"].reduce((a, g) => a + (games[`logic:${g}`]?.wins ?? 0), 0);
  return (
    <div className="grid grid-cols-2 gap-3">
      <ModeCard href="/robot" emoji="🤖" title="Robot Code" th="เขียนโปรแกรมพาหุ่นเก็บดาว" meta={`${robotDone}/${ROBOT_LEVELS.length} ด่าน`} accent="#ff5fcf" />
      <ModeCard href="/logic" emoji="🧩" title="Logic Lab" th="ปริศนาตรรกะ สุ่มไม่ซ้ำ" meta={`ชนะแล้ว ${logicWins} ครั้ง`} accent="#41e8ff" />
      <ModeCard href="/situation" emoji="🎯" title="Situations" th="ปัญหาเฉพาะหน้า วางแผนให้รอด" meta={`${sitDone}/${THEMES.length} สถานการณ์`} accent="#ffd84d" />
      <ModeCard href="/sprint" emoji="⚡" title="Speed Math" th="คิดเลขในใจ 60 วินาที" meta={`Best ${games.sprint?.bestScore ?? 0}`} accent="#3ddc97" />
    </div>
  );
}

export default function PlayPage() {
  return (
    <>
      <BackHeader title="🎮 Free Play" sub="ฝึกอิสระ — ไม่นับในแผนที่ Quest" />
      <ClientOnly fallback={<div className="h-80" />}>
        <Modes />
      </ClientOnly>
    </>
  );
}
