// "Bonus question" after a Daily stage: a tiny fresh puzzle on the same rules, answered in seconds.
// Someone who solved the stage themselves gets it at a glance; someone who copied an answer doesn't.
import { randInt, shuffle, type Rng } from "@/lib/rng";

export const QUIZ_SECONDS = 15;
/** A wrong or missed answer caps the stage at this many stars. */
export const QUIZ_CAP = 2;

export type Quiz =
  | { kind: "hanoi"; pegs: number[][]; options: { disk: number; to: number }[]; answer: number }
  | { kind: "lights"; grid: boolean[]; press: number; options: boolean[][]; answer: number }
  | { kind: "sudoku"; grid: number[]; cell: number; options: number[]; answer: number }
  | { kind: "nonogram"; clue: number[]; length: number; options: number[]; answer: number };

export type QuizKind = Quiz["kind"];
export const QUIZ_KINDS: readonly string[] = ["hanoi", "lights", "sudoku", "nonogram"];

/** Shuffle the options, keeping track of where the right one went. */
function withAnswer<T>(rng: Rng, right: T, wrong: T[]): { options: T[]; answer: number } {
  const order = shuffle(rng, [0, 1, 2].slice(0, wrong.length + 1));
  const all = [right, ...wrong];
  return { options: order.map((i) => all[i]), answer: order.indexOf(0) };
}

// ── Hanoi: a position from the shortest solution; which of the legal moves comes next? ──

const HANOI_DISKS = 4;

function hanoiMoves(n: number, from: number, to: number, via: number, out: [number, number, number][]) {
  if (n === 0) return;
  hanoiMoves(n - 1, from, via, to, out);
  out.push([n, from, to]);
  hanoiMoves(n - 1, via, to, from, out);
}

export function hanoiQuiz(rng: Rng): Quiz {
  const moves: [number, number, number][] = [];
  hanoiMoves(HANOI_DISKS, 0, 2, 1, moves);
  const step = randInt(rng, 1, moves.length - 2);
  // pegs list disks bottom → top; disk 1 is the smallest
  const pegs: number[][] = [Array.from({ length: HANOI_DISKS }, (_, i) => HANOI_DISKS - i), [], []];
  for (const [, from, to] of moves.slice(0, step)) pegs[to].push(pegs[from].pop()!);
  const [disk, , to] = moves[step];
  const legal: { disk: number; to: number }[] = [];
  pegs.forEach((p, from) => {
    const top = p.at(-1);
    if (top === undefined) return;
    pegs.forEach((q, dest) => {
      if (dest !== from && (q.length === 0 || q.at(-1)! > top)) legal.push({ disk: top, to: dest });
    });
  });
  const wrong = legal.filter((m) => !(m.disk === disk && m.to === to));
  return { kind: "hanoi", pegs, ...withAnswer(rng, { disk, to }, wrong.slice(0, 2)) };
}

// ── Lights Out: press one light on a 3×3 board; which picture comes out? ──

const plus = (i: number) => [i, i - 3, i + 3, ...(i % 3 > 0 ? [i - 1] : []), ...(i % 3 < 2 ? [i + 1] : [])].filter((j) => j >= 0 && j < 9);
const cross = (i: number) => [i, ...[-4, -2, 2, 4].map((d) => i + d).filter((j) => j >= 0 && j < 9 && Math.abs((j % 3) - (i % 3)) === 1)];

function toggle(grid: boolean[], cells: number[]): boolean[] {
  const out = grid.slice();
  for (const c of cells) out[c] = !out[c];
  return out;
}

export function lightsQuiz(rng: Rng): Quiz {
  const grid = Array.from({ length: 9 }, () => rng() < 0.45);
  const press = randInt(rng, 0, 8);
  const right = toggle(grid, plus(press));
  const wrong = [toggle(grid, [press]), toggle(grid, cross(press))];
  return { kind: "lights", grid, press, ...withAnswer(rng, right, wrong) };
}

// ── Sudoku 4×4: one empty cell that only row + column + box together pin down. ──

const BASE = [1, 2, 3, 4, 3, 4, 1, 2, 2, 1, 4, 3, 4, 3, 2, 1];
const rowOf = (i: number) => Math.floor(i / 4);
const colOf = (i: number) => i % 4;
const boxOf = (i: number) => Math.floor(rowOf(i) / 2) * 2 + Math.floor(colOf(i) / 2);

