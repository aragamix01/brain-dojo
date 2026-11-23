import { manualSerial } from "@/lib/kidtimer/core";
import { MAX_MINUTES, formatMinutes } from "@/lib/kidtimer/reward";
import { issueCode, kidtimerReady, parentPasswordOk } from "@/lib/kidtimer/server";
import { configured, endSession, sessionVersion, startSession } from "@/lib/life/auth";
import { K, scoped, store, type Store } from "@/lib/life/db";
import { type Message } from "@/lib/life/model";
import { DEFAULT_QUESTIONS, type Question, type QuestionType } from "@/lib/life/questions";
import { defaultPlayer, deletePlayer, messages, migrate, newId, parentState, playerList, pushLog, questions, rewards, type Redeem } from "@/lib/life/server";

const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** The player the parent asked for, else the default one. */
async function pick(root: Store, asked: unknown): Promise<string | null> {
  const list = await playerList(root);
  return typeof asked === "string" && list.some((p) => p.id === asked) ? asked : defaultPlayer(root, list);
}

export async function GET(request: Request) {
  const root = store();
  if (!root || !configured()) return json({ error: "not-configured" }, 503);
  if ((await sessionVersion("parent")) === null) return json({ signedIn: false });
  await migrate(root);
  const params = new URL(request.url).searchParams;
  const list = await playerList(root);
  const id = await pick(root, params.get("player"));
  const base = { signedIn: true, players: list, defaultId: await defaultPlayer(root, list), playerId: id };
  if (!id) return json({ ...base, questions: await questions(root) });
  const db = scoped(root, id);
  // The Brain Dojo save is big, so it only loads when its tab opens.
  if (params.get("part") === "brain") return json({ ...base, brain: await db.get(K.brain) });
  return json({ ...base, ...(await parentState(db)) });
}

const TYPES: QuestionType[] = ["single", "multi", "rating", "text"];

function cleanQuestions(raw: unknown): Question[] | null {
  if (!Array.isArray(raw) || !raw.length || raw.length > 30) return null;
  const out: Question[] = [];
  for (const r of raw) {
    const text = str(r?.text, 200);
    const type = TYPES.includes(r?.type) ? (r.type as QuestionType) : null;
    if (!text || !type) return null;
    const options = Array.isArray(r.options) ? r.options.map((o: unknown) => str(o, 60)).filter(Boolean).slice(0, 15) : [];
    if ((type === "single" || type === "multi") && options.length < 2) return null;
    out.push({
      id: str(r.id, 40) || newId(),
      topic: str(r.topic, 30) || "คำถาม",
      text,
      type,
      ...(options.length && type !== "rating" && type !== "text" ? { options } : {}),
      ...(str(r.textLabel, 80) ? { textLabel: str(r.textLabel, 80) } : {}),
      ...(str(r.textHint, 80) ? { textHint: str(r.textHint, 80) } : {}),
      ...(str(r.help, 120) ? { help: str(r.help, 120) } : {}),
      ...(type === "rating" ? { ratingNotes: (DEFAULT_QUESTIONS.find((q) => q.type === "rating")?.ratingNotes ?? []).slice() } : {}),
      ...(Array.isArray(r.ratingNotes) && r.ratingNotes.length === 5 ? { ratingNotes: r.ratingNotes.map((n: unknown) => str(n, 80)) } : {}),
      active: r.active !== false,
    });
  }
  return new Set(out.map((q) => q.id)).size === out.length ? out : null;
}

export async function POST(request: Request) {
  const db = store();
  if (!db || !configured()) return json({ error: "not-configured" }, 503);
  const body = await request.json().catch(() => ({}));

  if (body?.action === "login") {
    if (!process.env.PARENT_PASSWORD && process.env.NODE_ENV === "production") return json({ error: "not-configured" }, 503);
    const ok = process.env.PARENT_PASSWORD ? parentPasswordOk(body.pin) : body.pin === "000000";
    if (!ok) {
      await new Promise((r) => setTimeout(r, 1000));
      return json({ error: "wrong-pin" }, 401);
    }
    await startSession("parent");
    return json({ ok: true });
  }
  if (body?.action === "logout") {
    await endSession("parent");
    return json({ ok: true });
  }
  if ((await sessionVersion("parent")) === null) return json({ error: "signed-out" }, 401);
  const root = db;
  await migrate(root);
  const list = await playerList(root);

  // Shared by all players.
  switch (body?.action) {
    case "setDefault":
      if (!list.some((p) => p.id === body.player)) return json({ error: "no-player" }, 404);
      await root.set(K.defaultPlayer, body.player);
      return json({ ok: true });
    case "deletePlayer":
      if (!list.some((p) => p.id === body.player)) return json({ error: "no-player" }, 404);
      await deletePlayer(root, body.player);
      return json({ ok: true });
    case "questions": {
      const qs = cleanQuestions(body.questions);
      if (!qs) return json({ error: "bad-questions" }, 400);
      await root.set(K.questions, qs);
      return json({ ok: true, questions: qs });
    }
    case "resetQuestions":
      await root.del(K.questions);
      return json({ ok: true, questions: await questions(root) });
  }

  // Everything else is about one player.
  const id = await pick(root, body?.player);
  if (!id) return json({ error: "no-player" }, 404);
  const own = scoped(root, id);

  switch (body?.action) {
    case "message": {
      const text = str(body.text, 500);
      if (!text) return json({ error: "empty" }, 400);
      const list: Message[] = [{ id: newId(), at: Date.now(), text }, ...(await messages(own))].slice(0, 50);
      await own.set(K.messages, list);
      await pushLog(own, "พี่แตงพี่หยกส่งข้อความให้กำลังใจ");
      return json({ ok: true, messages: list });
    }
    case "resetPin":
      // The player sets a new PIN next time; the version bump signs old sessions out.
      await own.del(K.pin);
      const entry = list.find((p) => p.id === id)!;
      await root.hset(K.players, id, { ...entry, hasPin: false });
      await pushLog(own, "พี่แตงพี่หยกรีเซ็ต PIN ของหลาน");
      return json({ ok: true });
    case "redeem": {
      if (!kidtimerReady()) return json({ error: "no-kidtimer" }, 503);
      const list = (await rewards(own)).list.filter((r) => r.owed > 0);
      const minutes = Math.min(MAX_MINUTES, list.reduce((a, r) => a + r.owed, 0));
      if (minutes < 15) return json({ error: "nothing" }, 400);
      const redeems = (await own.get<Redeem[]>(K.redeems)) ?? [];
      const now = Date.now();
      // Codes are numbered by the minute; a second one in the same minute would be refused by the PC.
      if (redeems[0] && Math.floor(redeems[0].at / 60_000) === Math.floor(now / 60_000))
        return json({ error: "same-minute" }, 429);
      const code = issueCode(minutes, manualSerial(now));
      let left = minutes;
      const paidWeeks: Record<string, number> = {};
      for (const r of list) {
        const pay = Math.min(r.owed, left);
        if (pay <= 0) break;
        await own.hincrby(K.paid, r.week, pay);
        paidWeeks[r.week] = pay;
        left -= pay;
      }
      const rec: Redeem = { at: now, minutes, code, weeks: paidWeeks };
      await own.set(K.redeems, [rec, ...redeems].slice(0, 30));
      await pushLog(own, `พี่แตงพี่หยกแลกเวลาคอม ${formatMinutes(minutes)}`);
      return json({ ok: true, redeem: rec });
    }
  }
  return json({ error: "bad-action" }, 400);
}
