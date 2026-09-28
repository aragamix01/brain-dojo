import type { Rng } from "@/lib/rng";

export type Cell = 0 | 1 | 2; // empty, filled, marked X

export function runs(line: boolean[]): number[] {
  const out: number[] = [];
  let n = 0;
  for (const v of line) {
    if (v) n++;
    else if (n) {
      out.push(n);
      n = 0;
    }
  }
  if (n) out.push(n);
  return out;
}

export const sameRuns = (a: number[], b: number[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

export type NonogramPuzzle = {
  n: number;
  solution: boolean[];
  rows: number[][];
  cols: number[][];
};

const row = (g: boolean[], n: number, r: number) => g.slice(r * n, r * n + n);
const col = (g: boolean[], n: number, c: number) => Array.from({ length: n }, (_, r) => g[r * n + c]);

export function generateNonogram(rng: Rng, n: number): NonogramPuzzle {
  for (;;) {
    const solution = Array.from({ length: n * n }, () => rng() < 0.58);
    const rows = Array.from({ length: n }, (_, r) => runs(row(solution, n, r)));
    const cols = Array.from({ length: n }, (_, c) => runs(col(solution, n, c)));
    // Skip boards with blank lines — they make the puzzle trivial in spots.
    if (rows.some((r) => !r.length) || cols.some((c) => !c.length)) continue;
    return { n, solution, rows, cols };
  }
}

export function lineStatus(cells: Cell[], n: number, p: NonogramPuzzle) {
  const filled = cells.map((c) => c === 1);
  return {
    rows: p.rows.map((clue, r) => sameRuns(runs(row(filled, n, r)), clue)),
    cols: p.cols.map((clue, c) => sameRuns(runs(col(filled, n, c)), clue)),
  };
}

/** Any grid matching every clue counts — the generated solution may not be unique. */
export function isSolved(cells: Cell[], p: NonogramPuzzle): boolean {
  const s = lineStatus(cells, p.n, p);
  return s.rows.every(Boolean) && s.cols.every(Boolean);
}
