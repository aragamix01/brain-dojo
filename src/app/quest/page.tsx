"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { BackHeader, ClientOnly } from "@/components/ui";
import { ChestModal } from "@/games/quest/ChestModal";
import { QUEST_GUIDE_ID, QuestGuide } from "@/games/quest/QuestGuide";
import { ISLAND_ART, SeaSprite, ShipMarker } from "@/games/quest/SeaArt";
import { WorldMap } from "@/games/quest/WorldMap";
import { ISLANDS, QUEST_NODES, type Island } from "@/games/quest/data";
import { chestId, nodeInfo, questView, type QuestView } from "@/games/quest/progress";
import { questBounty } from "@/lib/coins";
import { useHydrated, useProgress } from "@/lib/store";

const ROW = 96;

/** Winding trail: x in %, y in px. */
const xAt = (i: number, isl: number) => 50 + 30 * Math.sin(i * 0.95 + isl * 1.3);

function Stars({ n }: { n: number }) {
  return (
    <span className="mt-0.5 rounded-full bg-white/80 px-1 text-[12px] leading-none tracking-tighter">
      {[0, 1, 2].map((i) => (
        <span key={i} className={i < n ? "text-yellow [text-shadow:1px_1px_0_#1e2a3a]" : "text-ink/25"}>
          ★
        </span>
      ))}
    </span>
  );
}

