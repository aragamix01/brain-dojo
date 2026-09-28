"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BackHeader, ClientOnly } from "@/components/ui";
import { ChestModal } from "@/games/quest/ChestModal";
import { ISLANDS, QUEST_NODES, type Island } from "@/games/quest/data";
import { chestId, nodeInfo, questView, type QuestView } from "@/games/quest/progress";
import { useProgress } from "@/lib/store";

const ROW = 96;
const DECOR: Record<string, string[]> = {
  beach: ["🌴", "🐚", "🦀", "⛵", "🌊"],
  jungle: ["🌿", "🐒", "🦜", "🍃", "🐍"],
  lagoon: ["🐙", "🐠", "🌀", "🐬", "🪸"],
  volcano: ["🔥", "🪨", "🌋", "☄️", "🦎"],
  dunes: ["🌵", "🐪", "☀️", "🦂", "🏺"],
  castle: ["🕯️", "🦇", "⚔️", "🗝️", "🕸️"],
};

/** Winding trail: x in %, y in px. */
const xAt = (i: number, isl: number) => 50 + 30 * Math.sin(i * 0.95 + isl * 1.3);

function Stars({ n }: { n: number }) {
  return (
    <span className="text-[11px] leading-none tracking-tighter">
      {[0, 1, 2].map((i) => (
        <span key={i} className={i < n ? "text-yellow" : "text-white/20"}>
          ★
        </span>
      ))}
    </span>
  );
}

