import "server-only";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/** Signs session cookies. Reuses the KidTimer key unless a separate LQ_SECRET is set. */
function secret(): string | null {
  const s = process.env.LQ_SECRET ?? process.env.KIDTIMER_KEY;
  if (s) return s;
  return process.env.NODE_ENV === "production" ? null : "life-quest-dev-secret";
}

export type Role = "player" | "parent";

const COOKIE: Record<Role, string> = { player: "lq_player", parent: "lq_parent" };
/** The player stays signed in on their phone for a month; the parent for a week. */
const MAX_AGE: Record<Role, number> = { player: 30 * 86_400, parent: 7 * 86_400 };

export type PinRecord = { salt: string; hash: string; ver: number; at: number };

export function hashPin(pin: string, ver: number): PinRecord {
  const salt = randomBytes(16).toString("hex");
  return { salt, hash: scryptSync(pin, salt, 32).toString("hex"), ver, at: Date.now() };
}

export function pinMatches(pin: string, rec: PinRecord): boolean {
  const a = scryptSync(pin, rec.salt, 32);
  const b = Buffer.from(rec.hash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export const validPin = (pin: unknown, len: number): pin is string =>
  typeof pin === "string" && new RegExp(`^\\d{${len}}$`).test(pin);

const sign = (body: string, key: string) => createHmac("sha256", key).update(body).digest("base64url");

/**
 * Cookie value: role.expiry.version.mac. The version is the player's PIN version, so resetting the
 * PIN signs every old player session out.
 */
export async function startSession(role: Role, ver = 0): Promise<boolean> {
  const key = secret();
  if (!key) return false;
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE[role];
  const body = `${role}.${exp}.${ver}`;
  (await cookies()).set(COOKIE[role], `${body}.${sign(body, key)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE[role],
  });
  return true;
}

export async function endSession(role: Role) {
  (await cookies()).delete(COOKIE[role]);
}

/** The session's PIN version if this request carries a valid cookie for `role`, else null. */
export async function sessionVersion(role: Role): Promise<number | null> {
  return (await session(role))?.ver ?? null;
}

/** A session in use keeps going: once it's a few days old it is issued afresh for the full term. */
export async function renewSession(role: Role) {
  const s = await session(role);
  if (s && s.exp - Date.now() / 1000 < MAX_AGE[role] - 3 * 86_400) await startSession(role, s.ver);
}

async function session(role: Role): Promise<{ ver: number; exp: number } | null> {
  const key = secret();
  const raw = (await cookies()).get(COOKIE[role])?.value;
  if (!key || !raw) return null;
  const parts = raw.split(".");
  if (parts.length !== 4 || parts[0] !== role) return null;
  const body = parts.slice(0, 3).join(".");
  const want = Buffer.from(sign(body, key));
  const got = Buffer.from(parts[3]);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  if (Number(parts[1]) < Date.now() / 1000) return null;
  return { ver: Number(parts[2]), exp: Number(parts[1]) };
}

export const configured = () => secret() !== null;
