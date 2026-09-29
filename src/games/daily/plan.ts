import { hashString, pick, rngFrom, shuffle } from "@/lib/rng";
import { generateJugs, type JugVariant } from "../jugs/logic";
import { generateLights } from "../lights/logic";
import type { RandomTier, RobotGenOpts } from "../robot/generate";
import { THEMES } from "../situation/data";

/** Daily aims for "medium": every puzzle sits inside these bounds. */
export const DAILY_TUNING = {
  lights: { size: 5, par: [6, 9] as [number, number] },
  jugs: { par: [5, 8] as [number, number] },
  nonogram: { size: 6 },
  hanoi: { disks: 4 },
  situation: { budgetPick: [8, 9] as [number, number], schedulePick: [5, 6] as [number, number] },
  // Sequence only: loops and ifs are taught step by step in the Quest, not sprung on Daily.
  robot: { moves: [6, 9], maxSize: 6 } satisfies RobotGenOpts,
  sprint: { seconds: 45 },
};

export type DailyStagePlan =
  | { kind: "sprint"; seconds: number }
  | { kind: "lights"; size: number; minPar: number }
  | { kind: "jugs"; variant: JugVariant }
  | { kind: "nonogram"; size: number }
  | { kind: "hanoi"; disks: number }
  | { kind: "situation"; theme: string; pick: [number, number] }
  | { kind: "robot"; tier: RandomTier; opts: RobotGenOpts };

export type DailyStageWithSeed = DailyStagePlan & { seed: number; label: string; emoji: string };

const KINDS = ["sprint", "lights", "jugs", "nonogram", "hanoi", "situation", "robot"] as const;
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
 * Three different games per day, picked from the date alone — so everybody playing the
 * same day gets the same set and can compare times.
 */
export function dailyPlan(date: string): DailyStageWithSeed[] {
  const rng = rngFrom(`daily:${date}`);
  const T = DAILY_TUNING;
  return shuffle(rng, KINDS)
    .slice(0, DAILY_STAGES)
    .map((kind) => {
      const base = `daily:${date}:${kind}`;
      const seed = hashString(base);
      switch (kind) {
        case "sprint":
          return { kind, seconds: T.sprint.seconds, seed, emoji: "⚡", label: `Speed Math ${T.sprint.seconds} วิ` };
        case "lights": {
          const { size, par } = T.lights;
          const s = seedWithPar(base, par, (sd) => generateLights(rngFrom(sd), size, par[0]).par);
          return { kind, size, minPar: par[0], seed: s, emoji: "💡", label: `Lights Out ${size}×${size}` };
        }
        case "jugs": {
          const variant = pick(rng, ["two", "three"] as const);
          const s = seedWithPar(base, T.jugs.par, (sd) => generateJugs(rngFrom(sd), variant).par);
          return { kind, variant, seed: s, emoji: "🫙", label: variant === "two" ? "ตวงน้ำ 2 เหยือก" : "ตวงน้ำ 3 เหยือก" };
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
      }
    });
}

export function sprintDailyStars(score: number) {
  return score >= 20 ? 3 : score >= 12 ? 2 : 1;
}
