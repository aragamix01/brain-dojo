// Star Hunt: on some days the Daily asks for stars earned on the Quest map and in Free Play,
// instead of its own random games — a nudge to go play the rest of the app.
import { LOGIC_GAMES } from "../catalog";
import { questNode } from "../quest/data";
import { robotLevel } from "../robot/levels";
import { theme } from "../situation/data";

export const HUNT = {
  target: 9,
  /** Date.getDay(): Sunday and Wednesday */
  days: [0, 3],
};

export function isHuntDay(date: string): boolean {
  const [y, m, d] = date.split("-").map(Number);
  return HUNT.days.includes(new Date(y, m - 1, d).getDay());
}

/** Today's best stars per game/level, so replaying the same one can't farm the count. */
export type HuntLog = { day: string; stars: Record<string, number>; startedAt: number; hintsAt: number };

export function addHuntStars(
  log: HuntLog | undefined,
  today: string,
  key: string,
  stars: number,
  now: number,
  hintsUsed: number,
): HuntLog {
  const cur = log?.day === today ? log : { day: today, stars: {}, startedAt: now, hintsAt: hintsUsed };
  return { ...cur, stars: { ...cur.stars, [key]: Math.max(cur.stars[key] ?? 0, Math.min(3, stars)) } };
}

export function huntTotal(log: HuntLog | undefined, today: string): number {
  if (log?.day !== today) return 0;
  return Object.values(log.stars).reduce((a, b) => a + b, 0);
}

/** Readable name for a progress key, for the list of what counted today. */
export function huntLabel(key: string): string {
  const [kind, id = ""] = key.split(":");
  switch (kind) {
    case "quest": {
      const n = questNode(id);
      if (!n) return "🗺️ แผนที่";
      return `${n.island.emoji} ${n.island.name} ด่าน ${n.island.nodes.findIndex((x) => x.id === id) + 1}${n.boss ? " 👹" : ""}`;
    }
    case "logic": {
      const g = LOGIC_GAMES.find((x) => x.id === id);
      return g ? `${g.emoji} ${g.title}` : "⚔️ ลานฝึก";
    }
    case "robot":
      return id.startsWith("rand-") ? "🤖 Robot สุ่มด่าน" : `🤖 Robot ${robotLevel(id)?.title ?? id}`;
    case "situation":
      return `🎯 ${theme(id)?.title ?? "Situation"}`;
    case "sprint":
      return "⚡ Speed Math";
    default:
      return key;
  }
}
