// "Bonus question" after a Daily stage: a tiny fresh puzzle on the same rules, answered by typing a
// number. Someone who solved the stage themselves gets it at a glance; someone who copied an answer
// doesn't — and with no choices on screen there's nothing to guess between.
import { randInt, shuffle, type Rng } from "@/lib/rng";
import { HARBOR_BANK } from "../harbor/bank";
import { EXIT_ROW, SIZE as HARBOR_SIZE, cellsOf, decodeHarbor, type Boat } from "../harbor/logic";
import { allCodes, score, type LockConfig } from "../lock/logic";
import { generateSeries } from "../series/logic";

export const QUIZ_SECONDS = 20;
/** A wrong or missed answer caps the stage at this many stars. */
export const QUIZ_CAP = 2;

export type RobotOp = "F" | "L" | "R";
export type QuizTask = { emoji: string; name: string; active: number; wait?: number };

/** Every question takes a typed whole number; `answers` lists all the right ones. */
export type Quiz = { answers: number[] } & (
  | { kind: "hanoi"; pegs: number[][] }
  | { kind: "lights"; grid: boolean[]; press: number }
  | { kind: "sudoku"; grid: number[]; cell: number }
  | { kind: "nonogram"; clue: number[]; length: number }
  | { kind: "robot"; block: RobotOp[]; times: number }
  | { kind: "jugs"; caps: [number, number]; state: [number, number] }
  | { kind: "lock"; secret: number[]; guess: number[] }
  | { kind: "harbor"; boats: Boat[]; pos: number[] }
  | { kind: "series"; terms: number[] }
  | { kind: "situation"; long: QuizTask; short: QuizTask }
);

export type QuizKind = Quiz["kind"];

/** Every Daily game except Speed Math, which is already a race against the clock. */
export const QUIZ_KINDS: readonly string[] = [
  "hanoi",
  "lights",
  "sudoku",
  "nonogram",
  "robot",
  "jugs",
  "lock",
  "harbor",
  "series",
  "situation",
];

// ── Hanoi: a position from the shortest solution; which disk moves next? (never disk 1 — too guessable) ──

const HANOI_DISKS = 4;

export function hanoiMoves(n: number, from: number, to: number, via: number, out: [number, number, number][]) {
  if (n === 0) return;
  hanoiMoves(n - 1, from, via, to, out);
  out.push([n, from, to]);
  hanoiMoves(n - 1, via, to, from, out);
}

export function hanoiQuiz(rng: Rng): Quiz {
  const moves: [number, number, number][] = [];
  hanoiMoves(HANOI_DISKS, 0, 2, 1, moves);
  // Pick the disk first, so every answer is equally likely (disk 2 moves far more often than 4).
  const disk = randInt(rng, 2, HANOI_DISKS);
  const steps = moves.map((_, i) => i).filter((i) => moves[i][0] === disk);
  const step = steps[randInt(rng, 0, steps.length - 1)];
  // pegs list disks bottom → top; disk 1 is the smallest
  const pegs: number[][] = [Array.from({ length: HANOI_DISKS }, (_, i) => HANOI_DISKS - i), [], []];
  for (const [, from, to] of moves.slice(0, step)) pegs[to].push(pegs[from].pop()!);
  return { kind: "hanoi", pegs, answers: [moves[step][0]] };
}

// ── Lights Out: press one light on a 3×3 board; how many are on afterwards? ──

const plus = (i: number) =>
  [i, i - 3, i + 3, ...(i % 3 > 0 ? [i - 1] : []), ...(i % 3 < 2 ? [i + 1] : [])].filter((j) => j >= 0 && j < 9);

export function pressLight(grid: boolean[], i: number): boolean[] {
  const out = grid.slice();
  for (const c of plus(i)) out[c] = !out[c];
  return out;
}

export function lightsQuiz(rng: Rng): Quiz {
  const grid = Array.from({ length: 9 }, () => rng() < 0.45);
  const press = randInt(rng, 0, 8);
  return { kind: "lights", grid, press, answers: [pressLight(grid, press).filter(Boolean).length] };
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
    grid.filter(
      (v, j) => v && j !== cell && (rowOf(j) === rowOf(cell) || colOf(j) === colOf(cell) || boxOf(j) === boxOf(cell)),
    ),
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
    if (needsAll && candidates(grid, cell).length === 1) return { kind: "sudoku", grid, cell, answers: [solution[cell]] };
  }
  // Practically unreachable; a plain row-forced cell still checks the rule.
  return { kind: "sudoku", grid: solution.map((v, j) => (j === cell ? 0 : v)), cell, answers: [solution[cell]] };
}

// ── Nonogram: one row and its clue; type any cell that must be filled whatever the layout. ──

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

/** Cells (0-based) filled in every possible layout of the clue. */
export function sureCells(clue: number[], length: number): number[] {
  const all = placements(clue, length);
  return Array.from({ length }, (_, i) => i).filter((i) => all.every((r) => r[i]));
}

export function nonogramQuiz(rng: Rng): Quiz {
  for (;;) {
    const clue = rng() < 0.5 ? [randInt(rng, 5, 7)] : [randInt(rng, 2, 4), randInt(rng, 2, 4)];
    const sure = sureCells(clue, NONO_LENGTH);
    // Leave room to be wrong: at most half the row is certain.
    if (sure.length && sure.length <= NONO_LENGTH / 2)
      return { kind: "nonogram", clue, length: NONO_LENGTH, answers: sure.map((c) => c + 1) };
  }
}

// ── Robot: a short program, maybe repeated; which numbered cell does it stop on? (5×5, starts mid, facing up) ──

