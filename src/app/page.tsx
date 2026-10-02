"use client";

import Link from "next/link";
import { useState } from "react";
import { Nova } from "@/components/Nova";
import { ClientOnly } from "@/components/ui";
import { QUEST_NODES } from "@/games/quest/data";
import { chestId, nodeInfo, questView } from "@/games/quest/progress";
import { dayKey, weekOf } from "@/lib/date";
import { rankFor } from "@/lib/rank";
import { liveStreak, useHydrated, useProgress } from "@/lib/store";
import { RedDot, useDailyDot } from "@/components/RedDot";
import { CoinChip } from "@/components/game";
import { CoinSheet } from "@/components/CoinSheet";
import { COINS, questBounty, todayRemaining } from "@/lib/coins";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { title } from "@/lib/shop";
import { HUNT, huntTotal, isHuntDay } from "@/games/daily/hunt";
import { WHATS_NEW_ID, WhatsNew } from "@/components/WhatsNew";

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
          <p className="font-display text-[13px] font-medium text-wood">
            {title(p.equipped?.title) ? `「${title(p.equipped?.title)!.name}」 · ${rank.title}` : rank.title}
          </p>
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

/** Streak icon: two crossed cutlasses (grey when the streak has lapsed). */
function CrossedSwords({ active }: { active: boolean }) {
  const blade = active ? "#e8eef5" : "#d6dbe3";
  const hilt = active ? "#ffc93c" : "#c3c9d2";
  const sword = (flip: boolean) => (
    <g transform={flip ? "matrix(-1 0 0 1 24 0)" : undefined}>
      <path d="M3 2.5l1.8-.3 10.4 10.4-1.6 1.6L3.2 3.8z" fill={blade} />
      <path d="M11.2 16.8l5.6-5.6" stroke={hilt} strokeWidth="3.4" />
      <path d="M11.2 16.8l5.6-5.6" />
      <path d="M15.6 15.6l3.6 3.6" strokeWidth="3" stroke="#6b4a1f" />
      <circle cx="20.4" cy="20.4" r="1.6" fill={hilt} />
    </g>
  );
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1e2a3a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {sword(false)}
      {sword(true)}
    </svg>
  );
}

