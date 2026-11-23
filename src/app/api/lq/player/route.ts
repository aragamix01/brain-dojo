import { configured, endSession, hashPin, pinMatches, renewSession, session, startSession, validPin, type PinRecord } from "@/lib/life/auth";
import { K, scoped, store, type Store } from "@/lib/life/db";
import { bangkokToday, cleanAnswers, UNDERSTANDING, weekStart, XP, type Draft, type Player, type Study, type TaskStatus, type Understanding } from "@/lib/life/model";
import { award, migrate, newId, playerList, playerState, pushLog, questions, sameName, setGoal, study, submitCheckIn, syncDaily, type PlayerEntry } from "@/lib/life/server";

const MAX_FAILS = 5;
const LOCK_SECONDS = 300;

const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/**
 * The signed-in player's id, if the cookie is valid for their current PIN. A session in use is
 * renewed, so it never lapses. Cookies from before there were several players mean the first one.
 */
async function signedIn(root: Store): Promise<string | null> {
  const s = await session("player");
  if (!s) return null;
  const id = s.id || (await root.get<string>(K.legacy));
  if (!id) return null;
  const pin = await scoped(root, id).get<PinRecord>(K.pin);
  if (!pin || pin.ver !== s.ver) return null;
  await renewSession("player", id);
  return id;
}

type Brain = { data: Record<string, unknown>; at: number };

/** Who can sign in here: names only (they're how a player finds themselves). */
const publicList = (list: PlayerEntry[]) => list.map(({ id, name, hasPin }) => ({ id, name, hasPin }));

/** Sets a player's PIN, bumping its version so sessions made with an old PIN stop working. */
async function setPin(root: Store, id: string, pin: string) {
  const db = scoped(root, id);
  const old = await db.get<{ ver: number }>(K.pinVer);
  const rec = hashPin(pin, (old?.ver ?? 0) + 1);
  await db.set(K.pin, rec);
  await db.set(K.pinVer, { ver: rec.ver });
  const entry = (await root.hgetall<PlayerEntry>(K.players))[id];
  if (entry) await root.hset(K.players, id, { ...entry, hasPin: true });
  await startSession("player", rec.ver, id);
}

export async function GET(request: Request) {
  const root = store();
  if (!root || !configured()) return json({ error: "not-configured" }, 503);
  await migrate(root);
  const params = new URL(request.url).searchParams;
  const part = params.get("part");
  const id = await signedIn(root);
  const list = await playerList(root);
  const me = list.find((p) => p.id === id);
  // The sign-in screens (and Brain Dojo's gate) only need to know who's here.
  if (part === "session" || !id) return json({ signedIn: !!id, id, name: me?.name, players: publicList(list) });
  const db = scoped(root, id);
  if (part === "brain") {
    // The saved Brain Dojo progress, when it's newer than the copy this phone has.
    const brain = await db.get<Brain>(K.brain);
    const since = Number(params.get("since")) || 0;
    return json({ signedIn: true, id, at: brain?.at ?? 0, ...(brain && brain.at > since ? { data: brain.data } : {}) });
  }
  return json({ signedIn: true, id, players: publicList(list), ...(await playerState(db)) });
}

