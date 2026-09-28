export type Color = "r" | "g" | "b";
export type Dir = 0 | 1 | 2 | 3; // N E S W
export type Op = "F" | "L" | "R" | "C";
export type Cmd = { op: Op; fn?: number; cond: Color | null };
export type Program = (Cmd | null)[][];

export type RobotLevel = {
  id: string;
  title: string;
  titleEn: string;
  intro: string;
  hints: string[];
  /** '.' void, r/g/b tile, R/G/B tile with a star */
  board: string[];
  start: { x: number; y: number; dir: Dir };
  /** slot count per function */
  funcs: number[];
  /** reference solution, used only by tests — "F R:r 1 | F F" */
  solution: string;
};

export type Board = { w: number; h: number; tiles: (Color | null)[]; stars: number[] };

export function parseBoard(rows: string[]): Board {
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  const tiles: (Color | null)[] = [];
  const stars: number[] = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = rows[y][x] ?? ".";
      if (ch === ".") tiles.push(null);
      else {
        tiles.push(ch.toLowerCase() as Color);
        if (ch !== ch.toLowerCase()) stars.push(y * w + x);
      }
    }
  }
  return { w, h, tiles, stars };
}

export type Status = "ready" | "running" | "won" | "fell" | "timeout" | "overflow" | "ended";

export type RunState = {
  x: number;
  y: number;
  dir: Dir;
  /** cumulative rotation in degrees, so turns animate the short way */
  angle: number;
  stars: number[];
  stack: { fn: number; pc: number }[];
  steps: number;
  status: Status;
  /** slot just executed, for highlighting */
  cursor: { fn: number; slot: number } | null;
  skipped: boolean;
};

export const MAX_STEPS = 1500;
const MAX_STACK = 300;
const DX = [0, 1, 0, -1];
const DY = [-1, 0, 1, 0];

export function initRun(level: RobotLevel, board: Board): RunState {
  return {
    ...level.start,
    angle: level.start.dir * 90,
    stars: board.stars.slice(),
    stack: [{ fn: 0, pc: 0 }],
    steps: 0,
    status: "ready",
    cursor: null,
    skipped: false,
  };
}

/** Slot indices of non-empty commands per function. */
export const compact = (program: Program) =>
  program.map((f) => f.flatMap((c, i) => (c ? [i] : [])));

export function step(s: RunState, board: Board, program: Program, slots = compact(program)): RunState {
  if (s.status !== "ready" && s.status !== "running") return s;
  const stack = s.stack.map((f) => ({ ...f }));
  for (;;) {
    const top = stack[stack.length - 1];
    if (!top) return { ...s, stack, status: "ended", cursor: null };
    if (top.pc >= slots[top.fn].length) {
      stack.pop();
      continue;
    }
    const slot = slots[top.fn][top.pc];
    const cmd = program[top.fn][slot]!;
    top.pc++;
    const next: RunState = {
      ...s,
      stack,
      steps: s.steps + 1,
      status: "running",
      cursor: { fn: top.fn, slot },
      skipped: false,
    };
    if (next.steps > MAX_STEPS) return { ...next, status: "timeout" };
    const here = board.tiles[s.y * board.w + s.x];
    if (cmd.cond && cmd.cond !== here) return { ...next, skipped: true };

    switch (cmd.op) {
      case "L":
        return { ...next, dir: ((s.dir + 3) % 4) as Dir, angle: s.angle - 90 };
      case "R":
        return { ...next, dir: ((s.dir + 1) % 4) as Dir, angle: s.angle + 90 };
      case "F": {
        const x = s.x + DX[s.dir];
        const y = s.y + DY[s.dir];
        if (x < 0 || y < 0 || x >= board.w || y >= board.h || !board.tiles[y * board.w + x])
          return { ...next, x, y, status: "fell" };
        const stars = s.stars.filter((i) => i !== y * board.w + x);
        return { ...next, x, y, stars, status: stars.length ? "running" : "won" };
      }
      case "C": {
        // Tail call: drop the finished frame so endless recursion doesn't grow the stack.
        if (top.pc >= slots[top.fn].length) stack.pop();
        stack.push({ fn: cmd.fn!, pc: 0 });
        return stack.length > MAX_STACK ? { ...next, status: "overflow" } : next;
      }
    }
  }
}

/** Parse "F L:g 1 | F F" into a program sized to `funcs`. */
export function parseProgram(src: string, funcs: number[]): Program {
  const parts = src.split("|").map((p) => p.trim().split(/\s+/).filter(Boolean));
  return funcs.map((n, i) => {
    const toks = parts[i] ?? [];
    if (toks.length > n) throw new Error(`F${i + 1} has ${toks.length} commands, only ${n} slots`);
    const cmds: (Cmd | null)[] = toks.map((t) => {
      const [op, cond] = t.split(":");
      const c = (cond as Color) ?? null;
      if (/^\d$/.test(op)) return { op: "C", fn: Number(op) - 1, cond: c };
      return { op: op as Op, cond: c };
    });
    return [...cmds, ...Array(n - cmds.length).fill(null)];
  });
}

export function runToEnd(level: RobotLevel, program: Program): RunState {
  const board = parseBoard(level.board);
  const slots = compact(program);
  let s = initRun(level, board);
  while (s.status === "ready" || s.status === "running") s = step(s, board, program, slots);
  return s;
}
