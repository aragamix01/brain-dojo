export const RANKS = [
  { name: "E", title: "Rookie", minXp: 0, color: "#a9a3c9" },
  { name: "D", title: "Apprentice", minXp: 200, color: "#3ddc97" },
  { name: "C", title: "Solver", minXp: 600, color: "#41e8ff" },
  { name: "B", title: "Tactician", minXp: 1500, color: "#4d7cff" },
  { name: "A", title: "Mastermind", minXp: 3500, color: "#ff5fcf" },
  { name: "S", title: "Legend", minXp: 7000, color: "#ffd84d" },
] as const;

export function rankFor(xp: number) {
  let i = 0;
  while (i + 1 < RANKS.length && xp >= RANKS[i + 1].minXp) i++;
  const cur = RANKS[i];
  const next = RANKS[i + 1];
  const progress = next ? (xp - cur.minXp) / (next.minXp - cur.minXp) : 1;
  return { ...cur, next, progress };
}

/** 3 stars at/under par, 2 within 150%, else 1; each hint costs a star (min 1). */
export function starsFor(moves: number, par: number, hints: number): number {
  const base = moves <= par ? 3 : moves <= Math.ceil(par * 1.5) ? 2 : 1;
  return Math.max(1, base - hints);
}
