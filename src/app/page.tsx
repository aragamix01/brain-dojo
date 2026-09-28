"use client";

import Link from "next/link";
import { Nova } from "@/components/Nova";
import { ClientOnly } from "@/components/ui";
import { ROBOT_LEVELS } from "@/games/robot/levels";
import { SCENARIOS } from "@/games/situation/data";
import { dayKey } from "@/lib/date";
import { rankFor } from "@/lib/rank";
import { liveStreak, useHydrated, useProgress } from "@/lib/store";

function Header() {
  const p = useProgress();
  const hydrated = useHydrated();
  const rank = rankFor(p.xp);
  const streak = liveStreak(p);
  return (
    <div className="card speedlines relative overflow-hidden p-4">
      <div className="flex items-center gap-3">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl font-display text-3xl font-semibold"
          style={{ background: `${rank.color}22`, color: rank.color, border: `2px solid ${rank.color}` }}
        >
          {rank.name}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg leading-tight">{p.name || "Player"}</p>
          <p className="text-xs text-muted">
            Rank {rank.name} · {rank.title}
          </p>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-pink to-cyan" style={{ width: `${rank.progress * 100}%` }} />
          </div>
          <p className="mt-0.5 text-[11px] text-muted">
            {p.xp} XP{rank.next ? ` · อีก ${rank.next.minXp - p.xp} XP ถึง Rank ${rank.next.name}` : " · MAX"}
          </p>
        </div>
        <div className="text-center">
          <p className={`text-2xl ${streak ? "" : "grayscale"}`}>🔥</p>
          <p className="font-display text-lg leading-none">{hydrated ? streak : "–"}</p>
          <p className="text-[10px] text-muted">day streak</p>
        </div>
      </div>
    </div>
  );
}

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
  const sitDone = SCENARIOS.filter((s) => games[`situation:${s.id}`]).length;
  const logicWins = ["lights", "jugs", "nonogram", "hanoi"].reduce((a, g) => a + (games[`logic:${g}`]?.wins ?? 0), 0);
  return (
    <div className="grid grid-cols-2 gap-3">
      <ModeCard href="/robot" emoji="🤖" title="Robot Code" th="เขียนโปรแกรมพาหุ่นเก็บดาว" meta={`${robotDone}/${ROBOT_LEVELS.length} ด่าน`} accent="#ff5fcf" />
      <ModeCard href="/logic" emoji="🧩" title="Logic Lab" th="ปริศนาตรรกะ สุ่มไม่ซ้ำ" meta={`ชนะแล้ว ${logicWins} ครั้ง`} accent="#41e8ff" />
      <ModeCard href="/situation" emoji="🎯" title="Situations" th="ปัญหาเฉพาะหน้า วางแผนให้รอด" meta={`${sitDone}/${SCENARIOS.length} สถานการณ์`} accent="#ffd84d" />
      <ModeCard href="/sprint" emoji="⚡" title="Speed Math" th="คิดเลขในใจ 60 วินาที" meta={`Best ${games.sprint?.bestScore ?? 0}`} accent="#3ddc97" />
    </div>
  );
}

function DailyCard() {
  const done = useProgress((s) => s.daily[dayKey()]);
  return (
    <Link
      href="/daily"
      className="relative block overflow-hidden rounded-[1.25rem] bg-gradient-to-br from-pink via-[#9b5cff] to-[#4d7cff] p-[2px] active:scale-[0.98]"
    >
      <div className="speedlines rounded-[calc(1.25rem-2px)] bg-ink/70 p-4">
        <p className="font-display text-xs tracking-widest text-yellow">DAILY QUEST · {dayKey()}</p>
        <p className="mt-1 font-display text-2xl">{done ? "เคลียร์แล้ววันนี้ ✔" : "ภารกิจประจำวัน"}</p>
        <p className="text-sm text-fg/80">
          {done ? "กลับมาใหม่พรุ่งนี้ หรือส่งผลไปท้าคนอื่น" : "3 ด่าน · ทุกคนได้โจทย์เดียวกัน · แข่งเวลากับน้าได้!"}
        </p>
        <span className="btn btn-primary mt-3 !min-h-10 text-sm">{done ? "ดูผล" : "เริ่มเลย →"}</span>
      </div>
    </Link>
  );
}

export default function Home() {
  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="font-display text-3xl font-semibold">
          Brain <span className="text-pink glow-text">Dojo</span>
        </h1>
        <Link href="/progress" className="text-sm text-muted underline-offset-4 hover:underline">
          📊 Progress
        </Link>
      </div>
      <ClientOnly fallback={<div className="card h-[108px]" />}>
        <Header />
      </ClientOnly>
      <ClientOnly fallback={<div className="h-[170px] rounded-[1.25rem] bg-white/5" />}>
        <DailyCard />
        <div className="mt-4">
          <Nova />
        </div>
      </ClientOnly>
      <ClientOnly fallback={<div className="h-80" />}>
        <Modes />
      </ClientOnly>
      <p className="pt-2 text-center text-xs text-muted">ไม่มีเฉลย · ไม่มี AI · มีแต่สมองเรา 🧠</p>
    </div>
  );
}
