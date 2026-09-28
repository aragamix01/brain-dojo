"use client";

import Link from "next/link";
import { BackHeader, ClientOnly } from "@/components/ui";
import { LOGIC_GAMES } from "@/games/catalog";
import { ROBOT_LEVELS } from "@/games/robot/levels";
import { THEMES } from "@/games/situation/data";
import { useProgress } from "@/lib/store";

const LOGIC_ACCENT = ["#ffc93c", "#5cc8f5", "#ff7a9a", "#8e7cff"];

function ModeCard({
  href,
  emoji,
  title,
  th,
  meta,
  bg,
}: {
  href: string;
  emoji: string;
  title: string;
  th: string;
  meta: React.ReactNode;
  bg: string;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-[168px] flex-col gap-2 rounded-[18px] border-[3px] border-ink p-3 shadow-[4px_4px_0_#1e2a3a] transition active:translate-y-0.5 active:shadow-[2px_2px_0_#1e2a3a]"
      style={{ background: bg }}
    >
      <span className="flex h-[52px] w-[52px] items-center justify-center rounded-[14px] border-[2.5px] border-ink bg-white text-3xl transition group-hover:scale-110">
        {emoji}
      </span>
      <p className="font-display text-lg font-extrabold leading-tight">{title}</p>
      <p className="text-xs leading-snug">{th}</p>
      <span className="mt-auto self-start rounded-full bg-ink px-2.5 py-0.5 font-display text-[11px] font-bold text-white">
        {meta}
      </span>
    </Link>
  );
}

function Modes() {
  const games = useProgress((s) => s.games);
  const robotDone = ROBOT_LEVELS.filter((l) => games[`robot:${l.id}`]).length;
  const sitDone = THEMES.filter((s) => games[`situation:${s.id}`]).length;
  const logicWins = LOGIC_GAMES.reduce((a, g) => a + (games[`logic:${g.id}`]?.wins ?? 0), 0);
  return (
    <div className="grid grid-cols-2 gap-3.5">
      <ModeCard href="/robot" emoji="🤖" title="Robot Code" th="เขียนโปรแกรมพาหุ่นเก็บดาว" meta={`${robotDone}/${ROBOT_LEVELS.length} ด่าน`} bg="#ff7a9a" />
      <ModeCard href="/logic" emoji="🧩" title="Logic Lab" th="ปริศนาตรรกะ สุ่มไม่ซ้ำ" meta={`ชนะ ${logicWins} ครั้ง`} bg="#5cc8f5" />
      <ModeCard href="/situation" emoji="🎯" title="Situations" th="ปัญหาเฉพาะหน้า วางแผนให้รอด" meta={`${sitDone}/${THEMES.length} สถานการณ์`} bg="#ffc93c" />
      <ModeCard href="/sprint" emoji="⚡" title="Speed Math" th="คิดเลขในใจ 60 วินาที" meta={`Best ${games.sprint?.bestScore ?? 0}`} bg="#6ee0a8" />
    </div>
  );
}

export default function PlayPage() {
  return (
    <div className="space-y-5">
      <BackHeader title="FREE PLAY" sub="ลานฝึกดาบ — ไม่นับในแผนที่" comic />
      <p className="font-display text-[15px] font-extrabold">เลือกลูกเรือฝึกด้วย</p>
      <ClientOnly fallback={<div className="h-[350px]" />}>
        <Modes />
      </ClientOnly>

      <p className="pt-1 font-display text-[15px] font-extrabold">Logic Lab · เกาะปริศนา</p>
      <div className="flex flex-col gap-2.5">
        {LOGIC_GAMES.map((g, i) => (
          <Link
            key={g.id}
            href={`/logic/${g.id}`}
            className="flex min-h-14 items-center gap-3 rounded-2xl border-[2.5px] border-ink bg-white px-3.5 py-2.5 shadow-[3px_3px_0_#1e2a3a] active:translate-y-0.5"
          >
            <span className="h-10 w-3 shrink-0 rounded-md border-2 border-ink" style={{ background: LOGIC_ACCENT[i % LOGIC_ACCENT.length] }} />
            <div className="min-w-0 flex-1">
              <p className="font-display text-[15px] font-bold">
                {g.title} · {g.th}
              </p>
              <p className="truncate text-xs text-muted">{g.desc}</p>
            </div>
            <span className="text-xl font-bold">›</span>
          </Link>
        ))}
      </div>

      <div className="panel flex items-center gap-3 bg-cyan p-4 text-white">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
          <path d="M10 14a4 4 0 006 0l3-3a4 4 0 00-6-6l-1 1" />
          <path d="M14 10a4 4 0 00-6 0l-3 3a4 4 0 006 6l1-1" />
        </svg>
        <div>
          <p className="font-display text-base font-extrabold">ท้าดวลลูกเรือ</p>
          <p className="text-[13px] text-[#e8f6fd]">ในแต่ละเกม กด “ท้าเพื่อน” แล้วแชร์ลิงก์ ให้เพื่อนเล่นโจทย์เดียวกัน</p>
        </div>
      </div>
    </div>
  );
}
