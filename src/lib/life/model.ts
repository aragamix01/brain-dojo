// Weekly Life Quest: the data shapes and the pure rules (weeks, XP, levels, achievements and how
// Brain Dojo Daily rewards split 70 / 30 around the weekly check-in). No storage, no crypto here,
// so both the server and the pages (and scripts/check.ts) use it.
import { shiftDay, weekOf } from "../date";
import type { Question } from "./questions";

/** One answer: chosen options (with the box a choice asks for), a 1–5 rating, a written note, or skipped. */
export type Answer = { picks?: string[]; notes?: Record<string, string>; rating?: number; text?: string; skipped?: boolean };
export type Answers = Record<string, Answer>;

/** A submitted weekly check-in. Questions are copied in, so later edits to the bank don't change it. */
export type WeekEntry = {
  week: string;
  questions: Pick<Question, "id" | "topic" | "text" | "type">[];
  answers: Answers;
  submittedAt: number;
  /** each later edit: when, and which questions changed */
  history: { at: number; changed: string[] }[];
  xp: number;
  /** the goal set in the last question, and whether it was met */
  goalDone?: boolean;
  goalDoneAt?: number;
};

export type Draft = { week: string; answers: Answers; savedAt: number };

export type TaskStatus = 0 | 1 | 2 | 3;
export const TASK_STATUS = ["ยังไม่เริ่ม", "กำลังทำ", "เสร็จแล้ว", "ส่งแล้ว"] as const;

export type Task = {
  id: string;
  subject: string;
  title: string;
  /** due day key, or "" */
  due: string;
  status: TaskStatus;
  help: string;
  createdAt: number;
  updatedAt: number;
  /** XP already given for reaching "done" */
  rewarded?: boolean;
};

export type Understanding = "good" | "ok" | "weak";
export const UNDERSTANDING: Record<Understanding, string> = { good: "ดี", ok: "ปานกลาง", weak: "ต้องปรับปรุง" };

export type Score = { at: number; label: string; score: number; max: number };
export type Subject = { id: string; name: string; level: Understanding; scores: Score[]; help: string };

export type Study = { tasks: Task[]; subjects: Subject[] };

export type Player = {
  name: string;
  /** start of the week the PIN was set: Brain Dojo Dailies from here on pay through Life Quest */
  startDay: string;
  xp: number;
  achievements: Record<string, number>;
  /** faculties / careers the player is curious about */
  careers: string[];
};

export type Message = { id: string; at: number; text: string };
export type LogEntry = { at: number; text: string };
export type DailyDay = { stars: number; minutes: number; at: number };

// ---------------------------------------------------------------- days and weeks

