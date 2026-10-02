import { hashString, pick, rngFrom, shuffle } from "@/lib/rng";
import { generateJugs, type JugVariant } from "../jugs/logic";
import { generateLights } from "../lights/logic";
import type { RandomTier, RobotGenOpts } from "../robot/generate";
import type { HarborLevel } from "../harbor/logic";
import type { LockLevel } from "../lock/logic";
import type { SeriesLevel } from "../series/logic";
import { THEMES } from "../situation/data";
import type { SudokuLevel } from "../sudoku/logic";

type Range = [number, number];

export type DailyTuning = {
  lights: { size: number; par: Range };
  jugs: { par: Range; variants: JugVariant[] };
  nonogram: { size: number };
  hanoi: { disks: number };
  situation: { budgetPick: Range; schedulePick: Range };
  // Sequence only: loops and ifs are taught step by step in the Quest, not sprung on Daily.
  robot: RobotGenOpts;
  /** Speed Math scores for 2★ and 3★ */
  sprint: { seconds: number; stars: Range };
  lock: LockLevel;
  harbor: HarborLevel;
  sudoku: SudokuLevel;
  series: SeriesLevel;
};

/** Daily levels 1–5; Lv2 is the original "medium" Daily. Every puzzle sits inside these bounds. */
export const DAILY_LEVELS: Record<number, { name: string; tuning: DailyTuning }> = {
  1: {
    name: "ลูกเรือฝึกหัด",
    tuning: {
      lights: { size: 5, par: [4, 6] },
      jugs: { par: [3, 5], variants: ["two"] },
      nonogram: { size: 5 },
      hanoi: { disks: 3 },
      situation: { budgetPick: [7, 8], schedulePick: [4, 5] },
      robot: { moves: [4, 7], maxSize: 5 },
      sprint: { seconds: 45, stars: [10, 16] },
      lock: "easy",
      harbor: "easy",
      sudoku: "mini",
      series: "easy",
    },
  },
  2: {
    name: "ลูกเรือ",
    tuning: {
      lights: { size: 5, par: [6, 9] },
      jugs: { par: [5, 8], variants: ["two", "three"] },
      nonogram: { size: 6 },
      hanoi: { disks: 4 },
      situation: { budgetPick: [8, 9], schedulePick: [5, 6] },
      robot: { moves: [6, 9], maxSize: 6 },
      sprint: { seconds: 45, stars: [12, 20] },
      lock: "easy",
      harbor: "easy",
      sudoku: "normal",
      series: "easy",
    },
  },
  3: {
    name: "ต้นหน",
    tuning: {
      lights: { size: 5, par: [8, 11] },
      jugs: { par: [6, 9], variants: ["two", "three"] },
      nonogram: { size: 7 },
      hanoi: { disks: 4 },
      situation: { budgetPick: [9, 10], schedulePick: [6, 6] },
      robot: { moves: [8, 11], maxSize: 7 },
      sprint: { seconds: 45, stars: [14, 22] },
      lock: "normal",
      harbor: "normal",
      sudoku: "normal",
      series: "normal",
    },
  },
  4: {
    name: "รองกัปตัน",
    tuning: {
      lights: { size: 6, par: [9, 13] },
      jugs: { par: [7, 10], variants: ["three"] },
      nonogram: { size: 7 },
      hanoi: { disks: 5 },
      situation: { budgetPick: [10, 11], schedulePick: [6, 7] },
      robot: { moves: [10, 13], maxSize: 7 },
      sprint: { seconds: 45, stars: [16, 25] },
      lock: "normal",
      harbor: "normal",
      sudoku: "hard",
      series: "normal",
    },
  },
  5: {
    name: "กัปตัน",
    tuning: {
      lights: { size: 6, par: [12, 16] },
      jugs: { par: [8, 12], variants: ["three"] },
      nonogram: { size: 8 },
      hanoi: { disks: 5 },
      situation: { budgetPick: [11, 12], schedulePick: [7, 7] },
      robot: { moves: [12, 15], maxSize: 8 },
      sprint: { seconds: 45, stars: [18, 28] },
      lock: "hard",
      harbor: "hard",
      sudoku: "hard",
      series: "hard",
    },
  },
};

export const MIN_LEVEL = 1;
export const MAX_LEVEL = 5;
export const START_LEVEL = 3;

/** Saturday is boss day: one level harder than usual (Date.getDay() 6). */
export function isBossDay(date: string): boolean {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).getDay() === 6;
}

/** The level actually played on `date` by someone at `level`. */
export function playLevel(level: number, date: string): number {
  return Math.min(MAX_LEVEL, level + (isBossDay(date) ? 1 : 0));
}

/** Daily results as the level rule sees them. */
export type LevelRun = { level?: number; stars: number; max: number; hints: number };

/**
 * After each Daily: up a level after 3 strong runs in a row at this level (≥ 8/9 stars, no hints),
 * down after 2 rough ones (≤ 5/9 stars or 3+ hints). Runs from other levels don't count.
 */
/** Strong runs in a row at this level, counting back from the latest (3 moves you up). */
export function strongRunsAt(level: number, history: LevelRun[]): number {
  let n = 0;
  for (let i = history.length - 1; i >= 0 && history[i].level === level && isStrong(history[i]); i--) n++;
  return n;
}

const isStrong = (r: LevelRun) => r.stars >= r.max - 1 && r.hints === 0;

