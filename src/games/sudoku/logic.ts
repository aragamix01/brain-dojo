// Map sudoku: 4×4 (2×2 boxes) or 6×6 (2×3 boxes), every puzzle has exactly one solution.
import { shuffle, type Rng } from "@/lib/rng";

export type SudokuLevel = "mini" | "normal" | "hard";

export const SUDOKU_LEVELS: Record<SudokuLevel, { n: 4 | 6; givens: number }> = {
  mini: { n: 4, givens: 6 },
  normal: { n: 6, givens: 16 },
  hard: { n: 6, givens: 11 },
};

/** `givens` uses 0 for empty cells. */
export type SudokuPuzzle = { n: number; boxR: number; boxC: number; givens: number[]; solution: number[] };

const boxOf = (n: number) => (n === 4 ? { boxR: 2, boxC: 2 } : { boxR: 2, boxC: 3 });

/** Cells sharing a row, column or box with each cell. */
const PEERS = new Map<number, number[][]>();
export function peers(n: number): number[][] {
  if (PEERS.has(n)) return PEERS.get(n)!;
  const { boxR, boxC } = boxOf(n);
  const list = Array.from({ length: n * n }, (_, i) => {
    const r = Math.floor(i / n);
    const c = i % n;
    const out = new Set<number>();
    for (let k = 0; k < n; k++) {
      out.add(r * n + k);
      out.add(k * n + c);
    }
    const r0 = r - (r % boxR);
    const c0 = c - (c % boxC);
    for (let dr = 0; dr < boxR; dr++) for (let dc = 0; dc < boxC; dc++) out.add((r0 + dr) * n + c0 + dc);
    out.delete(i);
    return [...out];
  });
  PEERS.set(n, list);
  return list;
}

export function candidates(grid: number[], n: number, i: number): number[] {
  const used = new Set(peers(n)[i].map((p) => grid[p]));
  return Array.from({ length: n }, (_, k) => k + 1).filter((v) => !used.has(v));
}

/** Number of solutions, stopping once `limit` is reached. */
function countSolutions(grid: number[], n: number, limit: number): number {
  let best = -1;
  let bestCands: number[] = [];
  for (let i = 0; i < grid.length; i++) {
    if (grid[i]) continue;
    const c = candidates(grid, n, i);
    if (!c.length) return 0;
    if (best < 0 || c.length < bestCands.length) {
      best = i;
      bestCands = c;
    }
  }
  if (best < 0) return 1;
  let total = 0;
  for (const v of bestCands) {
    grid[best] = v;
    total += countSolutions(grid, n, limit - total);
    grid[best] = 0;
    if (total >= limit) break;
  }
  return total;
}

function fill(grid: number[], n: number, rng: Rng): boolean {
  const i = grid.indexOf(0);
  if (i < 0) return true;
  for (const v of shuffle(rng, candidates(grid, n, i))) {
    grid[i] = v;
    if (fill(grid, n, rng)) return true;
  }
  grid[i] = 0;
  return false;
}

export function generateSudoku(rng: Rng, level: SudokuLevel): SudokuPuzzle {
  const { n, givens: target } = SUDOKU_LEVELS[level];
  const solution = Array(n * n).fill(0);
  fill(solution, n, rng);
  const givens = [...solution];
  let count = n * n;
  // Remove clues one by one while the answer stays unique.
  for (const i of shuffle(rng, givens.map((_, k) => k))) {
    if (count <= target) break;
    const keep = givens[i];
    givens[i] = 0;
    if (countSolutions([...givens], n, 2) === 1) count--;
    else givens[i] = keep;
  }
  return { n, ...boxOf(n), givens, solution };
}

/** Cells whose value clashes with a peer — shown in red, without saying which is wrong. */
export function clashes(grid: number[], n: number): Set<number> {
  const bad = new Set<number>();
  const ps = peers(n);
  grid.forEach((v, i) => {
    if (v && ps[i].some((p) => grid[p] === v)) bad.add(i);
  });
  return bad;
}

export const isComplete = (grid: number[], p: SudokuPuzzle) => grid.every((v, i) => v === p.solution[i]);
