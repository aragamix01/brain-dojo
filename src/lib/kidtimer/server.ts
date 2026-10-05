import "server-only";
import { timingSafeEqual } from "node:crypto";
import { makeCode } from "./core";

/** The shared key from Vercel's env (never sent to the browser). Null when not set up yet. */
function key(): string | null {
  const k = process.env.KIDTIMER_KEY?.trim();
  return k && /^[0-9a-fA-F]{64}$/.test(k) ? k : null;
}

export const kidtimerReady = () => key() !== null;

export function issueCode(minutes: number, serial: number): string {
  const k = key();
  if (!k) throw new Error("KIDTIMER_KEY is not set");
  return makeCode(k, minutes, serial);
}

/** Constant-time check of the parent page password (PARENT_PASSWORD in Vercel's env). */
export function parentPasswordOk(given: unknown): boolean {
  const expected = process.env.PARENT_PASSWORD;
  if (!expected || typeof given !== "string") return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
