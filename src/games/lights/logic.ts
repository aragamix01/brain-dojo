import type { Rng } from "@/lib/rng";

export type LightsGrid = boolean[];

export function press(g: LightsGrid, n: number, i: number): LightsGrid {
  const out = g.slice();
  const r = Math.floor(i / n);
  const c = i % n;
  const flip = (rr: number, cc: number) => {
    if (rr >= 0 && rr < n && cc >= 0 && cc < n) out[rr * n + cc] = !out[rr * n + cc];
  };
  flip(r, c);
  flip(r - 1, c);
  flip(r + 1, c);
  flip(r, c - 1);
  flip(r, c + 1);
  return out;
}

/** Minimum set of presses that turns every light off (light chasing over all first-row patterns). */
export function solve(g: LightsGrid, n: number): number[] | null {
  let best: number[] | null = null;
  for (let mask = 0; mask < 1 << n; mask++) {
    let cur = g;
    const presses: number[] = [];
    for (let c = 0; c < n; c++) {
      if ((mask >> c) & 1) {
        cur = press(cur, n, c);
        presses.push(c);
      }
    }
    for (let r = 1; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (cur[(r - 1) * n + c]) {
          cur = press(cur, n, r * n + c);
          presses.push(r * n + c);
        }
      }
    }
    if (cur.every((v) => !v) && (!best || presses.length < best.length)) best = presses;
  }
  return best;
}

export type LightsPuzzle = { n: number; grid: LightsGrid; par: number };

export function generateLights(rng: Rng, n: number): LightsPuzzle {
  // Scrambling by presses from the solved board guarantees solvability.
  for (;;) {
    let g: LightsGrid = Array(n * n).fill(false);
    for (let i = 0; i < n * n; i++) if (rng() < 0.45) g = press(g, n, i);
    const sol = solve(g, n);
    if (sol && sol.length >= n + 2) return { n, grid: g, par: sol.length };
  }
}