export function nextLevel(level: number, history: LevelRun[]): number {
  const here: LevelRun[] = [];
  for (let i = history.length - 1; i >= 0 && history[i].level === level; i--) here.push(history[i]);
  const strong = isStrong;
  const rough = (r: LevelRun) => r.stars <= Math.floor((r.max * 5) / 9) || r.hints >= 3;
  if (here.length >= 3 && here.slice(0, 3).every(strong)) return Math.min(MAX_LEVEL, level + 1);
  if (here.length >= 2 && here.slice(0, 2).every(rough)) return Math.max(MIN_LEVEL, level - 1);
  return level;
}

export type DailyStagePlan =
  | { kind: "sprint"; seconds: number; stars: Range }
  | { kind: "lights"; size: number; minPar: number }
  | { kind: "jugs"; variant: JugVariant }
  | { kind: "nonogram"; size: number }
  | { kind: "hanoi"; disks: number }
  | { kind: "situation"; theme: string; pick: [number, number] }
  | { kind: "robot"; tier: RandomTier; opts: RobotGenOpts }
  | { kind: "lock"; level: LockLevel }
  | { kind: "harbor"; level: HarborLevel }
  | { kind: "sudoku"; level: SudokuLevel }
  | { kind: "series"; level: SeriesLevel };

export type DailyStageWithSeed = DailyStagePlan & { seed: number; label: string; emoji: string };

const KINDS = ["sprint", "lights", "jugs", "nonogram", "hanoi", "situation", "robot", "lock", "harbor", "sudoku", "series"] as const;
export const DAILY_STAGES = 3;

/** First seed (from a date-stable sequence) whose puzzle par lands inside `range`. */
function seedWithPar(base: string, range: [number, number], parOf: (seed: number) => number): number {
  for (let i = 0; i < 400; i++) {
    const seed = hashString(`${base}:${i}`);
    const p = parOf(seed);
    if (p >= range[0] && p <= range[1]) return seed;
  }
  throw new Error(`no puzzle for ${base} with par ${range.join("-")}`);
}

/**
 * Three different games per day, picked from the date alone; the puzzles inside come from the
 * date and level — so everybody at the same level on the same day gets the same set.
 */
export function dailyPlan(date: string, level = 2): DailyStageWithSeed[] {
  const rng = rngFrom(`daily:${date}`);
  const T = DAILY_LEVELS[level].tuning;
  return shuffle(rng, KINDS)
    .slice(0, DAILY_STAGES)
    .map((kind) => {
      // Lv2 keeps the original seeds, so days already played still replay the same.
      const base = level === 2 ? `daily:${date}:${kind}` : `daily:${date}:L${level}:${kind}`;
      const seed = hashString(base);
      switch (kind) {
        case "sprint":
          return { kind, seconds: T.sprint.seconds, stars: T.sprint.stars, seed, emoji: "⚡", label: `Speed Math ${T.sprint.seconds} วิ` };
        case "lights": {
          const { size, par } = T.lights;
          const s = seedWithPar(base, par, (sd) => generateLights(rngFrom(sd), size, par[0]).par);
          return { kind, size, minPar: par[0], seed: s, emoji: "💡", label: `Lights Out ${size}×${size}` };
        }
        case "jugs": {
          const variant = pick(rng, ["two", "three"] as const);
          const v: JugVariant = T.jugs.variants.includes(variant) ? variant : T.jugs.variants[0];
          const s = seedWithPar(base, T.jugs.par, (sd) => generateJugs(rngFrom(sd), v).par);
          return { kind, variant: v, seed: s, emoji: "🫙", label: v === "two" ? "ตวงน้ำ 2 เหยือก" : "ตวงน้ำ 3 เหยือก" };
        }
        case "nonogram":
          return { kind, size: T.nonogram.size, seed, emoji: "🧩", label: `ภาพปริศนา ${T.nonogram.size}×${T.nonogram.size}` };
        case "hanoi":
          return { kind, disks: T.hanoi.disks, seed, emoji: "🗼", label: `หอคอยฮานอย ${T.hanoi.disks} แผ่น` };
        case "situation": {
          const th = pick(rng, THEMES);
          const p = th.kind === "budget" ? T.situation.budgetPick : T.situation.schedulePick;
          return { kind, theme: th.id, pick: p, seed, emoji: "🎯", label: th.title };
        }
        case "robot":
          return { kind, tier: "seq", opts: T.robot, seed, emoji: "🤖", label: "Robot Code · วางเส้นทาง" };
        case "lock":
          return { kind, level: T.lock, seed, emoji: "🔐", label: "ไขกุญแจหีบ" };
        case "harbor":
          return { kind, level: T.harbor, seed, emoji: "⛵", label: "พาเรือออกจากท่า" };
        case "sudoku":
          return { kind, level: T.sudoku, seed, emoji: "🗺️", label: T.sudoku === "mini" ? "ซูโดกุแผนที่ 4×4" : "ซูโดกุแผนที่ 6×6" };
        case "series":
          return { kind, level: T.series, seed, emoji: "🔢", label: "อนุกรมปริศนา" };
      }
    });
}

export function sprintDailyStars(score: number, [two, three]: Range = DAILY_LEVELS[2].tuning.sprint.stars) {
  return score >= three ? 3 : score >= two ? 2 : 1;
}