export const ROBOT_GRID = 5;
export const ROBOT_START = 12;

/** End cell (0-based) of the program, or null if the robot would leave the grid. */
export function runRobot(block: RobotOp[], times: number): number | null {
  let x = 2,
    y = 2,
    dir = 0;
  for (let t = 0; t < times; t++)
    for (const op of block) {
      if (op === "L") dir = (dir + 3) % 4;
      else if (op === "R") dir = (dir + 1) % 4;
      else {
        x += [0, 1, 0, -1][dir];
        y += [-1, 0, 1, 0][dir];
        if (x < 0 || y < 0 || x >= ROBOT_GRID || y >= ROBOT_GRID) return null;
      }
    }
  return y * ROBOT_GRID + x;
}

export function robotQuiz(rng: Rng): Quiz {
  for (;;) {
    const block = Array.from({ length: randInt(rng, 2, 3) }, () => (["F", "F", "L", "R"] as const)[randInt(rng, 0, 3)]);
    if (!block.includes("F") || !block.some((o) => o !== "F")) continue;
    const times = randInt(rng, 2, 3);
    const end = runRobot(block, times);
    if (end === null || end === ROBOT_START) continue;
    return { kind: "robot", block, times, answers: [end + 1] };
  }
}

// ── Jugs: pour A into B until B is full; how much is left in A? ──

export function jugsQuiz(rng: Rng): Quiz {
  for (;;) {
    const capB = randInt(rng, 3, 5);
    const capA = randInt(rng, capB + 1, 9);
    const x = randInt(rng, 2, capA);
    const y = randInt(rng, 1, capB - 1);
    if (x + y <= capB) continue; // only overflowing pours: that's where the thinking is
    return { kind: "jugs", caps: [capA, capB], state: [x, y], answers: [x - (capB - y)] };
  }
}

// ── Lock: the real code and one guess; how many ○ (right gem, wrong place) does it get? ──

export const QUIZ_LOCK: LockConfig = { pegs: 3, colors: 4, repeats: false, par: 0 };

export function lockQuiz(rng: Rng): Quiz {
  const codes = allCodes(QUIZ_LOCK);
  const want = randInt(rng, 0, 3);
  for (;;) {
    const secret = codes[randInt(rng, 0, codes.length - 1)];
    const guess = codes[randInt(rng, 0, codes.length - 1)];
    const fb = score(secret, guess);
    // Aim for an even spread of answers 0–3, so no single number is a safe guess.
    if (fb.near !== want || fb.exact === 3) continue;
    return { kind: "lock", secret, guess, answers: [fb.near] };
  }
}

// ── Harbor: which numbered boat sits in the way out? (any blocker counts) ──

/** Boats (by index) with a cell on the exit row, ahead of the ship (boat 0). */
export function blockers(boats: Boat[], pos: number[]): number[] {
  const shipEnd = pos[0] + boats[0].len - 1;
  return boats
    .map((_, i) => i)
    .filter(
      (i) =>
        i > 0 &&
        cellsOf(boats[i], pos[i]).some((c) => Math.floor(c / HARBOR_SIZE) === EXIT_ROW && c % HARBOR_SIZE > shipEnd),
    );
}

export function harborQuiz(rng: Rng): Quiz {
  const bank = [...HARBOR_BANK.easy, ...HARBOR_BANK.normal];
  for (;;) {
    const p = decodeHarbor(bank[randInt(rng, 0, bank.length - 1)]);
    const block = blockers(p.boats, p.start);
    // A few boats, mostly not in the way, so picking one at random rarely works.
    if (block.length && block.length * 3 <= p.boats.length - 1)
      return { kind: "harbor", boats: p.boats, pos: p.start, answers: block };
  }
}

// ── Series: a fresh sequence; what comes next? ──

export function seriesQuiz(rng: Rng): Quiz {
  const item = generateSeries(rng, "easy").items[randInt(rng, 0, 4)];
  return { kind: "series", terms: item.terms, answers: [item.answer] };
}

// ── Situation: one job that runs by itself, one that needs you; how soon can both be done? ──

const LONG_TASKS = [
  { emoji: "🍚", name: "หุงข้าว" },
  { emoji: "👕", name: "ซักผ้าด้วยเครื่อง" },
  { emoji: "💾", name: "ดาวน์โหลดเกม" },
  { emoji: "🔋", name: "ชาร์จแบต" },
];
const SHORT_TASKS = [
  { emoji: "🧹", name: "กวาดห้อง" },
  { emoji: "📚", name: "ทำการบ้าน" },
  { emoji: "🥗", name: "หั่นผัก" },
  { emoji: "🛏️", name: "เก็บที่นอน" },
];

export function situationQuiz(rng: Rng): Quiz {
  const long: QuizTask = { ...LONG_TASKS[randInt(rng, 0, 3)], active: randInt(rng, 1, 2) * 5, wait: randInt(rng, 3, 8) * 5 };
  const short: QuizTask = { ...SHORT_TASKS[randInt(rng, 0, 3)], active: randInt(rng, 2, 8) * 5 };
  return { kind: "situation", long, short, answers: [long.active + Math.max(long.wait!, short.active)] };
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
    case "robot":
      return robotQuiz(rng);
    case "jugs":
      return jugsQuiz(rng);
    case "lock":
      return lockQuiz(rng);
    case "harbor":
      return harborQuiz(rng);
    case "series":
      return seriesQuiz(rng);
    case "situation":
      return situationQuiz(rng);
    default:
      return null;
  }
}
