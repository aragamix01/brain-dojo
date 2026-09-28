/** pos[d] = peg of disk d (0 = smallest). */
export type HanoiState = number[];

export const topDisk = (pos: HanoiState, peg: number) => {
  const i = pos.findIndex((p) => p === peg);
  return i === -1 ? null : i;
};

export function canMove(pos: HanoiState, from: number, to: number): boolean {
  if (from === to) return false;
  const d = topDisk(pos, from);
  if (d === null) return false;
  const t = topDisk(pos, to);
  return t === null || t > d;
}

export function move(pos: HanoiState, from: number, to: number): HanoiState {
  const d = topDisk(pos, from)!;
  const out = pos.slice();
  out[d] = to;
  return out;
}

/** Next move on an optimal path to stack every disk on `target`, from any legal state. */
export function nextMove(pos: HanoiState, k: number, target: number): { from: number; to: number } | null {
  if (k === 0) return null;
  const peg = pos[k - 1];
  if (peg === target) return nextMove(pos, k - 1, target);
  const other = 3 - peg - target;
  return nextMove(pos, k - 1, other) ?? { from: peg, to: target };
}
