"use client";

import Link from "next/link";
import { Nova } from "@/components/Nova";
import { ClientOnly } from "@/components/ui";
import { QUEST_NODES } from "@/games/quest/data";
import { chestId, nodeInfo, questView } from "@/games/quest/progress";
import { dayKey } from "@/lib/date";
import { rankFor } from "@/lib/rank";
import { liveStreak, useHydrated, useProgress } from "@/lib/store";

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <svg width="34" height="34" viewBox="0 0 34 34" fill="none" stroke="#1e2a3a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 14c0-6 5-10 11-10s11 4 11 10v3c0 2-1 3-3 3v4H9v-4c-2 0-3-1-3-3z" fill="#fff" />
        <circle cx="12.5" cy="14" r="2.6" fill="#1e2a3a" />
        <circle cx="21.5" cy="14" r="2.6" fill="#1e2a3a" />
        <path d="M13 24v4M17 24v4M21 24v4" />
        <path d="M4 9h26" stroke="#ff5a5f" strokeWidth="3.2" />
      </svg>
      <div className="leading-none">
        <h1 className="comic-title text-[30px]">BRAIN DOJO</h1>
        <p className="font-display text-xs font-extrabold italic tracking-[3px]">PIRATE CREW</p>
      </div>
    </div>
  );
}

function Wanted() {
  const p = useProgress();
  const rank = rankFor(p.xp);
  return (
    <div className="-rotate-[1.2deg] rounded-md border-[3px] border-ink bg-sand p-3 pb-3.5 shadow-[5px_5px_0_#1e2a3a]">
      <div className="flex gap-3.5">
        <div className="flex w-[104px] shrink-0 flex-col items-center gap-1.5">
          <span className="font-comic text-[26px] leading-none tracking-[2px]">WANTED</span>
          <div
            className="relative flex h-24 w-24 items-center justify-center border-[2.5px] border-ink"
            style={{ background: rank.color }}
          >
            <span className="font-comic text-[64px] leading-none text-white [-webkit-text-stroke:2px_#1e2a3a] [text-shadow:3px_3px_0_#1e2a3a]">
              {rank.name}
            </span>
            <span className="absolute -bottom-0.5 -right-0.5 bg-ink px-1.5 py-0.5 font-display text-[10px] font-bold text-yellow">
              RANK
            </span>
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <p className="truncate font-display text-[22px] font-extrabold leading-tight">{p.name || "ลูกเรือนิรนาม"}</p>
          <p className="font-display text-[13px] font-medium text-wood">{rank.title}</p>
          <div className="flex items-baseline gap-1.5 border-t-2 border-dashed border-[#b98a45] pt-1.5">
            <span className="font-display text-[11px] font-bold text-wood">ค่าหัว</span>
            <span className="font-comic text-[26px] leading-none tracking-wide">{p.xp.toLocaleString()} XP</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full border-2 border-ink bg-white">
            <div className="h-full bg-coral" style={{ width: `${rank.progress * 100}%` }} />
          </div>
          <p className="text-[11px] text-wood">
            {rank.next ? `อีก ${rank.next.minXp - p.xp} XP ถึง Rank ${rank.next.name} · ${rank.next.title}` : "ค่าหัวสูงสุดแล้ว!"}
          </p>
        </div>
      </div>
    </div>
  );
}

function Streak() {
  const p = useProgress();
  const hydrated = useHydrated();
  const streak = liveStreak(p);
  return (
    <div className="flex items-center gap-2 self-start rounded-full border-[2.5px] border-ink bg-white py-1.5 pl-2 pr-3.5 shadow-[3px_3px_0_#1e2a3a]">
      <svg width="24" height="24" viewBox="0 0 24 24" fill={streak ? "#ff8a3d" : "#d6dbe3"} stroke="#1e2a3a" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2c1 4 6 6 6 12a6 6 0 01-12 0c0-3 2-5 3-6 0 2 1 3 2 3 0-4-1-6 1-9z" />
      </svg>
      <span className="font-display text-[15px] font-bold">{hydrated ? streak : "–"} วันติด</span>
      <span className="text-xs text-muted">{streak ? "ออกเรือทุกวันไม่พลาด!" : "ออกเรือวันนี้เริ่มนับใหม่"}</span>
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
    <Link href="/quest" className="panel block overflow-hidden bg-white active:translate-y-0.5">
      <div className="flex items-center justify-between border-b-[3px] border-ink bg-yellow px-4 py-3">
        <div>
          <p className="font-comic text-[15px] tracking-[2px] text-[#b3261e]">TREASURE QUEST</p>
          <p className="font-display text-[26px] font-extrabold leading-tight">ล่าสมบัติ</p>
        </div>
        <svg width="54" height="54" viewBox="0 0 54 54" fill="none" stroke="#1e2a3a" strokeWidth="2.5" strokeLinejoin="round" aria-hidden="true">
          <path d="M8 24h38v22H8z" fill="#c8773a" />
          <path d="M8 24c0-10 8-14 19-14s19 4 19 14" fill="#e0934e" />
          <path d="M8 32h38" strokeWidth="2" />
          <rect x="22" y="28" width="10" height="10" rx="2" fill="#ffc93c" />
          <path d="M4 14l4 3M50 12l-4 4M27 2v5" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
      <div className="flex flex-col gap-2.5 p-4">
        {node && info ? (
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-[2.5px] border-ink text-xl"
              style={{ background: node.island.color }}
            >
              {node.island.emoji}
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-base font-bold">
                {node.island.name} · {node.island.nameEn}
              </p>
              <p className="truncate text-[13px] text-muted">
                ด่านต่อไป: {node.boss ? "BOSS · " : ""}
                {info.title}
              </p>
            </div>
          </div>
        ) : (
          <p className="font-display font-bold text-gold">พิชิตครบทุกเกาะแล้ว!</p>
        )}
        <div className="flex items-center gap-1.5">
          <span className="flex h-3.5 flex-1 overflow-hidden rounded-full border-[2.5px] border-ink bg-[#e8f6fd]">
            <span className="bg-ocean" style={{ width: `${(done / QUEST_NODES.length) * 100}%` }} />
          </span>
          <span className="font-display text-[13px] font-bold">
            {done}/{QUEST_NODES.length}
          </span>
        </div>
        {openable > 0 && (
          <p className="flex items-center gap-2 rounded-xl border-2 border-dashed border-[#e0934e] bg-panel-2 px-2.5 py-2 font-display text-[13px] font-bold text-[#b3261e]">
            <span className="animate-pulse">★</span> มีหีบสมบัติรอเปิด {openable} ใบ!
          </p>
        )}
        <span className="btn btn-primary !min-h-12 w-full text-lg font-extrabold">
          {done ? "ออกเรือต่อ!" : "เริ่มผจญภัย!"} →
        </span>
      </div>
    </Link>
  );
}

