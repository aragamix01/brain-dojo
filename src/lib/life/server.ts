import "server-only";
import { rewardMinutes } from "../kidtimer/reward";
import { K, PLAYER_HASHES, PLAYER_VALUES, playerKey, scoped, type Store } from "./db";
import {
  ACHIEVEMENTS,
  bangkokToday,
  changedQuestions,
  checkInXp,
  cleanAnswers,
  earnedAchievements,
  goalOf,
  levelFor,
  weekLabel,
  weekRewards,
  weekStart,
  XP,
  type DailyDay,
  type Draft,
  type LogEntry,
  type Message,
  type Player,
  type Study,
  type WeekEntry,
} from "./model";
import { DEFAULT_QUESTIONS, type Question } from "./questions";
import { shiftDay } from "../date";

export const newId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export async function questions(db: Store): Promise<Question[]> {
  return (await db.get<Question[]>(K.questions)) ?? DEFAULT_QUESTIONS;
}

export async function player(db: Store): Promise<Player | null> {
  return db.get<Player>(K.player);
}

export async function study(db: Store): Promise<Study> {
  return (await db.get<Study>(K.study)) ?? { tasks: [], subjects: [] };
}

export async function weeks(db: Store): Promise<WeekEntry[]> {
  return Object.values(await db.hgetall<WeekEntry>(K.weeks)).sort((a, b) => b.week.localeCompare(a.week));
}

export async function messages(db: Store): Promise<Message[]> {
  return (await db.get<Message[]>(K.messages)) ?? [];
}

export async function pushLog(db: Store, text: string) {
  const log = (await db.get<LogEntry[]>(K.log)) ?? [];
  await db.set(K.log, [{ at: Date.now(), text }, ...log].slice(0, 40));
}

/** Adds XP (never takes any away) and records achievements earned so far; returns the new ones. */
export async function award(db: Store, xp: number): Promise<string[]> {
  const p = await player(db);
  if (!p) return [];
  const earned = earnedAchievements(await weeks(db), await study(db));
  const fresh = earned.filter((id) => !p.achievements[id]);
  const now = Date.now();
  await db.set(K.player, {
    ...p,
    xp: p.xp + Math.max(0, xp),
    achievements: { ...p.achievements, ...Object.fromEntries(fresh.map((id) => [id, now])) },
  });
  for (const id of fresh) await pushLog(db, `ปลดล็อก Achievement: ${ACHIEVEMENTS.find((a) => a.id === id)?.name}`);
  return fresh;
}

export async function rewards(db: Store, today = bangkokToday()) {
  const [daily, paid, ws] = await Promise.all([
    db.hgetall<DailyDay>(K.daily),
    db.hgetall<number>(K.paid),
    weeks(db),
  ]);
  const paidNum = Object.fromEntries(Object.entries(paid).map(([k, v]) => [k, Number(v)]));
  return { daily, list: weekRewards(daily, new Set(ws.map((w) => w.week)), paidNum, today) };
}

/** Everything the player's own screens show. Drafts are the player's alone. */
export async function playerState(db: Store) {
  const today = bangkokToday();
  const week = weekStart(today);
  const [p, qs, draft, ws, st, msgs, rw] = await Promise.all([
    player(db),
    questions(db),
    db.get<Draft>(K.draft),
    weeks(db),
    study(db),
    messages(db),
    rewards(db, today),
  ]);
  return {
    today,
    week,
    weekLabel: weekLabel(week),
    player: p,
    level: levelFor(p?.xp ?? 0),
    questions: qs.filter((q) => q.active),
    draft: draft?.week === week ? draft : null,
    thisWeek: ws.find((w) => w.week === week) ?? null,
    weeks: ws,
    study: st,
    messages: msgs.slice(0, 5),
    rewards: rw.list.filter((r) => r.week >= shiftDay(week, -7)),
    dailyDays: Object.keys(rw.daily).filter((d) => d >= week),
  };
}

/** Saves this week's check-in (first send or a later edit); returns XP gained and new achievements. */
export async function submitCheckIn(db: Store, raw: unknown) {
  const week = weekStart(bangkokToday());
  const qs = (await questions(db)).filter((q) => q.active);
  const answers = cleanAnswers(raw, qs);
  const all = await db.hgetall<WeekEntry>(K.weeks);
  const before = all[week];
  const xp = checkInXp(answers);
  const now = Date.now();
  const entry: WeekEntry = before
    ? {
        ...before,
        answers,
        questions: qs.map(({ id, topic, text, type }) => ({ id, topic, text, type })),
        history: [...before.history, { at: now, changed: changedQuestions(before.answers, answers) }],
        xp: Math.max(before.xp, xp),
      }
    : {
        week,
        questions: qs.map(({ id, topic, text, type }) => ({ id, topic, text, type })),
        answers,
        submittedAt: now,
        history: [],
        xp,
      };
  await db.hset(K.weeks, week, entry);
  await db.del(K.draft);
  await pushLog(db, before ? `แก้คำตอบเช็กอิน ${weekLabel(week)}` : `ส่งเช็กอิน ${weekLabel(week)} (+${xp} XP)`);
  const gained = entry.xp - (before?.xp ?? 0);
  const fresh = await award(db, gained);
  const rw = (await rewards(db)).list.find((r) => r.week === week);
  return { xp: gained, achievements: fresh, unlocked: before ? 0 : rw?.held ?? 0, first: !before };
}