function shuffledSolution(rng: Rng): number[] {
  const digits = shuffle(rng, [1, 2, 3, 4]);
  const band = shuffle(rng, [0, 1]);
  const rows = band.flatMap((b) => shuffle(rng, [0, 1]).map((r) => b * 2 + r));
  const stack = shuffle(rng, [0, 1]);
  const cols = stack.flatMap((s) => shuffle(rng, [0, 1]).map((c) => s * 2 + c));
  return Array.from({ length: 16 }, (_, i) => digits[BASE[rows[rowOf(i)] * 4 + cols[colOf(i)]] - 1]);
}

export function candidates(grid: number[], cell: number): number[] {
  const seen = new Set(
    grid.filter((v, j) => v && j !== cell && (rowOf(j) === rowOf(cell) || colOf(j) === colOf(cell) || boxOf(j) === boxOf(cell))),
  );
  return [1, 2, 3, 4].filter((d) => !seen.has(d));
}

export function sudokuQuiz(rng: Rng): Quiz {
  const solution = shuffledSolution(rng);
  const cell = randInt(rng, 0, 15);
  const blanks = (grid: number[], same: (j: number) => boolean) => grid.filter((v, j) => !v && same(j)).length;
  for (let tries = 0; tries < 500; tries++) {
    const grid = solution.map((v, j) => (j === cell || rng() < 0.45 ? 0 : v));
    // Needs all three: no single row, column or box gives it away on its own.
    const needsAll =
      blanks(grid, (j) => rowOf(j) === rowOf(cell)) >= 2 &&
      blanks(grid, (j) => colOf(j) === colOf(cell)) >= 2 &&
      blanks(grid, (j) => boxOf(j) === boxOf(cell)) >= 2;
    if (!needsAll || candidates(grid, cell).length !== 1) continue;
    const right = solution[cell];
    const wrong = shuffle(rng, [1, 2, 3, 4].filter((d) => d !== right)).slice(0, 2);
    return { kind: "sudoku", grid, cell, ...withAnswer(rng, right, wrong) };
  }
  // Practically unreachable; a plain row-forced cell still checks the rule.
  const grid = solution.map((v, j) => (j === cell ? 0 : v));
  const right = solution[cell];
  return { kind: "sudoku", grid, cell, ...withAnswer(rng, right, shuffle(rng, [1, 2, 3, 4].filter((d) => d !== right)).slice(0, 2)) };
}

// ── Nonogram: one row and its clue; which cell must be filled whatever the layout? ──

const NONO_LENGTH = 8;

function placements(clue: number[], length: number): boolean[][] {
  const out: boolean[][] = [];
  const place = (k: number, start: number, row: boolean[]) => {
    if (k === clue.length) return out.push(row);
    const rest = clue.slice(k + 1).reduce((a, b) => a + b + 1, 0);
    for (let s = start; s + clue[k] + rest <= length; s++) {
      const next = row.slice();
      for (let i = s; i < s + clue[k]; i++) next[i] = true;
      place(k + 1, s + clue[k] + 1, next);
    }
  };
  place(0, 0, Array(length).fill(false));
  return out;
}

/** Cells filled in every possible layout of the clue. */
export function sureCells(clue: number[], length: number): number[] {
  const all = placements(clue, length);
  return Array.from({ length }, (_, i) => i).filter((i) => all.every((r) => r[i]));
}

export function nonogramQuiz(rng: Rng): Quiz {
  for (;;) {
    const clue = rng() < 0.5 ? [randInt(rng, 5, 7)] : [randInt(rng, 2, 4), randInt(rng, 2, 4)];
    const sure = sureCells(clue, NONO_LENGTH);
    const unsure = Array.from({ length: NONO_LENGTH }, (_, i) => i).filter((i) => !sure.includes(i));
    if (!sure.length || unsure.length < 2) continue;
    const right = sure[randInt(rng, 0, sure.length - 1)];
    return { kind: "nonogram", clue, length: NONO_LENGTH, ...withAnswer(rng, right, shuffle(rng, unsure).slice(0, 2)) };
  }
}

export function makeQuiz(kind: string, rng: Rng): Quiz | null {
  switch (kind) {
    case "hanoi":
      return hanoiQuiz(rng);
    case "lights":
      return lightsQuiz(rng);
    case "sudoku":
      return sudokuQuiz(rng);
    case "nonogram":
      return nonogramQuiz(rng);
    default:
      return null;
  }
}
