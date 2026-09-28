"use client";

import Link from "next/link";
import { Nova } from "@/components/Nova";
import { ClientOnly } from "@/components/ui";
import { QUEST_NODES } from "@/games/quest/data";
import { chestId, nodeInfo, questView } from "@/games/quest/progress";
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

function QuestCard() {
  const games = useProgress((s) => s.games);
  const chests = useProgress((s) => s.chests);
  const view = questView(games);
  const node = QUEST_NODES[view.current];
  const done = QUEST_NODES.filter((n) => view.stars[n.id] > 0).length;
  const openable = view.islands.filter((i) => i.canOpen && !chests[chestId(i.island)]).length;
  const info = node && nodeInfo(node);
  return (
    <Link
      href="/quest"
      className="relative block overflow-hidden rounded-[1.25rem] bg-gradient-to-br from-yellow via-[#ff8a4d] to-pink p-[2px] active:scale-[0.98]"
    >
      <div className="rounded-[calc(1.25rem-2px)] bg-ink/80 p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-display text-xs tracking-widest text-yellow">TREASURE QUEST</p>
            <p className="mt-1 font-display text-2xl">🗺️ ล่าสมบัติ</p>
          </div>
          <span className="text-4xl">{node ? node.island.emoji : "🏆"}</span>
        </div>
        {node && info ? (
          <p className="mt-1 text-sm text-fg/80">
            {node.island.name} · ด่านต่อไป: {node.boss ? "👹 " : info.emoji + " "}
            {info.title}
          </p>
        ) : (
          <p className="mt-1 text-sm text-yellow">พิชิตครบทุกเกาะแล้ว!</p>
        )}
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-yellow to-pink" style={{ width: `${(done / QUEST_NODES.length) * 100}%` }} />
        </div>
        <p className="mt-1 text-[11px] text-muted">
          {done}/{QUEST_NODES.length} ด่าน
        </p>
        {openable > 0 && (
          <p className="mt-2 animate-pulse font-display text-sm text-yellow">🎁 มีหีบสมบัติรอเปิดอยู่ {openable} ใบ!</p>
        )}
        <span className="btn btn-primary mt-3 !min-h-10 text-sm">{done ? "ออกเดินทางต่อ →" : "เริ่มผจญภัย →"}</span>
      </div>
    </Link>
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
      <ClientOnly fallback={<div className="h-[420px] rounded-[1.25rem] bg-white/5" />}>
        <div className="space-y-4">
          <QuestCard />
          <DailyCard />
          <Nova />
        </div>
      </ClientOnly>
      <Link href="/play" className="card flex items-center gap-3 p-4 active:scale-[0.98]">
        <span className="text-3xl">🎮</span>
        <div className="flex-1">
          <p className="font-display">Free Play · ฝึกอิสระ</p>
          <p className="text-xs text-muted">เล่นเกมแยก ด่านสุ่ม และท้าเพื่อนด้วยลิงก์</p>
        </div>
        <span className="text-muted">→</span>
      </Link>
      <p className="pt-2 text-center text-xs text-muted">ไม่มีเฉลย · ไม่มี AI · มีแต่สมองเรา 🧠</p>
    </div>
  );
}
