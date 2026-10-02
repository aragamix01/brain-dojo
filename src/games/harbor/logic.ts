// Harbor escape (Rush Hour): slide boats along their length so our ship (boat 0) can sail out
// through the gap on the right of its row. One move = sliding one boat any distance.
import { randInt, type Rng } from "@/lib/rng";

export const SIZE = 6;
export const EXIT_ROW = 2;

/** A boat: fixed lane, `pos` is its column (horizontal) or row (vertical). */
export type Boat = { len: number; horiz: boolean; lane: number };

export type HarborPuzzle = { boats: Boat[]; start: number[]; par: number };
export type HarborLevel = "easy" | "normal" | "hard";

export const HARBOR_LEVELS: Record<HarborLevel, { par: [number, number] }> = {
  easy: { par: [4, 7] },
  normal: { par: [8, 12] },
  hard: { par: [13, 25] },
};

/** Ship has reached the exit (touching the right edge). */
export const GOAL_POS = SIZE - 2;

export function cellsOf(b: Boat, pos: number): number[] {
  return Array.from({ length: b.len }, (_, k) => (b.horiz ? b.lane * SIZE + pos + k : (pos + k) * SIZE + b.lane));
}

function occupancy(boats: Boat[], state: number[], skip = -1): Int8Array {
  const occ = new Int8Array(SIZE * SIZE);
  boats.forEach((b, i) => {
    if (i !== skip) for (const c of cellsOf(b, state[i])) occ[c] = 1;
  });
  return occ;
}

/** How far boat `i` can slide: [lowest pos, highest pos]. */
export function slideRange(boats: Boat[], state: number[], i: number): [number, number] {
  const occ = occupancy(boats, state, i);
  const b = boats[i];
  const free = (p: number) => cellsOf(b, p).every((c) => !occ[c]);
  let lo = state[i];
  while (lo - 1 >= 0 && free(lo - 1)) lo--;
  let hi = state[i];
  while (hi + 1 + b.len <= SIZE && free(hi + 1)) hi++;
  return [lo, hi];
}

export type HarborMove = { boat: number; to: number };

const cellAt = (b: Boat, x: number) => (b.horiz ? b.lane * SIZE + x : x * SIZE + b.lane);

function neighbors(boats: Boat[], state: number[]): HarborMove[] {
  const out: HarborMove[] = [];
  const occ = occupancy(boats, state);
  boats.forEach((b, i) => {
    const p = state[i];
    for (let q = p - 1; q >= 0 && !occ[cellAt(b, q)]; q--) out.push({ boat: i, to: q });
    for (let q = p + 1; q + b.len <= SIZE && !occ[cellAt(b, q + b.len - 1)]; q++) out.push({ boat: i, to: q });
  });
  return out;
}

/** States as one number (base 6 digits), much cheaper to hash than strings. */
const keyOf = (s: number[]) => s.reduce((k, p) => k * SIZE + p, 0);
const apply = (s: number[], m: HarborMove) => s.map((p, i) => (i === m.boat ? m.to : p));
export const isSolved = (state: number[]) => state[0] === GOAL_POS;

/** Every state reachable from `start`, capped so a generator can't run away. */
function component(boats: Boat[], start: number[], cap: number): Map<number, number[]> | null {
  const seen = new Map([[keyOf(start), start]]);
  const queue = [start];
  for (let q = 0; q < queue.length; q++) {
    for (const m of neighbors(boats, queue[q])) {
      const n = apply(queue[q], m);
      const k = keyOf(n);
      if (seen.has(k)) continue;
      if (seen.size >= cap) return null;
      seen.set(k, n);
      queue.push(n);
    }
  }
  return seen;
}

/** Moves to the exit from every state in `states` (moves are reversible, so BFS out from the goals). */
function distances(boats: Boat[], states: Map<number, number[]>): Map<number, number> {
  const dist = new Map<number, number>();
  const queue: number[][] = [];
  for (const [k, s] of states)
    if (isSolved(s)) {
      dist.set(k, 0);
      queue.push(s);
    }
  for (let q = 0; q < queue.length; q++) {
    const d = dist.get(keyOf(queue[q]))!;
    for (const m of neighbors(boats, queue[q])) {
      const n = apply(queue[q], m);
      const k = keyOf(n);
      if (!dist.has(k)) {
        dist.set(k, d + 1);
        queue.push(n);
      }
    }
  }
  return dist;
}

/** First move of a shortest way out, or null if stuck (can't happen from a generated start). */
export function nextMove(boats: Boat[], state: number[]): HarborMove | null {
  if (isSolved(state)) return null;
  const queue = [state];
  const from = new Map<number, { prev: number; move: HarborMove } | null>([[keyOf(state), null]]);
  for (let q = 0; q < queue.length; q++) {
    for (const m of neighbors(boats, queue[q])) {
      const n = apply(queue[q], m);
      const k = keyOf(n);
      if (from.has(k)) continue;
      from.set(k, { prev: keyOf(queue[q]), move: m });
      if (isSolved(n)) {
        let step = from.get(k)!;
        while (step.prev !== keyOf(state)) step = from.get(step.prev)!;
        return step.move;
      }
      queue.push(n);
    }
  }
  return null;
}

function randomHarbor(rng: Rng): { boats: Boat[]; state: number[] } {
  const boats: Boat[] = [{ len: 2, horiz: true, lane: EXIT_ROW }];
  const state = [randInt(rng, 0, 2)];
  const target = randInt(rng, 10, 14);
  for (let tries = 0; boats.length < target && tries < 200; tries++) {
    const horiz = rng() < 0.5;
    const len = rng() < 0.7 ? 2 : 3;
    const lane = randInt(rng, 0, SIZE - 1);
    // A sideways boat in the ship's own row could never get out of its way.
    if (horiz && lane === EXIT_ROW) continue;
    const pos = randInt(rng, 0, SIZE - len);
    const b = { len, horiz, lane };
    const occ = occupancy(boats, state);
    if (cellsOf(b, pos).some((c) => occ[c])) continue;
    boats.push(b);
    state.push(pos);
  }
  return { boats, state };
}

/**
 * Random harbor whose hardest reachable layout needs `par` in range: we pick the reachable
 * state that is furthest from the exit, so puzzles are as deep as the boats allow.
 */
export function generateHarbor(rng: Rng, level: HarborLevel): HarborPuzzle {
  const [lo, hi] = HARBOR_LEVELS[level].par;
  for (;;) {
    const { boats, state } = randomHarbor(rng);
    const states = component(boats, state, 4000);
    if (!states) continue;
    const dist = distances(boats, states);
    let best: { k: number; d: number } | null = null;
    for (const [k, d] of dist) if (d >= lo && d <= hi && (!best || d > best.d)) best = { k, d };
    if (best) return { boats, start: states.get(best.k)!, par: best.d };
  }
}

/** Compact text form for the puzzle bank: each boat as <len><h|v><lane><pos>, then |par. */
export function encodeHarbor(p: HarborPuzzle): string {
  return `${p.boats.map((b, i) => `${b.len}${b.horiz ? "h" : "v"}${b.lane}${p.start[i]}`).join("")}|${p.par}`;
}

export function decodeHarbor(s: string): HarborPuzzle {
  const [body, par] = s.split("|");
  const boats: Boat[] = [];
  const start: number[] = [];
  for (let i = 0; i < body.length; i += 4) {
    boats.push({ len: Number(body[i]), horiz: body[i + 1] === "h", lane: Number(body[i + 2]) });
    start.push(Number(body[i + 3]));
  }
  return { boats, start, par: Number(par) };
}