function DailyCard() {
  const done = useProgress((s) => s.daily[dayKey()]);
  return (
    <Link href="/daily" className="panel relative flex items-center gap-3.5 overflow-hidden bg-[#6f5cf0] p-4 text-white active:translate-y-0.5">
      <div className="flex flex-1 flex-col gap-1">
        <p className="font-comic text-sm tracking-[2px] text-[#ffe27a]">DAILY VOYAGE · {dayKey()}</p>
        <p className="font-display text-[22px] font-extrabold leading-tight">{done ? "เคลียร์แล้ววันนี้ ✔" : "ภารกิจประจำวัน"}</p>
        <p className="text-[13px] leading-snug text-[#f3f0ff]">
          {done ? "กลับมาใหม่พรุ่งนี้ หรือส่งผลไปท้าคนอื่น" : "3 ด่าน · ทุกคนได้โจทย์เดียวกัน · แข่งเวลากับน้าได้!"}
        </p>
        <span className="btn btn-gold mt-1.5 self-start text-[15px] font-extrabold">{done ? "ดูผล" : "เริ่มเลย"}</span>
      </div>
      <svg width="86" height="96" viewBox="0 0 86 96" fill="none" stroke="#1e2a3a" strokeWidth="2.5" strokeLinejoin="round" aria-hidden="true" className="animate-bob shrink-0">
        <path d="M42 6v62" />
        <path d="M44 10c18 4 28 16 30 32H44z" fill="#fff" />
        <path d="M40 18C26 22 16 32 14 46h26z" fill="#ffe27a" />
        <path d="M6 68h74l-10 18H16z" fill="#ff5a5f" />
        <path d="M42 6l14 5-14 4" fill="#2ec4b6" />
      </svg>
    </Link>
  );
}

export default function Home() {
  return (
    <div className="space-y-5">
      <div className="-mx-4 -mt-[max(1rem,env(safe-area-inset-top))]">
        <div className="sunburst flex flex-col gap-3.5 bg-sky px-4 pb-8 pt-[max(1.25rem,env(safe-area-inset-top))]">
          <div className="flex items-center justify-between">
            <Logo />
            <Link
              href="/progress"
              aria-label="Progress"
              className="flex h-11 w-11 items-center justify-center rounded-[14px] border-[2.5px] border-ink bg-white shadow-[3px_3px_0_#1e2a3a]"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1e2a3a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
                <path d="M14.5 9.5l-4 1-1 4 4-1z" fill="#ff5a5f" />
              </svg>
            </Link>
          </div>
          <ClientOnly fallback={<div className="h-[170px]" />}>
            <Wanted />
            <Streak />
          </ClientOnly>
        </div>
        <div className="wave-edge -mt-3.5" />
        <div className="h-1.5 bg-ocean" />
      </div>

      <ClientOnly fallback={<div className="h-[520px]" />}>
        <div className="space-y-5">
          <DailyCard />
          <QuestCard />
          <Nova />
        </div>
      </ClientOnly>

      <Link href="/play" className="card flex items-center gap-3 p-3.5 active:translate-y-0.5">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] border-[2.5px] border-ink bg-lagoon">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1e2a3a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14.5 3.5l6 6-9 9H5.5v-6z" fill="#fff" />
            <path d="M4 20l3-3" />
          </svg>
        </span>
        <div className="flex-1">
          <p className="font-display text-[17px] font-bold">ลานฝึกดาบ · Free Play</p>
          <p className="text-[13px] text-muted">เล่นเกมแยก ด่านสุ่ม ท้าเพื่อนด้วยลิงก์</p>
        </div>
        <span className="text-xl font-bold">›</span>
      </Link>
      <p className="pt-1 text-center font-display text-xs font-medium text-wood">ไม่มีเฉลย · ไม่มี AI · มีแต่สมองลูกเรือ</p>
    </div>
  );
}
