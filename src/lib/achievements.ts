// Badges: computed from progress, so they can never drift out of sync with what was played.
import { QUEST_NODES } from "@/games/quest/data";
import { CHAPTERS } from "@/games/robot/levels";
import type { ProgressData } from "./store";

export type Achievement = {
  id: string;
  emoji: string;
  name: string;
  desc: string;
  /** progress toward the badge; earned when cur >= max */
  progress: (p: ProgressData) => { cur: number; max: number };
};

export const BADGE_COINS = 2;

const questDone = (p: ProgressData, id: string) => !!p.games[`quest:${id}`];

/** A robot level counts whether it was cleared in Free Play or on the quest map. */
function robotDone(p: ProgressData, levelId: string) {
  if (p.games[`robot:${levelId}`]) return true;
  return QUEST_NODES.some((n) => n.kind === "robot" && n.level === levelId && questDone(p, n.id));
}

function chapter(id: string, emoji: string, name: string, desc: string): Achievement {
  const ch = CHAPTERS.find((c) => c.id === id)!;
  return {
    id: `robot-${id}`,
    emoji,
    name,
    desc,
    progress: (p) => ({ cur: ch.levels.filter((l) => robotDone(p, l.id)).length, max: ch.levels.length }),
  };
}

const count = (n: number, max: number) => ({ cur: Math.min(n, max), max });

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-sail",
    emoji: "⛵",
    name: "ออกเรือครั้งแรก",
    desc: "ผ่านด่านแรกบนแผนที่",
    progress: (p) => count(QUEST_NODES.filter((n) => questDone(p, n.id)).length, 1),
  },
  {
    id: "island-one",
    emoji: "🏝️",
    name: "พิชิตเกาะแรก",
    desc: "ผ่านทุกด่านบนหาดเรือแตก",
    progress: (p) => {
      const nodes = QUEST_NODES.filter((n) => n.island.id === "beach");
      return { cur: nodes.filter((n) => questDone(p, n.id)).length, max: nodes.length };
    },
  },
  {
    id: "treasure-hunter",
    emoji: "🎁",
    name: "นักล่าสมบัติ",
    desc: "เปิดหีบสมบัติ 3 ใบ",
    progress: (p) => count(Object.keys(p.chests).length, 3),
  },
  {
    id: "captain",
    emoji: "👑",
    name: "กัปตันตัวจริง",
    desc: "เปิดหีบสมบัติครบทุกเกาะ",
    progress: (p) => count(Object.keys(p.chests).length, 6),
  },
  chapter("seq", "👣", "ก้าวแรกของโปรแกรมเมอร์", "ผ่านหมวด Sequence ของ Robot ครบ"),
  chapter("loop", "🔁", "เจ้าแห่งลูป", "ผ่านหมวด Loop ของ Robot ครบ"),
  chapter("if", "🚦", "ผู้ตัดสินใจ", "ผ่านหมวด If ของ Robot ครบ"),
  chapter("stack", "📚", "จอม Recursion", "ผ่านหมวด Recursion ของ Robot ครบ"),
  chapter("debug", "🐞", "นักล่าบั๊ก", "ผ่านหมวด Debug ของ Robot ครบ"),
  {
    id: "three-star-20",
    emoji: "🌟",
    name: "สามดาวสะสม",
    desc: "ได้ 3★ ใน 20 ด่าน/เกมที่ต่างกัน",
    progress: (p) => count(Object.values(p.games).filter((g) => g.bestStars === 3).length, 20),
  },
  {
    id: "human-calculator",
    emoji: "⚡",
    name: "เครื่องคิดเลขมนุษย์",
    desc: "Speed Math ได้ 30 แต้มขึ้นไป",
    progress: (p) => count(p.games.sprint?.bestScore ?? 0, 30),
  },
  {
    id: "lights-10",
    emoji: "💡",
    name: "ไฟดับทั้งเมือง",
    desc: "ชนะ Lights Out 10 ครั้ง (ลานฝึกดาบ)",
    progress: (p) => count(p.games["logic:lights"]?.wins ?? 0, 10),
  },
  {
    id: "daily-7",
    emoji: "📅",
    name: "นักผจญภัยรายวัน",
    desc: "เล่น Daily จบ 7 วัน",
    progress: (p) => count(Object.keys(p.daily).length, 7),
  },
  {
    id: "streak-7",
    emoji: "⚔️",
    name: "ลูกเรือไม่เคยขาด",
    desc: "เล่น Daily ติดกัน 7 วัน",
    progress: (p) => count(p.bestStreak, 7),
  },
  {
    id: "streak-30",
    emoji: "☄️",
    name: "ตำนาน 30 วัน",
    desc: "เล่น Daily ติดกัน 30 วัน",
    progress: (p) => count(p.bestStreak, 30),
  },
  {
    id: "rank-b",
    emoji: "🏴‍☠️",
    name: "ค่าหัวหลักพัน",
    desc: "สะสมค่าหัวถึง 1,500 XP (Rank B)",
    progress: (p) => count(p.xp, 1500),
  },
];

/** Badge ids earned by this progress that aren't recorded yet. */
export function newlyEarned(p: ProgressData): Achievement[] {
  return ACHIEVEMENTS.filter((a) => {
    if (p.badges?.[a.id]) return false;
    const { cur, max } = a.progress(p);
    return cur >= max;
  });
}
