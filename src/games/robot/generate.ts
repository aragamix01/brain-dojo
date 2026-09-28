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

export type RandomTier = "loop" | "if" | "func";

export const RANDOM_TIERS: { id: RandomTier; emoji: string; title: string; desc: string }[] = [
  { id: "loop", emoji: "🔁", title: "Loop", desc: "แพทเทิร์นซ้ำ + ลูป ไม่มีสี" },
  { id: "if", emoji: "🚦", title: "If", desc: "อ่านสีบนกระดาน ตัดสินใจเลี้ยว" },
  { id: "func", emoji: "🧠", title: "Function + If", desc: "ฟังก์ชันซ้อน + เงื่อนไข ยากสุด" },
];

const HINTS: Record<RandomTier, string[]> = {
  loop: ["หาช่วงของทางที่ซ้ำกัน แล้วเขียนแค่รอบเดียว", "คำสั่งสุดท้ายของ F1 คือ F1 = วนซ้ำ"],
  if: ["ดูว่าหุ่นต้องเลี้ยวที่ช่องสีอะไร และเลี้ยวทางไหน", "สีบางสีอาจเป็นตัวหลอก ไม่ต้องทำอะไรก็ได้"],
  func: ["หาท่าพิเศษที่เกิดตรงช่องสี แล้วแยกไปใส่ F2/F3", "F1 มักเป็น: เดิน, เรียกฟังก์ชันตามสี, วน"],
};

const SIZE = 41;
const MAX_W = 8;
const MAX_H = 8;

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

function tryGenerate(rng: Rng, tier: RandomTier): Omit<RobotLevel, "id" | "title" | "titleEn"> | null {
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

  const targetMoves = randInt(rng, 10, 20);
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
  if (w > MAX_W || h > MAX_H || (w < 3 && h < 3)) return null;

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

export function generateRobotLevel(tier: RandomTier, seed: number): RobotLevel {
  const rng = rngFrom(`robot:${tier}:${seed}`);
  const meta = RANDOM_TIERS.find((t) => t.id === tier)!;
  for (;;) {
    const lv = tryGenerate(rng, tier);
    if (lv) return { ...lv, id: `rand-${tier}`, title: `Random · ${meta.title}`, titleEn: meta.desc };
  }
}
