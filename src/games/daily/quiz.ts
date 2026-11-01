// "Bonus question" after a Daily stage: a tiny fresh puzzle on the same rules, answered in seconds.
// Someone who solved the stage themselves gets it at a glance; someone who copied an answer doesn't.
import { randInt, shuffle, type Rng } from "@/lib/rng";
import { HARBOR_BANK } from "../harbor/bank";
import { EXIT_ROW, SIZE as HARBOR_SIZE, cellsOf, decodeHarbor, type Boat } from "../harbor/logic";
import { allCodes, score, type Feedback, type LockConfig } from "../lock/logic";
import { generateSeries } from "../series/logic";

export const QUIZ_SECONDS = 15;
/** A wrong or missed answer caps the stage at this many stars. */
export const QUIZ_CAP = 2;

export type Quiz =
  | { kind: "hanoi"; pegs: number[][]; options: { disk: number; to: number }[]; answer: number }
  | { kind: "lights"; grid: boolean[]; press: number; options: boolean[][]; answer: number }
  | { kind: "sudoku"; grid: number[]; cell: number; options: number[]; answer: number }
  | { kind: "nonogram"; clue: number[]; length: number; options: number[]; answer: number }
  | { kind: "robot"; block: RobotOp[]; times: number; options: number[]; answer: number }
  | { kind: "jugs"; caps: [number, number]; state: [number, number]; options: [number, number][]; answer: number }
  | { kind: "lock"; history: { guess: number[]; fb: Feedback }[]; options: number[][]; answer: number }
  | { kind: "harbor"; boats: Boat[]; pos: number[]; options: number[]; answer: number }
  | { kind: "series"; terms: number[]; options: number[]; answer: number }
  | { kind: "situation"; long: QuizTask; short: QuizTask; options: number[]; answer: number };

export type RobotOp = "F" | "L" | "R";
export type QuizTask = { emoji: string; name: string; active: number; wait?: number };

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

// ── Robot: a short program, maybe repeated; where does the robot stop? (5×5, starts mid, facing up) ──

export const ROBOT_GRID = 5;
export const ROBOT_START = 12;

/** End cell of the program, or null if the robot would leave the grid. */
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
    const mirrored = runRobot(
      block.map((o) => (o === "L" ? "R" : o === "R" ? "L" : o)),
      times,
    );
    const wrong = [...new Set([mirrored, runRobot(block, times - 1), runRobot(block, times + 1)])].filter(
      (c): c is number => c !== null && c !== end && c !== ROBOT_START,
    );
    if (wrong.length < 2) continue;
    return { kind: "robot", block, times, ...withAnswer(rng, end, wrong.slice(0, 2)) };
  }
}

// ── Jugs: pour A into B until B is full or A is empty; what is in each? ──

export function jugsQuiz(rng: Rng): Quiz {
  for (;;) {
    const capB = randInt(rng, 3, 5);
    const capA = randInt(rng, capB + 1, 9);
    const x = randInt(rng, 2, capA);
    const y = randInt(rng, 1, capB - 1);
    if (x + y <= capB) continue; // only overflowing pours: that is where the thinking is
    const moved = Math.min(x, capB - y);
    const right: [number, number] = [x - moved, y + moved];
    const wrong: [number, number][] = [
      [Math.max(0, x - capB), Math.min(capB, x)], // forgot B already had water
      [Math.max(0, x - y), capB], // poured only as much as B held
    ];
    if (new Set([right, ...wrong].map((w) => w.join())).size < 3) continue;
    return { kind: "jugs", caps: [capA, capB], state: [x, y], ...withAnswer(rng, right, wrong) };
  }
}

// ── Lock: two earlier guesses with their feedback; which code could still be the answer? ──

export const QUIZ_LOCK: LockConfig = { pegs: 3, colors: 4, repeats: false, par: 0 };

export function fitsHistory(code: number[], history: { guess: number[]; fb: Feedback }[]): boolean {
  return history.every((h) => {
    const f = score(code, h.guess);
    return f.exact === h.fb.exact && f.near === h.fb.near;
  });
}

export function lockQuiz(rng: Rng): Quiz {
  const codes = allCodes(QUIZ_LOCK);
  for (;;) {
    const secret = codes[randInt(rng, 0, codes.length - 1)];
    const history = shuffle(rng, codes)
      .filter((g) => g.join() !== secret.join())
      .slice(0, 2)
      .map((guess) => ({ guess, fb: score(secret, guess) }));
    const wrong = shuffle(
      rng,
      codes.filter((c) => !fitsHistory(c, history) && !history.some((h) => h.guess.join() === c.join())),
    );
    if (wrong.length < 2) continue;
    return { kind: "lock", history, ...withAnswer(rng, secret, wrong.slice(0, 2)) };
  }
}

// ── Harbor: which boat sits in the way out? ──

/** Boats with a cell on the exit row, ahead of the ship (boat 0). */
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
    const free = p.boats.map((_, i) => i).filter((i) => i > 0 && !block.includes(i));
    if (!block.length || free.length < 2) continue;
    const right = block[randInt(rng, 0, block.length - 1)];
    return { kind: "harbor", boats: p.boats, pos: p.start, ...withAnswer(rng, right, shuffle(rng, free).slice(0, 2)) };
  }
}

// ── Series: a fresh sequence; what comes next? ──

export function seriesQuiz(rng: Rng): Quiz {
  for (;;) {
    const item = generateSeries(rng, "normal").items[randInt(rng, 0, 4)];
    const t = item.terms;
    const step = Math.abs(t[t.length - 1] - t[t.length - 2]) || 1;
    const wrong = [...new Set([item.answer + step, item.answer - step, item.answer + 1, item.answer - 1])].filter(
      (w) => w !== item.answer,
    );
    if (wrong.length < 2) continue;
    return { kind: "series", terms: t, ...withAnswer(rng, item.answer, wrong.slice(0, 2)) };
  }
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
  for (;;) {
    const long: QuizTask = { ...LONG_TASKS[randInt(rng, 0, 3)], active: randInt(rng, 1, 3), wait: randInt(rng, 3, 9) * 5 };
    const short: QuizTask = { ...SHORT_TASKS[randInt(rng, 0, 3)], active: randInt(rng, 2, 8) * 5 };
    const right = long.active + Math.max(long.wait!, short.active);
    const wrong = [long.active + long.wait! + short.active, Math.max(long.active + long.wait!, short.active) + short.active];
    if (new Set([right, ...wrong]).size < 3) continue;
    return { kind: "situation", long, short, ...withAnswer(rng, right, wrong) };
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