/** Today's day key in Thailand (the server runs on UTC). */
export function bangkokToday(now = Date.now()): string {
  const t = new Date(now + 7 * 3_600_000);
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}-${String(t.getUTCDate()).padStart(2, "0")}`;
}

/** The Sunday that starts `day`'s week; weeks run Sunday → Saturday like the Brain Dojo report. */
export const weekStart = (day: string) => weekOf(day)[0];
export const weekEnd = (week: string) => shiftDay(week, 6);

const TH_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const dm = (d: string) => ({ d: Number(d.slice(8)), m: Number(d.slice(5, 7)) - 1 });

/** "23–29 พ.ย." or "30 พ.ย.–6 ธ.ค." */
export function weekLabel(week: string): string {
  const a = dm(week);
  const b = dm(weekEnd(week));
  return a.m === b.m ? `${a.d}–${b.d} ${TH_MONTHS[b.m]}` : `${a.d} ${TH_MONTHS[a.m]}–${b.d} ${TH_MONTHS[b.m]}`;
}

export const dayLabel = (d: string) => `${dm(d).d} ${TH_MONTHS[dm(d).m]}`;

// ---------------------------------------------------------------- XP and levels

export const XP = { checkIn: 100, perNote: 10, maxNotes: 5, taskDone: 10, goalDone: 20 } as const;
export const LEVEL_XP = 500;
const TITLES = ["มือใหม่", "นักเดินทาง", "นักสำรวจ", "นักผจญภัย", "ผู้กล้า", "ตำนาน"];

export function levelFor(xp: number) {
  const level = Math.floor(xp / LEVEL_XP) + 1;
  return { level, title: TITLES[Math.min(level, TITLES.length) - 1], into: xp % LEVEL_XP, need: LEVEL_XP };
}

/** XP for a check-in: a flat amount for sending it, plus a little for each written note. Never less. */
export function checkInXp(answers: Answers): number {
  const notes = Object.values(answers).filter((a) => !a.skipped && a.text?.trim()).length;
  return XP.checkIn + Math.min(notes, XP.maxNotes) * XP.perNote;
}

/** Which questions differ between two answer sets (for the edit history the parent sees). */
export function changedQuestions(before: Answers, after: Answers): string[] {
  const ids = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...ids].filter((id) => JSON.stringify(before[id] ?? {}) !== JSON.stringify(after[id] ?? {}));
}

/** Keeps only well-formed answers to known questions, trimmed to sane sizes. */
export function cleanAnswers(raw: unknown, questions: Question[]): Answers {
  const out: Answers = {};
  if (!raw || typeof raw !== "object") return out;
  for (const q of questions) {
    const a = (raw as Record<string, unknown>)[q.id];
    if (!a || typeof a !== "object") continue;
    const src = a as Record<string, unknown>;
    const ans: Answer = {};
    if (src.skipped === true && q.skippable) ans.skipped = true;
    if (Array.isArray(src.picks)) {
      const picks = src.picks.filter((p): p is string => typeof p === "string" && (q.options ?? []).includes(p));
      if (picks.length) ans.picks = q.type === "single" ? picks.slice(0, 1) : picks;
      const rawNotes = src.notes && typeof src.notes === "object" ? (src.notes as Record<string, unknown>) : {};
      const notes: Record<string, string> = {};
      for (const p of ans.picks ?? []) {
        const n = rawNotes[p];
        if (q.followUps?.[p] && typeof n === "string" && n.trim()) notes[p] = n.trim().slice(0, 300);
      }
      if (Object.keys(notes).length) ans.notes = notes;
    }
    if (q.type === "rating" && Number.isInteger(src.rating) && (src.rating as number) >= 1 && (src.rating as number) <= 5)
      ans.rating = src.rating as number;
    if (typeof src.text === "string" && src.text.trim()) ans.text = src.text.trim().slice(0, 1000);
    if (Object.keys(ans).length) out[q.id] = ans;
  }
  return out;
}

/** What's still missing for this question before the check-in can be sent, or null when it's done. */
export function missing(q: Question, a: Answer | undefined): string | null {
  if (a?.skipped && q.skippable) return null;
  if (q.type === "single" || q.type === "multi") {
    if (!a?.picks?.length) return q.type === "multi" ? "เลือกอย่างน้อย 1 ข้อนะ" : "เลือกคำตอบก่อนนะ";
    const open = a.picks.find((p) => q.followUps?.[p] && !a.notes?.[p]?.trim());
    return open ? `เขียนช่อง "${q.followUps![open]}" ก่อนนะ` : null;
  }
  if (q.type === "rating") return a?.rating ? null : "เลือกคะแนนก่อนนะ";
  return a?.text?.trim() ? null : "เขียนคำตอบก่อนนะ";
}

// ---------------------------------------------------------------- achievements

export const ACHIEVEMENTS = [
  { id: "first-quest", name: "First Quest", how: "ส่งเช็กอินครั้งแรก" },
  { id: "study-hero", name: "Study Hero", how: "ทำงานเรียนเสร็จ 5 ชิ้น" },
  { id: "consistency-star", name: "Consistency Star", how: "เช็กอินติดกัน 4 สัปดาห์" },
  { id: "goal-getter", name: "Goal Getter", how: "ทำเป้าหมายสำเร็จ 3 ครั้ง" },
  { id: "never-give-up", name: "Never Give Up", how: "ทำเป้าสำเร็จหลังเคยพลาด" },
] as const;

export function earnedAchievements(weeks: WeekEntry[], study: Study): string[] {
  const got: string[] = [];
  const sorted = [...weeks].sort((a, b) => a.week.localeCompare(b.week));
  if (sorted.length) got.push("first-quest");
  if (study.tasks.filter((t) => t.status >= 2).length >= 5) got.push("study-hero");
  // four weeks in a row anywhere in the history
  let run = 0;
  for (let i = 0; i < sorted.length; i++) {
    run = i && shiftDay(sorted[i - 1].week, 7) === sorted[i].week ? run + 1 : 1;
    if (run >= 4) {
      got.push("consistency-star");
      break;
    }
  }
  if (sorted.filter((w) => w.goalDone).length >= 3) got.push("goal-getter");
  const missedEarlier = sorted.findIndex((w) => w.goalDone === false && goalOf(w));
  if (missedEarlier >= 0 && sorted.slice(missedEarlier + 1).some((w) => w.goalDone)) got.push("never-give-up");
  return got;
}

/** The goal written in a week's last question, with its area. */
export function goalOf(w: Pick<WeekEntry, "answers">): { area: string; text: string } | null {
  const a = w.answers["next-goal"];
  if (!a || a.skipped || (!a.text && !a.picks?.length)) return null;
  return { area: a.picks?.[0] ?? "", text: a.text ?? a.picks?.[0] ?? "" };
}

// ---------------------------------------------------------------- PC time: 70 now, 30 after the check-in

/** Share of each week's Daily PC time held back until that week's check-in is sent. */
export const HOLD_SHARE = 0.3;
const UNIT = 15;

export type WeekReward = {
  week: string;
  days: string[];
  /** all of the week's Daily time, as the old per-day rule gave it */
  total: number;
  held: number;
  /** check-in sent: the held part is free too */
  unlocked: boolean;
  /** week over without a check-in: the held part is gone */
  expired: boolean;
  available: number;
  paid: number;
  owed: number;
};

/** The held part, in the PC's 15-minute steps. */
export const heldOf = (total: number) => Math.round((total * HOLD_SHARE) / UNIT) * UNIT;

export function weekRewards(
  daily: Record<string, DailyDay>,
  submitted: Set<string>,
  paid: Record<string, number>,
  today: string,
): WeekReward[] {
  const byWeek = new Map<string, string[]>();
  for (const day of Object.keys(daily).sort()) {
    if (day > today) continue;
    const w = weekStart(day);
    byWeek.set(w, [...(byWeek.get(w) ?? []), day]);
  }
  return [...byWeek.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([week, days]) => {
      const total = days.reduce((a, d) => a + daily[d].minutes, 0);
      const held = heldOf(total);
      const unlocked = submitted.has(week);
      const available = unlocked ? total : total - held;
      const p = paid[week] ?? 0;
      return {
        week,
        days,
        total,
        held,
        unlocked,
        expired: !unlocked && weekEnd(week) < today,
        available,
        paid: p,
        owed: Math.max(0, available - p),
      };
    });
}