function IslandMap({
  island,
  idx,
  view,
  currentRef,
  onChest,
}: {
  island: Island;
  idx: number;
  view: QuestView;
  currentRef: React.RefObject<HTMLAnchorElement | null>;
  onChest: () => void;
}) {
  const chests = useProgress((s) => s.chests);
  const info = view.islands[idx];
  const firstGlobal = QUEST_NODES.findIndex((n) => n.id === island.nodes[0].id);
  const reached = firstGlobal <= view.current;
  const points = [...island.nodes.map((_, i) => xAt(i, idx)), 50];
  // extra room below the chest so its label never touches the rounded edge
  const height = points.length * ROW + 64;
  const opened = !!chests[chestId(island)];
  const decor = DECOR[island.id] ?? [];

  return (
    <section
      className="relative mb-6 overflow-hidden rounded-[1.5rem] border border-white/10"
      style={{ background: `linear-gradient(180deg, ${island.color}22, transparent 40%), #16123a` }}
    >
      <div className="relative z-10 p-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{island.emoji}</span>
          <div className="flex-1">
            <p className="font-display text-xs tracking-widest" style={{ color: island.color }}>
              ISLAND {idx + 1} · {island.lesson.toUpperCase()}
            </p>
            <p className="font-display text-xl leading-tight">{island.name}</p>
            <p className="text-xs text-muted">{island.nameEn}</p>
          </div>
          <div className="text-right text-xs">
            <p className="font-display text-base text-yellow">★ {info.stars}</p>
            <p className="text-muted">/ {info.max}</p>
          </div>
        </div>
        {reached && <p className="mt-2 text-sm text-fg/80">{island.story}</p>}
      </div>

      <div className={`relative ${reached ? "" : "opacity-35 grayscale"}`} style={{ height }}>
        <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 100 ${height}`} preserveAspectRatio="none">
          <path
            d={points.map((x, i) => `${i ? "L" : "M"} ${x} ${i * ROW + ROW / 2}`).join(" ")}
            fill="none"
            stroke={island.color}
            strokeOpacity="0.55"
            strokeWidth="4"
            strokeDasharray="2 10"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {points.map((x, i) => (
          <span
            key={`d${i}`}
            className="pointer-events-none absolute text-xl opacity-60"
            style={{ left: `${x > 50 ? 10 : 84}%`, top: i * ROW + ROW / 2 - 12 }}
          >
            {decor[(i + idx) % decor.length]}
          </span>
        ))}

        {island.nodes.map((n, i) => {
          const g = firstGlobal + i;
          const stars = view.stars[n.id];
          const isCurrent = g === view.current;
          const locked = g > view.current;
          const meta = nodeInfo(n);
          const size = n.boss ? 76 : 60;
          const body = (
            <>
              <span
                className={`flex items-center justify-center rounded-full border-4 text-2xl shadow-lg transition ${
                  isCurrent ? "hint-ring scale-110" : ""
                }`}
                style={{
                  width: size,
                  height: size,
                  background: locked ? "#2a2550" : stars ? island.color : "#241d55",
                  borderColor: locked ? "#3a3470" : isCurrent ? "#fff" : island.color,
                  fontSize: n.boss ? 34 : 26,
                }}
              >
                {locked ? "🔒" : n.boss ? "👹" : meta.emoji}
              </span>
              <span className="mt-1 max-w-28 truncate rounded-full bg-ink/80 px-2 py-0.5 text-[11px] leading-tight">
                {n.boss && "BOSS · "}
                {meta.title}
              </span>
              {stars > 0 && <Stars n={stars} />}
              {isCurrent && (
                <span className="absolute -top-6 animate-bounce rounded-full bg-pink px-2 py-0.5 font-display text-[10px] text-white">
                  ▶ YOU
                </span>
              )}
            </>
          );
          const style = { left: `${points[i]}%`, top: i * ROW + ROW / 2 - size / 2 };
          return locked ? (
            <div key={n.id} className="absolute flex -translate-x-1/2 flex-col items-center" style={style}>
              {body}
            </div>
          ) : (
            <Link
              key={n.id}
              href={`/quest/${n.id}`}
              ref={isCurrent ? currentRef : undefined}
              className="absolute flex -translate-x-1/2 flex-col items-center active:scale-95"
              style={style}
            >
              {body}
            </Link>
          );
        })}

        {/* Treasure chest at the end of the island trail */}
        <button
          onClick={() => (info.canOpen ? onChest() : undefined)}
          className="absolute flex -translate-x-1/2 flex-col items-center"
          style={{ left: "50%", top: island.nodes.length * ROW + ROW / 2 - 40 }}
          aria-label="หีบสมบัติ"
        >
          <span
            className={`flex h-20 w-20 items-center justify-center rounded-3xl border-4 text-5xl ${
              info.canOpen && !opened ? "animate-bounce shadow-[0_0_30px_rgba(255,216,77,0.8)]" : ""
            }`}
            style={{
              borderColor: info.canOpen ? "#ffd84d" : "#3a3470",
              background: info.canOpen ? "#ffd84d33" : "#2a2550",
              filter: info.canOpen ? "none" : "grayscale(1)",
            }}
          >
            {opened ? "🎉" : "🎁"}
          </span>
          <span className="mt-1 rounded-full bg-ink/80 px-2 py-0.5 text-[11px]">
            {opened
              ? "เปิดแล้ว · แตะดูโค้ด"
              : info.canOpen
                ? "แตะเพื่อเปิด!"
                : info.complete
                  ? `ต้องการ ★ ${info.need} (มี ${info.stars})`
                  : `ต้องการ ★ ${info.need}`}
          </span>
        </button>
      </div>
      {info.complete && !info.canOpen && (
        <p className="px-4 pb-4 text-center text-xs text-yellow">
          ดาวยังไม่พอเปิดหีบ — กลับไปเล่นด่านที่ได้ดาวน้อยอีกรอบ (ใช้คำใบ้น้อยลง / ทำให้ถึง par)
        </p>
      )}
    </section>
  );
}

function QuestMap() {
  const games = useProgress((s) => s.games);
  const chests = useProgress((s) => s.chests);
  const openChest = useProgress((s) => s.openChest);
  const view = questView(games);
  const currentRef = useRef<HTMLAnchorElement | null>(null);
  const [chest, setChest] = useState<number | null>(null);
  const done = QUEST_NODES.filter((n) => view.stars[n.id] > 0).length;

  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: "center" });
  }, []);

  return (
    <>
      <div className="card mb-5 p-4">
        <div className="flex justify-between text-sm">
          <span>
            ผ่านแล้ว <b className="text-yellow">{done}</b> / {QUEST_NODES.length} ด่าน
          </span>
          <span className="text-muted">
            🎁 {ISLANDS.filter((isl) => chests[chestId(isl)]).length} / {ISLANDS.length}
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-good via-yellow to-pink"
            style={{ width: `${(done / QUEST_NODES.length) * 100}%` }}
          />
        </div>
      </div>

      {ISLANDS.map((isl, i) => (
        <IslandMap
          key={isl.id}
          island={isl}
          idx={i}
          view={view}
          currentRef={currentRef}
          onChest={() => {
            openChest(chestId(isl));
            setChest(i);
          }}
        />
      ))}

      {view.current >= QUEST_NODES.length && (
        <p className="card p-6 text-center font-display text-xl text-yellow">🏆 พิชิตสมบัติของกัปตันครบทุกเกาะแล้ว!</p>
      )}

      <p className="mt-6 text-center">
        <Link href="/quest/verify" className="text-xs text-muted underline">
          👨 สำหรับน้า: ตรวจโค้ดทวงรางวัล
        </Link>
      </p>

      {chest !== null && <ChestModal island={ISLANDS[chest]} index={chest} onClose={() => setChest(null)} />}
    </>
  );
}

export default function QuestPage() {
  return (
    <>
      <BackHeader title="🗺️ Treasure Quest" sub="ตามแผนที่ไปหาสมบัติของกัปตัน" />
      <ClientOnly>
        <QuestMap />
      </ClientOnly>
    </>
  );
}
