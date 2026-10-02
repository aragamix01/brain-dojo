// Weekly report (Sunday → Saturday) built from Daily results and the per-day activity log.
import { HUNT } from "@/games/daily/hunt";
import { dayKey, shiftDay, weekOf } from "./date";
import type { DailyResult, ProgressData } from "./store";

/** What happened outside the Daily on one day. */
export type DayLog = { wins: number; stars: number; quest: number; coins: number };

const LOG_DAYS = 28;

/** Add to today's activity counters, dropping days older than four weeks. */
export function bumpLog(log: Record<string, DayLog> | undefined, add: Partial<DayLog>, today = dayKey()) {
  const cur = log?.[today] ?? { wins: 0, stars: 0, quest: 0, coins: 0 };
  const next: Record<string, DayLog> = {
    [today]: {
      wins: cur.wins + (add.wins ?? 0),
      stars: cur.stars + (add.stars ?? 0),
      quest: cur.quest + (add.quest ?? 0),
      coins: cur.coins + (add.coins ?? 0),
    },
  };
  const oldest = shiftDay(today, -LOG_DAYS);
  for (const [d, v] of Object.entries(log ?? {})) if (d !== today && d >= oldest) next[d] = v;
  return next;
}

/** Short names for Daily stage kinds; situation labels change daily so they share one name. */
export const KIND_NAMES: Record<string, string> = {
  sprint: "⚡ Speed Math",
  lights: "💡 Lights Out",
  jugs: "🫙 ตวงน้ำ",
  nonogram: "🧩 ภาพปริศนา",
  hanoi: "🗼 ฮานอย",
  situation: "🎯 Situation",
  robot: "🤖 Robot",
  lock: "🔐 ไขกุญแจหีบ",
  harbor: "⛵ พาเรือออกจากท่า",
  sudoku: "🗺️ ซูโดกุ",
  series: "🔢 อนุกรม",
};

type KindStat = { kind: string; name: string; plays: number; stars: number; ms: number; timed: number };

export type WeekReport = {
  days: string[];
  marks: ("play" | "freeze" | "miss" | "future")[];
  played: number;
  /** regular Daily days (three games) */
  runs: number;
  huntDays: number;
  huntDone: number;
  totalMs: number;
  fastest: { day: string; ms: number } | null;
  stars: number;
  maxStars: number;
  three: number;
  stages: number;
  hints: number;
  noHintDays: number;
  kinds: KindStat[];
  best: KindStat | null;
  practice: KindStat | null;
  outside: DayLog;
  prev: { runs: number; avgMs: number; hints: number } | null;
};

const isHunt = (r: DailyResult) => r.stages?.[0]?.kind === "hunt";

function weekNumbers(p: ProgressData, days: string[]) {
  const runs = days.map((d) => p.daily[d]).filter((r): r is DailyResult => !!r?.stages && !isHunt(r));
  const totalMs = runs.reduce((a, r) => a + r.timeMs, 0);
  const hints = days.reduce((a, d) => a + (p.daily[d]?.hints ?? 0), 0);
  return { runs, totalMs, hints, avgMs: runs.length ? totalMs / runs.length : 0 };
}

export function weekReport(p: ProgressData, today = dayKey()): WeekReport {
  const days = weekOf(today);
  const marks = days.map((d) =>
    p.daily[d] ? "play" : p.activeDays?.[d] === "freeze" ? "freeze" : d >= today ? "future" : "miss",
  ) as WeekReport["marks"];
  const { runs, totalMs, hints } = weekNumbers(p, days);

  let fastest: WeekReport["fastest"] = null;
  for (const d of days) {
    const r = p.daily[d];
    if (r?.stages && !isHunt(r) && (!fastest || r.timeMs < fastest.ms)) fastest = { day: d, ms: r.timeMs };
  }

  const byKind = new Map<string, KindStat>();
  for (const st of runs.flatMap((r) => r.stages ?? [])) {
    const k = byKind.get(st.kind) ?? { kind: st.kind, name: KIND_NAMES[st.kind] ?? st.label, plays: 0, stars: 0, ms: 0, timed: 0 };
    k.plays++;
    k.stars += st.stars;
    if (st.ms != null) {
      k.ms += st.ms;
      k.timed++;
    }
    byKind.set(st.kind, k);
  }
  const kinds = [...byKind.values()].sort((a, b) => b.plays - a.plays);
  const avg = (k: KindStat) => k.stars / k.plays;
  const ranked = [...kinds].sort((a, b) => avg(b) - avg(a) || b.plays - a.plays);
  const best = ranked[0] ?? null;
  const worst = ranked.at(-1) ?? null;

  const stages = kinds.reduce((a, k) => a + k.plays, 0);
  const stars = kinds.reduce((a, k) => a + k.stars, 0);
  const three = runs.flatMap((r) => r.stages ?? []).filter((s) => s.stars === 3).length;

  const outside = days.reduce<DayLog>(
    (a, d) => {
      const l = p.dayLog?.[d];
      return l ? { wins: a.wins + l.wins, stars: a.stars + l.stars, quest: a.quest + l.quest, coins: a.coins + l.coins } : a;
    },
    { wins: 0, stars: 0, quest: 0, coins: 0 },
  );

  const before = weekNumbers(p, weekOf(shiftDay(days[0], -1)));
  const huntDaysList = days.filter((d) => HUNT.days.includes(days.indexOf(d)) && d <= today);

  return {
    days,
    marks,
    played: days.filter((d) => p.daily[d]).length,
    runs: runs.length,
    huntDays: huntDaysList.length,
    huntDone: huntDaysList.filter((d) => p.daily[d]).length,
    totalMs,
    fastest,
    stars,
    maxStars: stages * 3,
    three,
    stages,
    hints,
    noHintDays: days.filter((d) => p.daily[d] && !p.daily[d].hints).length,
    kinds,
    best,
    // Only worth calling out when it's clearly behind the best one.
    practice: worst && best && worst !== best && avg(worst) < avg(best) ? worst : null,
    outside,
    prev: before.runs.length ? { runs: before.runs.length, avgMs: before.avgMs, hints: before.hints } : null,
  };
}

const short = (d: string) => `${Number(d.slice(8))}/${Number(d.slice(5, 7))}`;

export function weekRange(w: WeekReport) {
  return `${short(w.days[0])} – ${short(w.days[6])}`;
}

export function weekCompare(w: WeekReport, prev: NonNullable<WeekReport["prev"]>) {
  const avg = w.totalMs / w.runs;
  const parts: string[] = [];
  if (prev.avgMs > 0) {
    const pct = Math.round(((prev.avgMs - avg) / prev.avgMs) * 100);
    parts.push(pct > 0 ? `เร็วขึ้น ${pct}%` : pct < 0 ? `ช้าลง ${-pct}%` : "เวลาเท่าเดิม");
  }
  const dh = w.hints - prev.hints;
  parts.push(dh < 0 ? `คำใบ้ลดลง ${-dh}` : dh > 0 ? `คำใบ้เพิ่มขึ้น ${dh}` : "คำใบ้เท่าเดิม");
  return parts.join(" · ");
}