export async function setGoal(db: Store, week: string, done: boolean) {
  const all = await db.hgetall<WeekEntry>(K.weeks);
  const w = all[week];
  if (!w || !goalOf(w)) return { xp: 0, achievements: [] as string[] };
  const firstTime = done && !w.goalDoneAt;
  await db.hset(K.weeks, week, { ...w, goalDone: done, goalDoneAt: w.goalDoneAt ?? (done ? Date.now() : undefined) });
  if (done) await pushLog(db, `ทำเป้าหมายสำเร็จ: ${goalOf(w)!.text}`);
  return { xp: firstTime ? XP.goalDone : 0, achievements: await award(db, firstTime ? XP.goalDone : 0) };
}

/** Brain Dojo Dailies sent up from the player's phone; the first report of a day stands. */
export async function syncDaily(db: Store, raw: unknown) {
  const p = await player(db);
  if (!p || !Array.isArray(raw)) return 0;
  const today = bangkokToday();
  const oldest = shiftDay(today, -13);
  let added = 0;
  for (const item of raw.slice(0, 31)) {
    const day = typeof item?.day === "string" ? item.day : "";
    const stars = Number(item?.stars);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || day > today || day < oldest || day < p.startDay || !Number.isFinite(stars)) continue;
    const minutes = rewardMinutes(stars);
    if (await db.hsetnx(K.daily, day, { stars: Math.max(0, Math.min(9, Math.floor(stars))), minutes, at: Date.now() })) added++;
  }
  return added;
}

export type Redeem = { at: number; minutes: number; code: string; weeks: Record<string, number> };

/** Everything the parent sees. A draft only shows as "in progress", never its answers. */
export async function parentState(db: Store) {
  const today = bangkokToday();
  const [p, ws, st, msgs, qs, rw, log, redeems, draft, pin] = await Promise.all([
    player(db),
    weeks(db),
    study(db),
    messages(db),
    questions(db),
    rewards(db, today),
    db.get<LogEntry[]>(K.log),
    db.get<Redeem[]>(K.redeems),
    db.get<Draft>(K.draft),
    db.get(K.pin),
  ]);
  const week = weekStart(today);
  return {
    today,
    week,
    weekLabel: weekLabel(week),
    hasPin: !!pin,
    player: p,
    weeks: ws,
    study: st,
    messages: msgs,
    questions: qs,
    rewards: rw.list,
    log: log ?? [],
    redeems: redeems ?? [],
    draftAnswered: draft?.week === week ? Object.keys(draft.answers).length : 0,
  };
}


// ---------------------------------------------------------------- several players

/** One entry per player in the shared list; `hasPin` is false after the parent resets it. */
export type PlayerEntry = { id: string; name: string; createdAt: number; hasPin: boolean };

export async function playerList(db: Store): Promise<PlayerEntry[]> {
  return Object.values(await db.hgetall<PlayerEntry>(K.players)).sort((a, b) => a.createdAt - b.createdAt);
}

/** The id the parent page opens on: the chosen default, else the first player. */
export async function defaultPlayer(db: Store, list?: PlayerEntry[]): Promise<string | null> {
  const players = list ?? (await playerList(db));
  const id = await db.get<string>(K.defaultPlayer);
  return id && players.some((p) => p.id === id) ? id : (players[0]?.id ?? null);
}

/** Names are how players find themselves on the sign-in screen, so no two may match. */
export const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** Removes every key of one player. */
export async function deletePlayer(db: Store, id: string) {
  const own = scoped(db, id);
  for (const k of [...PLAYER_VALUES, ...PLAYER_HASHES, K.pinFails]) await own.del(k);
  const list = await db.hgetall<PlayerEntry>(K.players);
  delete list[id];
  await db.del(K.players);
  for (const [k, v] of Object.entries(list)) await db.hset(K.players, k, v);
  if ((await db.get<string>(K.defaultPlayer)) === id) await db.del(K.defaultPlayer);
}

/**
 * Once: Life Quest began with a single player whose data sat under unscoped keys. Copy it under a
 * player id, list it, make it the default, and remember the id for cookies made before ids existed.
 * The old keys are left in place as a backup. Marked done only after everything is copied; a run
 * that died halfway (its lock goes stale after a minute) is simply run again.
 */
export async function migrate(db: Store) {
  const meta = await db.hgetall<number>(K.meta);
  if (meta.done) return;
  const old = await db.get<Player>(K.player);
  if (!old) {
    // Nothing from the single-player days: once anyone has an account, stop checking.
    if ((await playerList(db)).length) await db.hset(K.meta, "done", Date.now());
    return;
  }
  const now = Date.now();
  if (!(await db.hsetnx(K.meta, "lock", now))) {
    if (now - Number(meta.lock ?? 0) < 60_000) return; // another request is on it
    await db.hset(K.meta, "lock", now);
  }
  const id = newId();
  for (const k of PLAYER_VALUES) {
    const v = await db.get(k);
    if (v !== null) await db.set(playerKey(id, k), v);
  }
  for (const k of PLAYER_HASHES) for (const [f, v] of Object.entries(await db.hgetall(k))) await db.hset(playerKey(id, k), f, v);
  const pin = await db.get(K.pin);
  // If someone already made a new account with this name in the meantime, keep both apart.
  const name = old.name || "หลาน";
  const taken = (await playerList(db)).some((p) => sameName(p.name, name));
  const entry: PlayerEntry = { id, name: taken ? `${name} (เดิม)` : name, createdAt: now, hasPin: !!pin };
  await db.hset(K.players, id, entry);
  await db.set(K.defaultPlayer, id);
  await db.set(K.legacy, id);
  await db.hset(K.meta, "done", Date.now());
}
