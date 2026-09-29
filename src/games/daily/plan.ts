import { hashString, pick, rngFrom, shuffle } from "@/lib/rng";
import type { JugVariant } from "../jugs/logic";
import type { RandomTier } from "../robot/generate";
import { THEMES } from "../situation/data";

export type DailyStagePlan =
  | { kind: "sprint"; seconds: number }
  | { kind: "lights"; size: number }
  | { kind: "jugs"; variant: JugVariant }
  | { kind: "nonogram"; size: number }
  | { kind: "hanoi"; disks: number }
  | { kind: "situation"; theme: string }
  | { kind: "robot"; tier: RandomTier };

export type DailyStageWithSeed = DailyStagePlan & { seed: number; label: string; emoji: string };

const KINDS = ["sprint", "lights", "jugs", "nonogram", "hanoi", "situation", "robot"] as const;
export const DAILY_STAGES = 3;

/**
 * Three different games per day, picked from the date alone — so everybody playing the
 * same day gets the same set and can compare times.
 */
export function dailyPlan(date: string): DailyStageWithSeed[] {
  const rng = rngFrom(`daily:${date}`);
  return shuffle(rng, KINDS)
    .slice(0, DAILY_STAGES)
    .map((kind) => {
      const seed = hashString(`daily:${date}:${kind}`);
      switch (kind) {
        case "sprint":
          return { kind, seconds: 45, seed, emoji: "⚡", label: "Speed Math 45 วิ" };
        case "lights":
          return { kind, size: 5, seed, emoji: "💡", label: "Lights Out 5×5" };
        case "jugs": {
          const variant = pick(rng, ["two", "three"] as const);
          return { kind, variant, seed, emoji: "🫙", label: variant === "two" ? "ตวงน้ำ 2 เหยือก" : "ตวงน้ำ 3 เหยือก" };
        }
        case "nonogram":
          return { kind, size: 8, seed, emoji: "🧩", label: "ภาพปริศนา 8×8" };
        case "hanoi":
          return { kind, disks: 5, seed, emoji: "🗼", label: "หอคอยฮานอย 5 แผ่น" };
        case "situation": {
          const th = pick(rng, THEMES);
          return { kind, theme: th.id, seed, emoji: "🎯", label: th.title };
        }
        case "robot": {
          const tier = pick(rng, ["loop", "if"] as const);
          return { kind, tier, seed, emoji: "🤖", label: tier === "loop" ? "Robot Code · Loop" : "Robot Code · If" };
        }
      }
    });
}

export function sprintDailyStars(score: number) {
  return score >= 20 ? 3 : score >= 12 ? 2 : 1;
}
