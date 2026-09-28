import { hashString, rngFrom } from "@/lib/rng";
import type { GameStat } from "@/lib/store";
import { generateJugs } from "../jugs/logic";
import { generateLights } from "../lights/logic";
import { robotLevel } from "../robot/levels";
import { theme } from "../situation/data";
import { CHEST_RATIO, ISLANDS, QUEST_NODES, type Island, type QuestNode } from "./data";

export const questKey = (id: string) => `quest:${id}`;
export const chestId = (isl: Island) => `chest:${isl.id}`;

const KIND_META: Record<QuestNode["kind"], { emoji: string; label: string }> = {
  robot: { emoji: "🤖", label: "Robot Code" },
  lights: { emoji: "💡", label: "Lights Out" },
  jugs: { emoji: "🫙", label: "Water Jugs" },
  nonogram: { emoji: "🧩", label: "Nonogram" },
  hanoi: { emoji: "🗼", label: "Tower of Hanoi" },
  situation: { emoji: "🎯", label: "Situation" },
  sprint: { emoji: "⚡", label: "Speed Math" },
};

export function nodeInfo(n: QuestNode): { emoji: string; title: string; sub: string } {
  const meta = KIND_META[n.kind];
  switch (n.kind) {
    case "robot":
      return { emoji: meta.emoji, title: robotLevel(n.level)?.title ?? n.level, sub: meta.label };
    case "lights":
      return { emoji: meta.emoji, title: `Lights Out ${n.size}×${n.size}`, sub: "ปิดไฟให้หมด" };
    case "jugs":
      return { emoji: meta.emoji, title: n.variant === "two" ? "ตวงน้ำ 2 เหยือก" : "ตวงน้ำ 3 เหยือก", sub: meta.label };
    case "nonogram":
      return { emoji: meta.emoji, title: `ภาพปริศนา ${n.size}×${n.size}`, sub: meta.label };
    case "hanoi":
      return { emoji: meta.emoji, title: `หอคอย ${n.disks} แผ่น`, sub: meta.label };
    case "situation":
      return { emoji: meta.emoji, title: theme(n.theme)?.title ?? n.theme, sub: meta.label };
    case "sprint":
      return { emoji: meta.emoji, title: `คิดเลขเร็ว ${n.goal} แต้ม`, sub: `${n.seconds} วินาที` };
  }
}

/** Par of the puzzle a node would play with this seed (only for kinds that can be capped). */
function parOf(n: QuestNode, seed: number): number | null {
  if (n.kind === "jugs") return generateJugs(rngFrom(seed), n.variant).par;
  if (n.kind === "lights") return generateLights(rngFrom(seed), n.size, n.minPar).par;
  return null;
}

/** Every node plays one fixed puzzle, so the map is the same for everyone. */
export function nodeSeed(n: QuestNode): number {
  const maxPar = "maxPar" in n ? n.maxPar : undefined;
  if (!maxPar) return hashString(`quest:${n.id}`);
  // Early nodes should be gentle: take the first seed whose puzzle fits the cap.
  for (let i = 0; i < 500; i++) {
    const seed = hashString(`quest:${n.id}:${i}`);
    if (parOf(n, seed)! <= maxPar) return seed;
  }
  throw new Error(`no puzzle for ${n.id} within par ${maxPar}`);
}

export type QuestView = {
  stars: Record<string, number>;
  /** index into QUEST_NODES of the first unfinished node (length when all done) */
  current: number;
  islands: {
    island: Island;
    stars: number;
    max: number;
    need: number;
    complete: boolean;
    canOpen: boolean;
  }[];
};

export function questView(games: Record<string, GameStat>): QuestView {
  const stars = Object.fromEntries(QUEST_NODES.map((n) => [n.id, games[questKey(n.id)]?.bestStars ?? 0]));
  const firstOpen = QUEST_NODES.findIndex((n) => !stars[n.id]);
  const islands = ISLANDS.map((island) => {
    const got = island.nodes.reduce((a, n) => a + stars[n.id], 0);
    const max = island.nodes.length * 3;
    const need = Math.ceil(max * CHEST_RATIO);
    const complete = island.nodes.every((n) => stars[n.id] > 0);
    return { island, stars: got, max, need, complete, canOpen: complete && got >= need };
  });
  return { stars, current: firstOpen === -1 ? QUEST_NODES.length : firstOpen, islands };
}

export const isUnlocked = (view: QuestView, nodeId: string) =>
  QUEST_NODES.findIndex((n) => n.id === nodeId) <= view.current;

// ---- Claim codes -------------------------------------------------------------
// Not cryptography — just enough that a code can't be guessed without the app.
const CLAIM_SALT = "brain-dojo::captain-treasure";

const normName = (name: string) => name.trim().toLowerCase();

export function claimCode(name: string, islandIndex: number): string {
  const h = hashString(`${normName(name)}|${ISLANDS[islandIndex].id}|${CLAIM_SALT}`);
  return `C${islandIndex + 1}-${h.toString(36).toUpperCase().padStart(4, "0").slice(-4)}`;
}

export function verifyClaim(name: string, code: string): { ok: true; island: Island } | { ok: false } {
  const m = /^C(\d+)-([0-9A-Z]{4})$/.exec(code.trim().toUpperCase());
  if (!m) return { ok: false };
  const idx = Number(m[1]) - 1;
  if (!ISLANDS[idx] || !normName(name)) return { ok: false };
  return claimCode(name, idx) === code.trim().toUpperCase() ? { ok: true, island: ISLANDS[idx] } : { ok: false };
}