function BountyBadge({ n }: { n: number }) {
  return (
    <span className="animate-bob absolute -left-3 -top-2 z-10 rounded-full border-2 border-ink bg-yellow px-1.5 py-0.5 font-display text-[11px] font-extrabold shadow-[1px_2px_0_#1e2a3a]">
      +{n}🪙
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
  const rewarded = useProgress((s) => s.rewarded);
  const info = view.islands[idx];
  const firstGlobal = QUEST_NODES.findIndex((n) => n.id === island.nodes[0].id);
  const reached = firstGlobal <= view.current;
  const points = [...island.nodes.map((_, i) => xAt(i, idx)), 50];
  // extra room below the chest so its label never touches the rounded edge
  const height = points.length * ROW + 64;
  const opened = !!chests[chestId(island)];
  const art = ISLAND_ART[island.id] ?? ISLAND_ART.beach;

  return (
    <section id={`island-${island.id}`} className="panel sea relative mb-7 scroll-mt-4 overflow-hidden">
      <div className="relative z-10 border-b-[3px] border-ink bg-sand p-4">
        <div className="flex items-center gap-3">
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[45%_55%_40%_60%] border-[3px] border-ink text-3xl shadow-[0_4px_0_#1e2a3a]"
            style={{ background: island.color }}
          >
            {island.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-comic text-sm tracking-[2px] text-[#b3261e]">
              ISLAND {idx + 1} · {island.lesson.toUpperCase()}
            </p>
            <p className="font-display text-xl font-extrabold leading-tight">{island.name}</p>
            <p className="font-display text-xs font-medium text-wood">{island.nameEn}</p>
          </div>
          <div className="rounded-full border-[2.5px] border-ink bg-yellow px-3 py-1 text-center shadow-[2px_2px_0_#1e2a3a]">
            <p className="font-display text-sm font-extrabold leading-tight">
              ★ {info.stars}
              <span className="text-xs font-medium">/{info.max}</span>
            </p>
          </div>
        </div>
        {reached && <p className="mt-2 text-sm leading-relaxed">{island.story}</p>}
      </div>

      <div className={`relative ${reached ? "" : "opacity-50 grayscale"}`} style={{ height }}>
        <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 100 ${height}`} preserveAspectRatio="none">
          <path
            d={points
              .map((x, i) => {
                const y = i * ROW + ROW / 2;
                // smooth S-curves with vertical tangents at every stage
                return i ? `C ${points[i - 1]} ${y - ROW / 2}, ${x} ${y - ROW / 2}, ${x} ${y}` : `M ${x} ${y}`;
              })
              .join(" ")}
            fill="none"
            stroke="#1e2a3a"
            strokeWidth="4"
            strokeDasharray="2 12"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {points.map((x, i) => {
          const right = x <= 50;
          const side = (pad: string) => ({ left: right ? "auto" : pad, right: right ? pad : "auto" });
          // a big creature only where the trail swings far enough away to leave room
          const roomy = Math.abs(x - 50) > 16;
          if (roomy && (i === 1 || i === 6))
            return (
              <SeaSprite
                key={`d${i}`}
                kind={i === 1 ? art.hero : art.small[idx % art.small.length] === "gulls" ? "wave" : art.hero}
                className={`pointer-events-none absolute w-28 ${art.hero === "kraken" && i === 1 ? "" : "animate-bob"}`}
                style={{ ...side("1%"), top: i * ROW + ROW / 2 - 52 }}
              />
            );
          return (
            <SeaSprite
              key={`d${i}`}
              kind={art.small[(i + idx) % art.small.length]}
              className="pointer-events-none absolute w-14"
              style={{ ...side("4%"), top: i * ROW + ROW / 2 - 18 }}
            />
          );
        })}

        {island.nodes.map((n, i) => {
          const g = firstGlobal + i;
          const stars = view.stars[n.id];
          const isCurrent = g === view.current;
          const locked = g > view.current;
          const meta = nodeInfo(n);
          const size = n.boss ? 88 : 70;
          const body = (
            <>
              <span
                className={`flex items-center justify-center border-[3px] border-ink text-2xl transition ${
                  isCurrent ? "scale-110 shadow-[0_5px_0_#1e2a3a,0_0_0_8px_rgba(255,201,60,0.75)]" : "shadow-[0_5px_0_#1e2a3a]"
                }`}
                style={{
                  width: size,
                  height: size * 0.72,
                  borderRadius: ["50% 50% 45% 55%", "55% 45% 50% 50%", "45% 55% 40% 60%", "50% 50% 55% 45%"][i % 4],
                  background: locked
                    ? `color-mix(in srgb, ${island.color} 28%, #f2e3b3)`
                    : n.boss
                      ? "#b9a6ff"
                      : stars
                        ? island.color
                        : `color-mix(in srgb, ${island.color} 55%, #fff)`,
                  fontSize: n.boss ? 34 : 26,
                }}
              >
                {locked ? "🔒" : n.boss ? "👹" : meta.emoji}
              </span>
              <span
                className={`mt-1.5 max-w-28 truncate rounded-lg border-2 border-ink px-2 py-0.5 font-display text-[11px] font-bold leading-tight ${
                  n.boss ? "bg-[#b3261e] text-white" : "bg-white"
                }`}
              >
                {n.boss && "BOSS · "}
                {meta.title}
              </span>
              {stars > 0 && <Stars n={stars} />}
              {isCurrent && <ShipMarker className="animate-bob absolute -right-11 top-1 h-12 w-12" />}
              {!locked && questBounty(rewarded, n.id, !!n.boss) > 0 && (
                <BountyBadge n={questBounty(rewarded, n.id, !!n.boss)} />
              )}
            </>
          );
          const style = { left: `${points[i]}%`, top: i * ROW + ROW / 2 - size * 0.36 };
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
            className={`flex h-20 w-20 items-center justify-center rounded-3xl border-[3px] border-ink text-5xl shadow-[0_5px_0_#1e2a3a] ${
              info.canOpen && !opened ? "animate-bounce" : ""
            }`}
            style={{
              background: info.canOpen ? "#ffc93c" : "#e3e7ee",
              filter: info.canOpen ? "none" : "grayscale(1)",
            }}
          >
            {opened ? "🎉" : "🎁"}
          </span>
          <span className="mt-1.5 rounded-lg border-2 border-ink bg-white px-2 py-0.5 font-display text-[11px] font-bold">
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
        <p className="relative mx-4 mb-4 rounded-xl border-2 border-ink bg-white px-3 py-2 text-center font-display text-xs font-bold text-[#b3261e]">
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
  // First visit opens the guide automatically; afterwards it lives behind the help button.
  const hydrated = useHydrated();
  const guideSeen = useProgress((s) => !!s.seen[QUEST_GUIDE_ID]);
  const markSeen = useProgress((s) => s.markSeen);
  const [guideOpen, setGuideOpen] = useState(false);
  const showGuide = guideOpen || (hydrated && !guideSeen);

  return (
    <>
      <div className="card mb-6 p-4">
        <div className="flex justify-between text-sm">
          <span>
            ผ่านแล้ว <b className="font-display text-base">{done}</b> / {QUEST_NODES.length} ด่าน
          </span>
          <span className="text-muted">
            🎁 {ISLANDS.filter((isl) => chests[chestId(isl)]).length} / {ISLANDS.length}
          </span>
        </div>
        <div className="mt-2 h-3.5 overflow-hidden rounded-full border-[2.5px] border-ink bg-[#e8f6fd]">
          <div
            className="h-full bg-ocean"
            style={{ width: `${(done / QUEST_NODES.length) * 100}%` }}
          />
        </div>
        <button
          className="mt-3 w-full rounded-xl border-2 border-dashed border-ink/40 py-1.5 font-display text-sm font-bold text-ink/80"
          onClick={() => setGuideOpen(true)}
        >
          ❓ วิธีเล่น · ได้อะไรบ้าง
        </button>
      </div>

      <WorldMap view={view} />

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
        <p className="card bg-yellow p-6 text-center font-display text-xl font-extrabold">🏆 พิชิตสมบัติของกัปตันครบทุกเกาะแล้ว!</p>
      )}

      <p className="mt-6 text-center">
        <Link href="/quest/verify" className="text-xs text-muted underline">
          👨 สำหรับน้า: ตรวจโค้ดทวงรางวัล
        </Link>
      </p>

      {chest !== null && <ChestModal island={ISLANDS[chest]} index={chest} onClose={() => setChest(null)} />}

      {showGuide && (
        <QuestGuide
          onClose={() => {
            markSeen(QUEST_GUIDE_ID);
            setGuideOpen(false);
          }}
        />
      )}
    </>
  );
}

export default function QuestPage() {
  return (
    <>
      <BackHeader title="TREASURE MAP" sub="แผนที่ล่าสมบัติของกัปตัน" comic />
      <ClientOnly>
        <QuestMap />
      </ClientOnly>
    </>
  );
}
