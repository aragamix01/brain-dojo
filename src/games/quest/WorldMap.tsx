"use client";

import Link from "next/link";
import { ISLANDS, QUEST_NODES } from "./data";
import { nodeInfo, type QuestView } from "./progress";
import { SeaSprite } from "./SeaArt";

const INK = "#1e2a3a";
const W = 390;
const H = 800;

/** Island centers on the world map, bottom (start) to top (boss castle). */
const SPOTS: [number, number][] = [
  [92, 705],
  [290, 590],
  [100, 440],
  [294, 305],
  [106, 160],
  [286, 68],
];
const ROUTE = "M92 705 C200 690,300 670,290 590 S110 530,100 440 S280 380,294 305 S120 240,106 160 S230 80,286 68";
const BLOB = "M-50 -4C-50 -30-20-36 4-35C32-34 52-24 51 0C50 24 26 35 0 35C-28 35-50 19-50-4Z";

const pct = (x: number, y: number) => ({ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%` });

function IslandIcon({ id }: { id: string }) {
  switch (id) {
    case "beach":
      return (
        <g transform="translate(-20 -22)">
          <path d="M6 30l8-4 12 2 8-4" />
          <path d="M14 26l4-14 10 10z" fill="#fff" />
          <path d="M18 12v14" />
        </g>
      );
    case "jungle":
      return (
        <g transform="translate(-21 -24) scale(1.05)" strokeLinecap="round">
          <path d="M20 36V16" />
          <path d="M20 16c-4-6-10-6-14-4 4 0 8 2 14 4zM20 16c4-6 10-6 14-4-4 0-8 2-14 4zM20 16c-2-6 0-10 4-12-2 4-2 8-4 12z" fill="#2e9e4f" />
        </g>
      );
    case "lagoon":
      return (
        <g transform="translate(-22 -22) scale(1.1)" strokeLinecap="round">
          <path d="M20 20m-4 0a4 4 0 118 0 8 8 0 01-16 0 12 12 0 0124 0 16 16 0 01-32 0" />
        </g>
      );
    case "volcano":
      return (
        <g transform="translate(-22 -22)">
          <path d="M4 36l12-22h12l12 22z" fill="#8c5a3c" />
          <path d="M16 14c2 4 4 6 6 4s4 0 6-4" fill="#ff5a5f" />
          <path d="M20 8c0-3 2-4 4-6M24 9c2-2 4-2 6-2" strokeLinecap="round" />
        </g>
      );
    case "dunes":
      return (
        <g transform="translate(-20 -22)" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 36q10-8 18-2t16-2" />
          <g strokeWidth="10">
            <path d="M20 32V10M20 22h-6v-7M20 26h7v-8" />
          </g>
          <g stroke="#3aa35a" strokeWidth="5.5">
            <path d="M20 32V10M20 22h-6v-7M20 26h7v-8" />
          </g>
        </g>
      );
    default:
      return (
        <g transform="translate(-23 -24)">
          <path d="M6 40V16l6 4V10l6 4V6l5 6 5-6v8l6-4v10l6-4v24z" fill="#fff" />
          <rect x="19" y="28" width="8" height="12" rx="4" fill={INK} />
        </g>
      );
  }
}

export function WorldMap({ view }: { view: QuestView }) {
  const firsts = ISLANDS.map((isl) => QUEST_NODES.findIndex((n) => n.id === isl.nodes[0].id));
  const curIsland = view.current >= QUEST_NODES.length ? -1 : firsts.findLastIndex((f) => f <= view.current);
  const next = QUEST_NODES[view.current];
  const doneUpTo = curIsland < 0 ? ISLANDS.length - 1 : curIsland;
  // route segments are drawn per island; the travelled part turns coral
  const travelled = ROUTE.split(" S").slice(0, doneUpTo).join(" S");
  const [sx, sy] = SPOTS[Math.max(0, curIsland)];

  return (
    <section className="panel sea relative mb-7 overflow-hidden">
      <div className="relative w-full" style={{ aspectRatio: `${W} / ${H}` }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" fill="none" stroke={INK} strokeWidth="2.4" strokeLinejoin="round">
          <path d={ROUTE} strokeWidth="4" strokeDasharray="2 12" strokeLinecap="round" />
          {doneUpTo > 0 && <path d={travelled} stroke="#ff5a5f" strokeWidth="5" strokeDasharray="2 12" strokeLinecap="round" />}

          <SeaSprite kind="gulls" x={24} y={40} width={80} height={40} />
          <SeaSprite kind="storm" x={150} y={14} width={92} height={76} />
          <SeaSprite kind="serpent" x={0} y={236} width={156} height={92} />
          <SeaSprite kind="kraken" x={262} y={380} width={128} height={140} />
          <SeaSprite kind="wave" x={-6} y={560} width={124} height={88} />
          <SeaSprite kind="bottle" x={160} y={618} width={46} height={30} />
          <SeaSprite kind="fin" x={170} y={748} width={76} height={40} />
          <g strokeLinecap="round">
            <path d="M334 142l20 20M354 142l-20 20" strokeWidth="9" />
            <path d="M334 142l20 20M354 142l-20 20" stroke="#ff5a5f" strokeWidth="5" />
          </g>
          <g transform="translate(290 716)" strokeWidth="2.2">
            <circle cx="32" cy="32" r="26" fill="#fff6e0" />
            <path d="M32 10l6 22-6 22-6-22z" fill="#fff" />
            <path d="M32 10l6 22h-12z" fill="#ff5a5f" />
          </g>

          {ISLANDS.map((isl, i) => {
            const [x, y] = SPOTS[i];
            const locked = firsts[i] > view.current;
            const boss = i === ISLANDS.length - 1;
            return (
              <g key={isl.id} transform={`translate(${x} ${y})`}>
                {i === curIsland && <ellipse rx="62" ry="46" stroke="#ffc93c" strokeOpacity="0.8" strokeWidth="9" />}
                <path d={BLOB} fill={INK} transform="translate(0 5)" />
                <path
                  d={BLOB}
                  strokeWidth="3"
                  fill={locked ? `color-mix(in srgb, ${isl.color} 30%, #f2e3b3)` : boss ? "#b9a6ff" : isl.color}
                />
                {locked ? (
                  <g transform="translate(-13 -15)" strokeLinecap="round">
                    <rect x="5" y="11" width="16" height="12" rx="2" fill="#fff" />
                    <path d="M8 11V8a5 5 0 0110 0v3" />
                  </g>
                ) : (
                  <IslandIcon id={isl.id} />
                )}
              </g>
            );
          })}

          {curIsland >= 0 && (
            <g className="animate-bob" style={{ transformBox: "fill-box", transformOrigin: "center" }}>
              <g transform={`translate(${sx + 54} ${sy - 44})`}>
                <path d="M26 6v32" />
                <path d="M28 9c10 3 15 10 16 20H28z" fill="#fff" />
                <path d="M24 14c-8 3-12 8-13 15h13z" fill="#ffe27a" />
                <path d="M6 38h42l-6 10H12z" fill="#ff5a5f" />
                <path d="M26 6l9 3-9 3" fill={INK} />
              </g>
            </g>
          )}
        </svg>

        <span
          className="absolute rotate-[4deg] rounded-md border-2 border-ink bg-yellow px-2 py-px font-display text-[11px] font-extrabold shadow-[2px_2px_0_#1e2a3a]"
          style={pct(292, 522)}
        >
          ระวังคราเคน!
        </span>

        {ISLANDS.map((isl, i) => {
          const [x, y] = SPOTS[i];
          const info = view.islands[i];
          const locked = firsts[i] > view.current;
          const boss = i === ISLANDS.length - 1;
          const cur = i === curIsland;
          return (
            <a
              key={isl.id}
              href={`#island-${isl.id}`}
              aria-label={`${isl.name} — ดูด่านของเกาะนี้`}
              className="absolute flex -translate-x-1/2 flex-col items-center"
              style={{ ...pct(x, y - 38), width: `${(170 / W) * 100}%`, paddingTop: `${(76 / W) * 100}%` }}
            >
              <span
                className={`mt-1 whitespace-nowrap rounded-lg px-2 py-px font-display text-xs font-bold ${
                  cur
                    ? "bg-ink text-yellow"
                    : boss
                      ? "border-2 border-ink bg-[#b3261e] text-white"
                      : "border-2 border-ink bg-white"
                }`}
              >
                {boss && !cur ? "BOSS · " : ""}
                {isl.name}
                {cur ? " · อยู่ตรงนี้" : ""}
              </span>
              {!locked && info.stars > 0 && (
                <span className="font-display text-[11px] font-extrabold">
                  ★ {info.stars}/{info.max}
                  {info.complete ? " ครบ" : ""}
                </span>
              )}
            </a>
          );
        })}
      </div>

      {next && (
        <div className="relative mx-3 mb-3.5 -mt-4 flex items-center gap-3 rounded-[20px] border-[3px] border-ink bg-white px-3.5 py-3 shadow-[5px_5px_0_#1e2a3a]">
          <div className="min-w-0 flex-1">
            <p className="font-comic text-[13px] tracking-[1.5px] text-cyan">
              NEXT STAGE {curIsland + 1}-{view.current - firsts[curIsland] + 1}
            </p>
            <p className="truncate font-display text-[17px] font-extrabold leading-tight">
              {next.boss ? "BOSS · " : ""}
              {nodeInfo(next).title}
            </p>
          </div>
          <Link href={`/quest/${next.id}`} className="btn btn-primary !min-h-12 shrink-0 text-base font-extrabold">
            ลุย!
          </Link>
        </div>
      )}
    </section>
  );
}