export async function POST(request: Request) {
  const root = store();
  if (!root || !configured()) return json({ error: "not-configured" }, 503);
  await migrate(root);
  const body = await request.json().catch(() => ({}));
  const action = body?.action;

  if (action === "signup") {
    // Anyone can make their own account: a name nobody else uses, and a 4-digit PIN.
    const name = str(body.name, 30);
    if (!name) return json({ error: "no-name" }, 400);
    if (!validPin(body.pin, 4)) return json({ error: "bad-pin" }, 400);
    const list = await playerList(root);
    if (list.length >= 12) return json({ error: "too-many" }, 409);
    if (list.some((p) => sameName(p.name, name))) return json({ error: "name-taken" }, 409);
    const id = newId();
    const entry: PlayerEntry = { id, name, createdAt: Date.now(), hasPin: true };
    await root.hset(K.players, id, entry);
    // Dailies count from the start of this week, so days already played this week aren't lost.
    const p: Player = { name, startDay: weekStart(bangkokToday()), xp: 0, achievements: {}, careers: [] };
    await scoped(root, id).set(K.player, p);
    await pushLog(scoped(root, id), "เริ่มใช้ Weekly Life Quest");
    if (!(await root.get(K.defaultPlayer))) await root.set(K.defaultPlayer, id);
    await setPin(root, id, body.pin);
    return json({ ok: true, id });
  }

  const target = typeof body.id === "string" ? (await root.hgetall<PlayerEntry>(K.players))[body.id] : undefined;

  if (action === "setPin") {
    // After the parent resets a forgotten PIN, the player sets a new one.
    if (!target) return json({ error: "no-player" }, 404);
    if (await scoped(root, target.id).get(K.pin)) return json({ error: "pin-exists" }, 409);
    if (!validPin(body.pin, 4)) return json({ error: "bad-pin" }, 400);
    await setPin(root, target.id, body.pin);
    return json({ ok: true, id: target.id });
  }

  if (action === "login") {
    if (!target) return json({ error: "no-player" }, 404);
    const own = scoped(root, target.id);
    const rec = await own.get<PinRecord>(K.pin);
    if (!rec) return json({ error: "no-pin" }, 409);
    const fails = Number((await own.get<number>(K.pinFails)) ?? 0);
    if (fails >= MAX_FAILS) return json({ error: "locked" }, 429);
    if (!validPin(body.pin, 4) || !pinMatches(body.pin, rec)) {
      await own.incr(K.pinFails, LOCK_SECONDS);
      await new Promise((r) => setTimeout(r, 800));
      return json({ error: "wrong-pin", left: Math.max(0, MAX_FAILS - fails - 1) }, 401);
    }
    await own.del(K.pinFails);
    await startSession("player", rec.ver, target.id);
    return json({ ok: true, id: target.id });
  }

  if (action === "logout") {
    await endSession("player");
    return json({ ok: true });
  }

  const id = await signedIn(root);
  if (!id) return json({ error: "signed-out" }, 401);
  const db = scoped(root, id);

  switch (action) {
    case "saveDraft": {
      const qs = (await questions(db)).filter((q) => q.active);
      const draft: Draft = { week: weekStart(bangkokToday()), answers: cleanAnswers(body.answers, qs), savedAt: Date.now() };
      await db.set(K.draft, draft);
      return json({ ok: true, savedAt: draft.savedAt });
    }
    case "submit":
      return json(await submitCheckIn(db, body.answers));
    case "goal":
      return json(await setGoal(db, str(body.week, 10), body.done === true));
    case "syncDaily":
      return json({ added: await syncDaily(db, body.days) });
    case "syncProgress": {
      // The phone's own Brain Dojo save, shown to the parent as-is (like opening a share code).
      const data = body.data;
      if (!data || typeof data !== "object" || Array.isArray(data) || typeof data.daily !== "object")
        return json({ error: "bad-data" }, 400);
      if (JSON.stringify(data).length > 900_000) return json({ error: "too-big" }, 413);
      // A brand-new phone never wipes out the account's save.
      const saved = await db.get<Brain>(K.brain);
      const blank = (d: Record<string, unknown>) => !Object.keys((d.daily as object) ?? {}).length && !d.xp;
      if (saved && blank(data) && !blank(saved.data)) return json({ error: "would-erase" }, 409);
      const at = Date.now();
      await db.set(K.brain, { data, at });
      return json({ ok: true, at });
    }
    case "careers": {
      const p = await db.get<Player>(K.player);
      if (!p) return json({ error: "no-player" }, 409);
      const list = Array.isArray(body.list) ? body.list.map((x: unknown) => str(x, 40)).filter(Boolean).slice(0, 12) : [];
      await db.set(K.player, { ...p, careers: list });
      return json({ ok: true });
    }
    case "study":
      return json(await studyAction(db, body));
  }
  return json({ error: "bad-action" }, 400);
}

/** Study Tracker edits. Reaching "done" the first time gives a little XP; nothing ever takes XP away. */
async function studyAction(db: Store, body: Record<string, unknown>) {
  const st: Study = await study(db);
  const now = Date.now();
  const op = body.op;
  let xp = 0;
  if (op === "addTask") {
    const title = str(body.title, 120);
    if (!title) return { error: "empty" };
    st.tasks.unshift({
      id: newId(), subject: str(body.subject, 40), title, due: str(body.due, 10), status: 0,
      help: str(body.help, 300), createdAt: now, updatedAt: now,
    });
  } else if (op === "updateTask") {
    const t = st.tasks.find((x) => x.id === body.id);
    if (!t) return { error: "missing" };
    if (Number.isInteger(body.status) && (body.status as number) >= 0 && (body.status as number) <= 3) {
      t.status = body.status as TaskStatus;
      if (t.status >= 2 && !t.rewarded) {
        t.rewarded = true;
        xp = XP.taskDone;
        await pushLog(db, `งาน "${t.title}" ${t.status === 3 ? "ส่งแล้ว" : "เสร็จแล้ว"}`);
      }
    }
    if (typeof body.help === "string") t.help = str(body.help, 300);
    t.updatedAt = now;
  } else if (op === "deleteTask") {
    st.tasks = st.tasks.filter((x) => x.id !== body.id);
  } else if (op === "addSubject") {
    const name = str(body.name, 40);
    if (!name) return { error: "empty" };
    st.subjects.push({ id: newId(), name, level: "ok", scores: [], help: "" });
  } else if (op === "updateSubject") {
    const s = st.subjects.find((x) => x.id === body.id);
    if (!s) return { error: "missing" };
    if (typeof body.level === "string" && body.level in UNDERSTANDING) s.level = body.level as Understanding;
    if (typeof body.help === "string") s.help = str(body.help, 300);
    const score = Number(body.score);
    const max = Number(body.max);
    if (Number.isFinite(score) && Number.isFinite(max) && max > 0 && score >= 0 && score <= max) {
      s.scores.push({ at: now, label: str(body.label, 40) || "คะแนน", score, max });
      await pushLog(db, `เพิ่มคะแนน${s.name} ${score}/${max}`);
    }
  } else if (op === "deleteSubject") {
    st.subjects = st.subjects.filter((x) => x.id !== body.id);
  } else return { error: "bad-op" };
  await db.set(K.study, st);
  const fresh = await award(db, xp);
  return { ok: true, xp, achievements: fresh, study: st };
}
