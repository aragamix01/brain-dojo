import { pick, randInt, rngFrom, shuffle, type Rng } from "@/lib/rng";
import {
  compact,
  initRun,
  parseProgram,
  programToString,
  step,
  type Board,
  type Color,
  type Dir,
  type Program,
  type RobotLevel,
} from "./engine";

export type RandomTier = "seq" | "loop" | "if" | "func";

export const RANDOM_TIERS: { id: RandomTier; emoji: string; title: string; desc: string }[] = [
  { id: "seq", emoji: "👣", title: "Sequence", desc: "เดิน-เลี้ยวอย่างเดียว วางแผนเส้นทาง" },
  { id: "loop", emoji: "🔁", title: "Loop", desc: "แพทเทิร์นซ้ำ + ลูป ไม่มีสี" },
  { id: "if", emoji: "🚦", title: "If", desc: "อ่านสีบนกระดาน ตัดสินใจเลี้ยว" },
  { id: "func", emoji: "🧠", title: "Function + If", desc: "ฟังก์ชันซ้อน + เงื่อนไข ยากสุด" },
];

const HINTS: Record<RandomTier, string[]> = {
  seq: ["ไล่นิ้วตามทางจากหุ่นไปดาวก่อน แล้วค่อยใส่คำสั่ง", "นับจำนวนช่องก่อนถึงหัวมุมแต่ละจุด แล้วดูว่าต้องหมุนซ้ายหรือขวา"],
  loop: ["หาช่วงของทางที่ซ้ำกัน แล้วเขียนแค่รอบเดียว", "คำสั่งสุดท้ายของ F1 คือ F1 = วนซ้ำ"],
  if: ["ดูว่าหุ่นต้องเลี้ยวที่ช่องสีอะไร และเลี้ยวทางไหน", "สีบางสีอาจเป็นตัวหลอก ไม่ต้องทำอะไรก็ได้"],
  func: ["หาท่าพิเศษที่เกิดตรงช่องสี แล้วแยกไปใส่ F2/F3", "F1 มักเป็น: เดิน, เรียกฟังก์ชันตามสี, วน"],
};

const SIZE = 41;
/** Size knobs; Daily asks for shorter walks on smaller boards. */
export type RobotGenOpts = { moves: [number, number]; maxSize: number };
const DEFAULT_OPTS: RobotGenOpts = { moves: [10, 20], maxSize: 8 };
/** Sequence levels spell out every step, so they stay short. */
const SEQ_OPTS: RobotGenOpts = { moves: [6, 10], maxSize: 6 };

function randomSeq(rng: Rng, len: number, needTurn: boolean): string[] {
  for (;;) {
    const seq = Array.from({ length: len }, () => {
      const r = rng();
      return r < 0.5 ? "F" : r < 0.75 ? "L" : "R";
    });
    const hasF = seq.includes("F");
    const hasTurn = seq.some((c) => c !== "F");
    if (hasF && (!needTurn || hasTurn)) return seq;
  }
}

/** A random program for the tier, as source text understood by parseProgram. */
function template(rng: Rng, tier: RandomTier): { src: string; funcs: number[] } {
  const [c1, c2] = shuffle(rng, ["r", "g"] as Color[]);
  if (tier === "loop") {
    if (rng() < 0.6) {
      const seq = randomSeq(rng, randInt(rng, 3, 5), true);
      return { src: `${seq.join(" ")} 1`, funcs: [seq.length + 1] };
    }
    const k = randInt(rng, 2, 3);
    const turn = pick(rng, ["L", "R"]);
    return { src: `2 ${turn} 1 | ${Array(k).fill("F").join(" ")}`, funcs: [3, k] };
  }
  if (tier === "if") {
    if (rng() < 0.5) return { src: `F L:${c1} R:${c2} 1`, funcs: [4] };
    const turn = pick(rng, ["L", "R"]);
    return { src: `F ${turn}:${c1} 1`, funcs: [3] };
  }
  if (rng() < 0.5) {
    const f2 = randomSeq(rng, randInt(rng, 2, 3), true);
    return { src: `F 2:${c1} 1 | ${f2.join(" ")}`, funcs: [3, f2.length] };
  }
  const f2 = randomSeq(rng, 3, true);
  const f3 = randomSeq(rng, 3, true);
  return { src: `F 2:${c1} 3:${c2} 1 | ${f2.join(" ")} | ${f3.join(" ")}`, funcs: [4, 3, 3] };
}

