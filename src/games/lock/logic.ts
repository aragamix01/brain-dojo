// Treasure-chest lock (Mastermind): guess the gem code, each try says how many gems are
// in the right spot and how many are the right gem in the wrong spot.
import { pick, shuffle, type Rng } from "@/lib/rng";

export type LockLevel = "easy" | "normal" | "hard";

export type LockConfig = { pegs: number; colors: number; repeats: boolean; par: number };

export const LOCK_LEVELS: Record<LockLevel, LockConfig> = {
  easy: { pegs: 3, colors: 4, repeats: false, par: 4 },
  normal: { pegs: 4, colors: 6, repeats: false, par: 6 },
  hard: { pegs: 4, colors: 6, repeats: true, par: 7 },
};

export const GEMS = ["🔴", "🟡", "🟢", "🔵", "🟣", "🟠"];

export type LockPuzzle = LockConfig & { code: number[] };

export function generateLock(rng: Rng, level: LockLevel): LockPuzzle {
  const cfg = LOCK_LEVELS[level];
  const colors = Array.from({ length: cfg.colors }, (_, i) => i);
  const code = cfg.repeats
    ? Array.from({ length: cfg.pegs }, () => pick(rng, colors))
    : shuffle(rng, colors).slice(0, cfg.pegs);
  return { ...cfg, code };
}

export type Feedback = { exact: number; near: number };

export function score(code: number[], guess: number[]): Feedback {
  let exact = 0;
  const left = new Map<number, number>();
  const rest: number[] = [];
  code.forEach((c, i) => {
    if (guess[i] === c) exact++;
    else {
      left.set(c, (left.get(c) ?? 0) + 1);
      rest.push(guess[i]);
    }
  });
  let near = 0;
  for (const g of rest) {
    const n = left.get(g) ?? 0;
    if (n > 0) {
      near++;
      left.set(g, n - 1);
    }
  }
  return { exact, near };
}

/** Every code the lock could have, under its rules. */
export function allCodes(cfg: LockConfig): number[][] {
  const out: number[][] = [];
  const cur: number[] = [];
  const rec = () => {
    if (cur.length === cfg.pegs) return void out.push([...cur]);
    for (let c = 0; c < cfg.colors; c++) {
      if (!cfg.repeats && cur.includes(c)) continue;
      cur.push(c);
      rec();
      cur.pop();
    }
  };
  rec();
  return out;
}

/** Codes still possible after these guesses. */
export function stillPossible(cfg: LockConfig, history: { guess: number[]; fb: Feedback }[]): number[][] {
  return allCodes(cfg).filter((c) =>
    history.every((h) => {
      const f = score(c, h.guess);
      return f.exact === h.fb.exact && f.near === h.fb.near;
    }),
  );
}
