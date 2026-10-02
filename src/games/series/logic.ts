// Number series: spot the pattern, fill in the next number. A puzzle is a short set of series.
import { pick, randInt, type Rng } from "@/lib/rng";

export type SeriesLevel = "easy" | "normal" | "hard";

export type Series = { terms: number[]; answer: number; rule: string; hint: string };
export type SeriesPuzzle = { items: Series[] };

export const SERIES_COUNT = 5;

type Maker = (rng: Rng) => Series;

/** Builds terms from a rule; the answer is the next term after the ones shown. */
function seq(show: number, next: (prev: number[], i: number) => number, first: number[]): number[] {
  const out = [...first];
  while (out.length < show + 1) out.push(next(out, out.length));
  return out;
}

const make = (terms: number[], rule: string, hint: string): Series => ({
  terms: terms.slice(0, -1),
  answer: terms.at(-1)!,
  rule,
  hint,
});

const EASY: Maker[] = [
  (rng) => {
    const d = randInt(rng, 2, 9);
    return make(seq(5, (p) => p.at(-1)! + d, [randInt(rng, 1, 20)]), `บวกเพิ่มทีละ ${d}`, "ดูว่าแต่ละตัวห่างจากตัวก่อนหน้าเท่าไหร่");
  },
  (rng) => {
    const d = randInt(rng, 2, 7);
    return make(seq(5, (p) => p.at(-1)! - d, [randInt(rng, 40, 80)]), `ลดลงทีละ ${d}`, "ตัวเลขลดลงเท่าๆ กันไหม?");
  },
  (rng) => {
    const r = pick(rng, [2, 3]);
    return make(seq(5, (p) => p.at(-1)! * r, [randInt(rng, 1, 4)]), `คูณ ${r} ทุกครั้ง`, "ลองหารตัวหลังด้วยตัวหน้า");
  },
];

const NORMAL: Maker[] = [
  (rng) => {
    const a = randInt(rng, 1, 4);
    return make(
      seq(5, (p, i) => p.at(-1)! + a + (i - 1), [randInt(rng, 1, 10)]),
      `ระยะห่างเพิ่มขึ้นทีละ 1 (+${a}, +${a + 1}, +${a + 2}, …)`,
      "ระยะห่างระหว่างตัวไม่เท่ากัน — แต่ระยะห่างเองมีแพทเทิร์นไหม?",
    );
  },
  (rng) => {
    const a = randInt(rng, 3, 9);
    const b = randInt(rng, 1, a - 1);
    return make(
      seq(6, (p, i) => p.at(-1)! + (i % 2 ? a : -b), [randInt(rng, 5, 20)]),
      `สลับ +${a} กับ −${b}`,
      "ลองดูทีละคู่ ขึ้นแล้วลง ขึ้นแล้วลง…",
    );
  },
  (rng) => {
    const s = randInt(rng, 1, 4);
    return make(seq(5, (_, i) => (s + i) * (s + i), [s * s]), "เลขยกกำลังสองเรียงกัน (1×1, 2×2, 3×3…)", "ตัวเลขพวกนี้คือเลขอะไรคูณตัวเอง?");
  },
  (rng) => {
    const a = randInt(rng, 1, 5);
    const b = randInt(rng, 1, 5);
    return make(seq(6, (p) => p.at(-1)! + p.at(-2)!, [a, b]), "ตัวถัดไป = สองตัวก่อนหน้าบวกกัน", "ลองเอาสองตัวที่ติดกันมาบวกดู");
  },
];

const HARD: Maker[] = [
  (rng) => {
    const m = pick(rng, [2, 3]);
    const k = randInt(rng, 1, 3);
    return make(
      seq(5, (p) => p.at(-1)! * m + k, [randInt(rng, 1, 3)]),
      `คูณ ${m} แล้วบวก ${k}`,
      "ลองคูณตัวก่อนหน้าด้วยเลขเล็กๆ แล้วดูว่าขาดไปเท่าไหร่",
    );
  },
  (rng) => {
    const a0 = randInt(rng, 1, 9);
    const da = randInt(rng, 2, 5);
    const b0 = randInt(rng, 20, 40);
    const db = randInt(rng, 1, 4);
    const terms = Array.from({ length: 8 }, (_, i) => (i % 2 ? b0 - db * ((i - 1) / 2) : a0 + da * (i / 2)));
    return make(terms, `สองชุดสลับกัน: ตัวคี่ +${da}, ตัวคู่ −${db}`, "ลองแยกตัวที่ 1, 3, 5… ออกจากตัวที่ 2, 4, 6…");
  },
  (rng) => {
    const s = randInt(rng, 1, 3);
    const k = randInt(rng, 1, 5);
    return make(
      seq(5, (_, i) => (s + i) * (s + i) + k, [s * s + k]),
      `เลขยกกำลังสอง แล้วบวก ${k}`,
      "ลองลบทุกตัวด้วยเลขเดียวกัน แล้วดูว่าได้เลขคุ้นๆ ไหม",
    );
  },
  (rng) => {
    const a = randInt(rng, 2, 4);
    const b = randInt(rng, 2, 5);
    return make(
      seq(6, (p, i) => (i % 2 ? p.at(-1)! + b : p.at(-1)! * a), [randInt(rng, 1, 4)]),
      `สลับ ×${a} กับ +${b}`,
      "มีสองการกระทำสลับกันไปเรื่อยๆ",
    );
  },
  (rng) => {
    const a = randInt(rng, 1, 3);
    return make(
      seq(5, (p, i) => p.at(-1)! + a * i * i, [randInt(rng, 1, 5)]),
      `ระยะห่างเป็น ${a}×1², ${a}×2², ${a}×3²…`,
      "หาระยะห่างระหว่างตัว แล้วดูว่าระยะห่างเป็นเลขแบบไหน",
    );
  },
];

const POOLS: Record<SeriesLevel, Maker[][]> = {
  easy: [EASY, EASY, NORMAL],
  normal: [EASY, NORMAL, NORMAL, HARD],
  hard: [NORMAL, HARD, HARD],
};

export function generateSeries(rng: Rng, level: SeriesLevel): SeriesPuzzle {
  const items: Series[] = [];
  const rules = new Set<string>();
  while (items.length < SERIES_COUNT) {
    const s = pick(rng, pick(rng, POOLS[level]))(rng);
    // No repeated rule in one set, and keep numbers phone-keypad sized.
    const kind = s.rule.replace(/[\d−+-]+/g, "#");
    if (rules.has(kind) || Math.abs(s.answer) > 999) continue;
    rules.add(kind);
    items.push(s);
  }
  return { items };
}