function tryGenerate(
  rng: Rng,
  tier: RandomTier,
  opts: RobotGenOpts,
): Omit<RobotLevel, "id" | "title" | "titleEn"> | null {
  const { src, funcs } = template(rng, tier);
  const program: Program = parseProgram(src, funcs);
  const slots = compact(program);

  // Big board fully painted at random; the robot's actual path decides the level.
  const colors: Color[] =
    tier === "loop" ? ["b"] : ["b", "b", "b", "b", "b", "r", "r", "g", "g"].map((c) => c as Color);
  const tiles = Array.from({ length: SIZE * SIZE }, () => pick(rng, colors));
  const mid = Math.floor(SIZE / 2);
  tiles[mid * SIZE + mid] = "b";
  // A star nobody can reach keeps the run going while we record the path.
  const board: Board = { w: SIZE, h: SIZE, tiles, stars: [-1] };
  const dir = randInt(rng, 0, 3) as Dir;
  let s = initRun(
    { start: { x: mid, y: mid, dir } } as RobotLevel,
    board,
  );

  const targetMoves = randInt(rng, opts.moves[0], opts.moves[1]);
  const firstVisit = new Map<number, number>([[mid * SIZE + mid, 0]]);
  const path: number[] = [];
  const condUse = new Map<string, { ran: boolean; skipped: boolean }>();

  while (s.status === "ready" || s.status === "running") {
    const prev = s;
    s = step(s, board, program, slots);
    if (s.status === "fell" || s.status === "timeout" || s.status === "overflow" || s.status === "ended") return null;
    const cur = s.cursor && program[s.cursor.fn][s.cursor.slot];
    if (cur?.cond) {
      const k = `${s.cursor!.fn}:${s.cursor!.slot}`;
      const u = condUse.get(k) ?? { ran: false, skipped: false };
      if (s.skipped) u.skipped = true;
      else u.ran = true;
      condUse.set(k, u);
    }
    if (s.x !== prev.x || s.y !== prev.y) {
      const idx = s.y * SIZE + s.x;
      path.push(idx);
      const isNew = !firstVisit.has(idx);
      if (isNew) firstVisit.set(idx, path.length);
      if (path.length >= targetMoves && isNew) break;
      if (path.length > targetMoves + 12) return null;
    }
  }

  // Every condition must matter: it has to fire at least once and be skipped at least once.
  for (const u of condUse.values()) if (!u.ran || !u.skipped) return null;
  const condCount = program.flat().filter((c) => c?.cond).length;
  if (condUse.size < condCount) return null;

  const cells = [...firstVisit.keys()];
  if (cells.length < 8 || cells.length / path.length < 0.6) return null;
  const xs = cells.map((i) => i % SIZE);
  const ys = cells.map((i) => Math.floor(i / SIZE));
  const [x0, y0] = [Math.min(...xs), Math.min(...ys)];
  const [w, h] = [Math.max(...xs) - x0 + 1, Math.max(...ys) - y0 + 1];
  if (w > opts.maxSize || h > opts.maxSize || (w < 3 && h < 3)) return null;

  const last = path[path.length - 1];
  const extra = shuffle(
    rng,
    cells.filter((i) => i !== last && i !== mid * SIZE + mid),
  ).slice(0, randInt(rng, 1, 2));
  const stars = new Set([last, ...extra]);

  const rows = Array.from({ length: h }, (_, ry) =>
    Array.from({ length: w }, (_, rx) => {
      const i = (y0 + ry) * SIZE + (x0 + rx);
      if (!firstVisit.has(i)) return ".";
      return stars.has(i) ? tiles[i].toUpperCase() : tiles[i];
    }).join(""),
  );

  return {
    intro: "ด่านสุ่ม — มีโปรแกรมที่ใช้ช่องเท่านี้แก้ได้แน่นอน ลองหาให้เจอ!",
    hints: HINTS[tier],
    board: rows,
    start: { x: mid - x0, y: mid - y0, dir },
    funcs,
    solution: programToString(program),
  };
}

