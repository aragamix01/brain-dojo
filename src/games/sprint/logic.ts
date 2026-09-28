import { pick, randInt, type Rng } from "@/lib/rng";

export type Question = { text: string; answer: number; level: number };

export const levelFor = (correct: number) => Math.min(4, Math.floor(correct / 4));

export function makeQuestion(rng: Rng, level: number): Question {
  const q = (text: string, answer: number): Question => ({ text, answer, level });
  switch (level) {
    case 0: {
      const a = randInt(rng, 12, 89);
      const b = randInt(rng, 11, 79);
      return rng() < 0.5 ? q(`${a} + ${b}`, a + b) : q(`${Math.max(a, b)} − ${Math.min(a, b)}`, Math.abs(a - b));
    }
    case 1: {
      if (rng() < 0.5) {
        const a = randInt(rng, 3, 9);
        const b = randInt(rng, 12, 29);
        return q(`${b} × ${a}`, a * b);
      }
      const d = randInt(rng, 3, 12);
      const ans = randInt(rng, 4, 19);
      return q(`${d * ans} ÷ ${d}`, ans);
    }
    case 2: {
      const r = rng();
      if (r < 0.4) {
        const p = pick(rng, [5, 10, 15, 20, 25, 30, 40, 50, 75]);
        // pick n so that p% of n is a whole number
        const step = 100 / gcd(p, 100);
        const n = step * randInt(rng, 1, Math.max(1, Math.floor(400 / step)));
        return q(`${p}% ของ ${n}`, (p * n) / 100);
      }
      if (r < 0.7) {
        const n = randInt(rng, 11, 25);
        return q(`${n}²`, n * n);
      }
      const a = randInt(rng, 6, 12);
      const b = randInt(rng, 6, 12);
      const c = randInt(rng, 5, 30);
      return q(`${a} × ${b} − ${c}`, a * b - c);
    }
    case 3: {
      if (rng() < 0.5) {
        const a = randInt(rng, 4, 19);
        const b = randInt(rng, 3, 15);
        const c = randInt(rng, 3, 9);
        return q(`(${a} + ${b}) × ${c}`, (a + b) * c);
      }
      const a = randInt(rng, 13, 49);
      return q(`${a} × 11`, a * 11);
    }
    default: {
      const r = rng();
      if (r < 0.35) {
        const k = randInt(rng, 12, 48);
        return q(`25 × ${k}`, 25 * k);
      }
      if (r < 0.7) {
        const k = randInt(rng, 3, 24);
        return q(`99 × ${k}`, 99 * k);
      }
      const a = randInt(rng, 21, 60);
      const b = randInt(rng, 3, 9);
      return q(`${a}² − ${a - b}²`, a * a - (a - b) * (a - b));
    }
  }
}

function gcd(a: number, b: number): number {
  return b ? gcd(b, a % b) : a;
}

export const pointsFor = (level: number) => 1 + level;

export function sprintStars(score: number): number {
  return score >= 30 ? 3 : score >= 15 ? 2 : 1;
}
