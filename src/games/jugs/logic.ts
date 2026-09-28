import { pick, randInt, type Rng } from "@/lib/rng";

export type JugMove =
  | { kind: "fill"; i: number }
  | { kind: "empty"; i: number }
  | { kind: "pour"; from: number; to: number };

export type JugPuzzle = {
  caps: number[];
  start: number[];
  target: number;
  /** true = unlimited tap (fill/empty allowed); false = pour-only */
  source: boolean;
  par: number;
};

export function applyMove(state: number[], caps: number[], m: JugMove): number[] {
  const s = state.slice();
  if (m.kind === "fill") s[m.i] = caps[m.i];
  else if (m.kind === "empty") s[m.i] = 0;
  else {
    const amt = Math.min(s[m.from], caps[m.to] - s[m.to]);
    s[m.from] -= amt;
    s[m.to] += amt;
  }
  return s;
}

export function legalMoves(state: number[], caps: number[], source: boolean): JugMove[] {
  const out: JugMove[] = [];
  for (let i = 0; i < caps.length; i++) {
    if (source && state[i] < caps[i]) out.push({ kind: "fill", i });
    if (source && state[i] > 0) out.push({ kind: "empty", i });
    for (let j = 0; j < caps.length; j++) {
      if (i !== j && state[i] > 0 && state[j] < caps[j]) out.push({ kind: "pour", from: i, to: j });
    }
  }
  return out;
}

export const isGoal = (state: number[], target: number) => state.includes(target);

/** Shortest move list from `start` to any state holding `target`; null if impossible. */
export function shortestPath(
  start: number[],
  caps: number[],
  source: boolean,
  target: number,
): JugMove[] | null {
  const key = (s: number[]) => s.join(",");
  const prev = new Map<string, { from: string; move: JugMove } | null>([[key(start), null]]);
  const queue = [start];
  while (queue.length) {
    const s = queue.shift()!;
    if (isGoal(s, target)) {
      const path: JugMove[] = [];
      let k = key(s);
      for (let p = prev.get(k); p; p = prev.get(k)) {
        path.unshift(p.move);
        k = p.from;
      }
      return path;
    }
    for (const m of legalMoves(s, caps, source)) {
      const n = applyMove(s, caps, m);
      const nk = key(n);
      if (!prev.has(nk)) {
        prev.set(nk, { from: key(s), move: m });
        queue.push(n);
      }
    }
  }
  return null;
}

/** BFS distance from start to every reachable state. */
function distances(start: number[], caps: number[], source: boolean) {
  const dist = new Map<string, { s: number[]; d: number }>([[start.join(","), { s: start, d: 0 }]]);
  const queue = [start];
  while (queue.length) {
    const s = queue.shift()!;
    const d = dist.get(s.join(","))!.d;
    for (const m of legalMoves(s, caps, source)) {
      const n = applyMove(s, caps, m);
      if (!dist.has(n.join(","))) {
        dist.set(n.join(","), { s: n, d: d + 1 });
        queue.push(n);
      }
    }
  }
  return [...dist.values()];
}

export type JugVariant = "two" | "three";

export function generateJugs(rng: Rng, variant: JugVariant): JugPuzzle {
  for (;;) {
    let caps: number[];
    let start: number[];
    if (variant === "two") {
      const a = randInt(rng, 3, 9);
      const b = randInt(rng, a + 2, 13);
      caps = [a, b];
      start = [0, 0];
    } else {
      const big = pick(rng, [8, 10, 12, 14]);
      const mid = randInt(rng, Math.ceil(big / 2), big - 3);
      const small = big - mid;
      caps = [big, mid, small];
      start = [big, 0, 0];
    }
    const source = variant === "two";
    const states = distances(start, caps, source);
    const best = new Map<number, number>();
    for (const { s, d } of states) {
      for (const v of s) if (v > 0 && d < (best.get(v) ?? Infinity)) best.set(v, d);
    }
    const minPar = source ? 4 : 5;
    const hard = [...best.entries()].filter(([t, d]) => d >= minPar && !caps.includes(t));
    if (!hard.length) continue;
    const maxD = Math.max(...hard.map(([, d]) => d));
    const [target, par] = pick(rng, hard.filter(([, d]) => d >= maxD - 1));
    return { caps, start, target, source, par };
  }
}