const DX = [0, 1, 0, -1];
const DY = [-1, 0, 1, 0];

/**
 * Sequence tier: a self-avoiding walk written out step by step. No loops or colours —
 * the challenge is planning the route, and there is exactly one spare slot.
 */
function trySequence(rng: Rng, opts: RobotGenOpts): Omit<RobotLevel, "id" | "title" | "titleEn"> | null {
  const moves = randInt(rng, opts.moves[0], opts.moves[1]);
  const startDir = randInt(rng, 0, 3) as Dir;
  let [x, y, dir] = [0, 0, startDir as number];
  const visited = new Set(["0,0"]);
  const path: string[] = [];
  const cmds: string[] = [];
  let lastTurned = true; // the first command should be a step, not a spin in place
  while (path.length < moves) {
    const free = (d: number) => !visited.has(`${x + DX[d]},${y + DY[d]}`);
    const turns = [
      ["L", (dir + 3) % 4],
      ["R", (dir + 1) % 4],
    ].filter(([, d]) => free(d as number)) as [string, number][];
    if (!lastTurned && turns.length && (rng() < 0.35 || !free(dir))) {
      const [c, d] = turns[Math.floor(rng() * turns.length)];
      cmds.push(c);
      dir = d;
      lastTurned = true;
      continue;
    }
    if (!free(dir)) return null;
    x += DX[dir];
    y += DY[dir];
    visited.add(`${x},${y}`);
    path.push(`${x},${y}`);
    cmds.push("F");
    lastTurned = false;
  }
  const cells = [...visited].map((k) => k.split(",").map(Number));
  const [x0, y0] = [Math.min(...cells.map((c) => c[0])), Math.min(...cells.map((c) => c[1]))];
  const [w, h] = [Math.max(...cells.map((c) => c[0])) - x0 + 1, Math.max(...cells.map((c) => c[1])) - y0 + 1];
  const turnsUsed = cmds.filter((c) => c !== "F").length;
  if (w > opts.maxSize || h > opts.maxSize || turnsUsed < 2) return null;

  const last = path[path.length - 1];
  const stars = new Set([last, pick(rng, path.slice(1, -1))]);
  const rows = Array.from({ length: h }, (_, ry) =>
    Array.from({ length: w }, (_, rx) => {
      const k = `${x0 + rx},${y0 + ry}`;
      return visited.has(k) ? (stars.has(k) ? "B" : "b") : ".";
    }).join(""),
  );
  return {
    intro: "ด่านสุ่ม — ไม่ต้องใช้ลูปหรือเงื่อนไข แค่วางแผนเส้นทางให้ครบ มีช่องเกินมาให้ 1 ช่อง",
    hints: HINTS.seq,
    board: rows,
    start: { x: -x0, y: -y0, dir: startDir },
    funcs: [cmds.length + 1],
    solution: cmds.join(" "),
  };
}

export function generateRobotLevel(tier: RandomTier, seed: number, opts?: RobotGenOpts): RobotLevel {
  const rng = rngFrom(`robot:${tier}:${seed}`);
  const meta = RANDOM_TIERS.find((t) => t.id === tier)!;
  for (;;) {
    const lv = tier === "seq" ? trySequence(rng, opts ?? SEQ_OPTS) : tryGenerate(rng, tier, opts ?? DEFAULT_OPTS);
    if (lv) return { ...lv, id: `rand-${tier}`, title: `Random · ${meta.title}`, titleEn: meta.desc };
  }
}