function Streak() {
  const p = useProgress();
  const hydrated = useHydrated();
  const streak = liveStreak(p);
  return (
    <div className="flex items-center gap-2 self-start rounded-full border-[2.5px] border-ink bg-white py-1.5 pl-2 pr-3.5 shadow-[3px_3px_0_#1e2a3a]">
      <CrossedSwords active={streak > 0} />
      <span className="whitespace-nowrap font-display text-[15px] font-bold">{hydrated ? streak : "–"} วันติด</span>
      <span className="text-xs text-muted">{streak ? "เล่น Daily ทุกวันไม่พลาด!" : "เล่น Daily วันนี้เริ่มนับ"}</span>
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
  const dot = useDailyDot("quest", openable > 0);
  return (
    <Link href="/quest" onClick={dot.clear} className="panel relative block bg-white active:translate-y-0.5">
      <RedDot show={dot.show} className="-right-2 -top-2" />
      <div className="flex items-center justify-between rounded-t-[1rem] border-b-[3px] border-ink bg-yellow px-4 py-3">
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
  // The daily dot stays until today's run is finished, not just tapped.
  const hydrated = useHydrated();
  const hunt = isHuntDay(dayKey());
  const huntStars = useProgress((s) => huntTotal(s.hunt, dayKey()));
  return (
    <Link href="/daily" className="panel relative flex items-center gap-3 bg-[#6f5cf0] p-4 text-white active:translate-y-0.5">
      <RedDot show={hydrated && !done} className="-right-2 -top-2" />
      <div className="flex flex-1 flex-col gap-1">
        <p className="whitespace-nowrap font-comic text-sm tracking-[2px] text-[#ffe27a]">
          DAILY VOYAGE · {dayKey().slice(8)}/{dayKey().slice(5, 7)}
        </p>
        <p className="font-display text-[22px] font-extrabold leading-tight">{done ? "เคลียร์แล้ววันนี้ ✔" : hunt ? "⭐ วันล่าดาว!" : "ภารกิจประจำวัน"}</p>
        <p className="text-[13px] leading-snug text-[#f3f0ff]">
          {done
            ? "กลับมาใหม่พรุ่งนี้ หรือส่งผลไปท้าคนอื่น"
            : hunt
              ? `เก็บดาวจากแผนที่หรือลานฝึก · ได้แล้ว ${huntStars}/${HUNT.target} ⭐`
              : "3 ด่าน · ทุกคนได้โจทย์เดียวกัน · แข่งเวลากับเพื่อนได้!"}
        </p>
        <span className="btn btn-gold mt-1.5 self-start text-[15px] font-extrabold">{done ? "ดูผล" : hunt ? "ไปล่าดาว" : "เริ่มเลย"}</span>
      </div>
      <div className="flex shrink-0 flex-col items-center gap-1.5">
        <svg width="76" height="84" viewBox="0 0 86 96" fill="none" stroke="#1e2a3a" strokeWidth="2.5" strokeLinejoin="round" aria-hidden="true" className="animate-bob">
          <path d="M42 6v62" />
          <path d="M44 10c18 4 28 16 30 32H44z" fill="#fff" />
          <path d="M40 18C26 22 16 32 14 46h26z" fill="#ffe27a" />
          <path d="M6 68h74l-10 18H16z" fill="#ff5a5f" />
          <path d="M42 6l14 5-14 4" fill="#2ec4b6" />
        </svg>
        <WeekFlames />
      </div>
    </Link>
  );
}

const WEEKDAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

/** One flame: lit orange when played, blue when a freeze covered it, faint when missed or still ahead. */
function Flame({ kind }: { kind: "play" | "freeze" | "miss" | "future" }) {
  const lit = kind === "play" || kind === "freeze";
  const colors = {
    play: { outer: "#ff8a3d", inner: "#ffd84d" },
    freeze: { outer: "#5cc8f5", inner: "#e6f7ff" },
    miss: { outer: "transparent", inner: "transparent" },
    future: { outer: "transparent", inner: "transparent" },
  }[kind];
  return (
    <svg width="15" height="18" viewBox="0 0 24 28" className={lit ? "animate-flicker" : ""} aria-hidden="true">
      <path
        d="M12 1c1.4 5 8 7.6 8 15a8 8 0 01-16 0c0-4 2.6-6.6 4-8 0 2.6 1.4 4 2.6 4 0-5.4-1.3-8 1.4-11z"
        fill={colors.outer}
        stroke={kind === "future" ? "rgba(255,255,255,0.4)" : kind === "miss" ? "#a9a1d9" : "#1e2a3a"}
        strokeWidth="2.2"
        strokeDasharray={kind === "future" ? "2 2" : undefined}
        strokeLinejoin="round"
      />
      {lit && (
        <path d="M12 12c.8 2.4 4 3.8 4 7.4a4 4 0 01-8 0c0-2.2 1.6-3.6 2.4-4.4.2 1.4.8 2 1.6 2 0-2.4-.8-3.4 0-5z" fill={colors.inner} />
      )}
    </svg>
  );
}

/** This week, Sunday to Saturday: which days kept the streak burning. */
function WeekFlames() {
  const p = useProgress();
  const today = dayKey();
  const days = weekOf(today);
  // Flames track Daily runs only; a streak freeze still paints its day blue.
  const markOf = (d: string) => (p.daily[d] ? "play" : p.activeDays?.[d] === "freeze" ? "freeze" : null);
  const lit = days.filter((d) => markOf(d)).length;
  return (
    <div className="flex gap-[3px]" aria-label={`สัปดาห์นี้เล่น Daily ${lit} จาก 7 วัน`}>
      {days.map((d, i) => {
        const kind = markOf(d) ?? (d >= today ? "future" : "miss");
        return (
          <div key={d} className="flex flex-col items-center">
            <Flame kind={kind} />
            <span
              className={`mt-0.5 font-display text-[8px] font-bold leading-none ${
                d === today ? "rounded-sm bg-yellow px-0.5 text-ink" : "text-[#d9d2ff]"
              }`}
            >
              {WEEKDAYS[i]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Today's collectable coins + unclaimed map bounties — tap for the full coin sheet. */
function BountyBanner() {
  const rewarded = useProgress((s) => s.rewarded);
  const coins = useProgress((s) => s.coins);
  const games = useProgress((s) => s.games);
  const [open, setOpen] = useState(false);
  const t = todayRemaining(rewarded, dayKey());
  const today = t.freePlay + (t.dailyFinish ? 1 : 0) + (t.dailyAllStars ? 1 : 0);
  const reach = questView(games).current;
  const onMap = QUEST_NODES.slice(0, reach + 1).reduce((a, n) => a + questBounty(rewarded, n.id, !!n.boss), 0);
  const full = coins >= COINS.cap;
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2.5 rounded-2xl border-[2.5px] border-ink bg-yellow px-3 py-2 text-left shadow-[3px_3px_0_#1e2a3a] active:translate-y-0.5"
      >
        <span className="animate-bounce text-2xl">🪙</span>
        <span className="flex-1 font-display text-sm font-bold leading-snug">
          {full ? (
            "กระเป๋าเหรียญเต็มแล้ว! ใช้ตอนติดได้เลย"
          ) : (
            <>
              วันนี้ยังมี <span className="text-base font-extrabold">🪙 {today}</span> รอเก็บ!
              {onMap > 0 && <span className="block text-xs font-medium">+ บนแผนที่อีก {onMap} เหรียญ</span>}
            </>
          )}
        </span>
        <span className="text-lg font-bold">›</span>
      </button>
      {open && <CoinSheet onClose={() => setOpen(false)} />}
    </>
  );
}

/** Announces new features once per batch (see WHATS_NEW_ID). */
function HomeWhatsNew() {
  const hydrated = useHydrated();
  const seen = useProgress((s) => !!s.seen[WHATS_NEW_ID]);
  const markSeen = useProgress((s) => s.markSeen);
  if (!hydrated || seen) return null;
  return <WhatsNew onClose={() => markSeen(WHATS_NEW_ID)} />;
}

/** Two side-by-side entries: the ship shop and the badge book. */
function ShopBadgeCards() {
  const badges = useProgress((s) => s.badges);
  const shopDot = useDailyDot("shop");
  const earned = ACHIEVEMENTS.filter((a) => badges[a.id]).length;
  return (
    <div className="grid grid-cols-2 gap-3">
      <Link href="/shop" onClick={shopDot.clear} className="card relative flex flex-col gap-1 p-3.5 active:translate-y-0.5">
        <RedDot show={shopDot.show} className="-right-2 -top-2" />
        <span className="text-3xl">🏪</span>
        <span className="font-display text-[15px] font-bold leading-tight">ร้านค้าบนเรือ</span>
        <span className="text-[12px] text-muted">สกินหุ่น · ฉายา · 🧊 กันไฟดับ</span>
      </Link>
      <Link href="/badges" className="card relative flex flex-col gap-1 p-3.5 active:translate-y-0.5">
        <span className="text-3xl">🏅</span>
        <span className="font-display text-[15px] font-bold leading-tight">สมุดตรา</span>
        <span className="text-[12px] text-muted">
          สะสมแล้ว {earned}/{ACHIEVEMENTS.length} ตรา
        </span>
      </Link>
    </div>
  );
}

/** Log book: stats, share codes and backups. Looks like a real button, with a daily dot. */
function ProgressButton() {
  const dot = useDailyDot("progress");
  return (
    <Link
      href="/progress"
      onClick={dot.clear}
      className="relative flex h-11 items-center gap-1.5 rounded-[14px] border-[2.5px] border-ink bg-yellow pl-2 pr-3 shadow-[3px_3px_0_#1e2a3a] transition active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_#1e2a3a]"
    >
      <RedDot show={dot.show} />
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1e2a3a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 12v7a1 1 0 001 1h12a1 1 0 001-1v-7" fill="#fff" />
        <path d="M12 3v12" />
        <path d="M7.5 7.5L12 3l4.5 4.5" stroke="#ff5a5f" />
      </svg>
      <span className="font-display text-sm font-extrabold">แชร์ผลงาน</span>
    </Link>
  );
}

function FreePlayLink({ children }: { children: React.ReactNode }) {
  const dot = useDailyDot("play");
  return (
    <Link href="/play" onClick={dot.clear} className="card relative flex items-center gap-3 p-3.5 active:translate-y-0.5">
      <RedDot show={dot.show} className="-right-2 -top-2" />
      {children}
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
            <ProgressButton />
          </div>
          <ClientOnly fallback={<div className="h-[170px]" />}>
            <Wanted />
            <div className="flex items-center justify-between gap-2">
              <Streak />
              <CoinChip className="bg-white" />
            </div>
            <BountyBanner />
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

      <ClientOnly fallback={<div className="h-[92px]" />}>
        <ShopBadgeCards />
        <HomeWhatsNew />
      </ClientOnly>
      <FreePlayLink>
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
      </FreePlayLink>
      <p className="pt-1 text-center font-display text-xs font-medium text-wood">ไม่มีเฉลย · ไม่มี AI · มีแต่สมองลูกเรือ</p>
    </div>
  );
}
