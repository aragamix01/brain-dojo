// KidTimer time codes: the child's PC unlocks for N minutes when it reads one, checking it offline
// with a shared key. The format must match the PC exactly — see HANDOFF_WEBSITE.md (test vectors in
// scripts/check.ts). This file holds the pure parts; anything touching the key is in ./server.ts.
import { createHmac } from "node:crypto";
import { SHOP_TIME, UNIT_MIN } from "./reward";

const VERSION = 1;
const MAX_UNITS = 0xfff;
export const WEB_SERIAL_MAX = 0x7fffff; // website range 1..0x7FFFFF; 0x800000+ reserved for the PC's CLI
const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32(buf: Buffer): string {
  let bits = 0,
    value = 0,
    out = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

export function makeCode(keyHex: string, minutes: number, serial: number): string {
  if (!Number.isInteger(minutes) || minutes < UNIT_MIN || minutes % UNIT_MIN !== 0)
    throw new Error(`minutes must be a multiple of ${UNIT_MIN}`);
  const units = minutes / UNIT_MIN;
  if (units > MAX_UNITS) throw new Error("too many minutes");
  if (!Number.isInteger(serial) || serial < 1 || serial > WEB_SERIAL_MAX) throw new Error("serial out of range");
  const payload = Buffer.alloc(5);
  payload.writeUInt16BE((VERSION << 12) | units, 0);
  payload.writeUIntBE(serial, 2, 3);
  const mac = createHmac("sha256", Buffer.from(keyHex, "hex")).update(payload).digest().subarray(0, 4);
  const s = base32(Buffer.concat([payload, mac]));
  return `${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8)}`;
}

/**
 * Serials without a database. Daily codes use the day number, so one day can only ever unlock once
 * (asking again gives the same serial, which the PC rejects after first use). Manual codes from the
 * parent page use the minute they were made, above the Daily range.
 */
const EPOCH = Date.UTC(2026, 0, 1);
const DAILY_SERIALS = 100_000;
/** Shop codes use the top half of the day range: SHOP_BASE + (day - 1) * perDay + slot. Raising perDay
 * later would hand out serials past days already used (the PC would reject those codes) — start a new range instead. */
const SHOP_BASE = 50_000;

/** "2026-10-05" → 1-based day number since 2026-01-01. */
function dayNumber(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - EPOCH) / 86_400_000) + 1;
}

export function dailySerial(date: string): number {
  const day = dayNumber(date);
  if (day < 1 || day >= SHOP_BASE) throw new Error("date out of range");
  return day;
}

/** Coin-shop code number `slot` (0-based) of a day; asking again gives the same serial, so each slot unlocks once. */
export function shopSerial(date: string, slot: number): number {
  const day = dayNumber(date);
  if (!Number.isInteger(slot) || slot < 0 || slot >= SHOP_TIME.perDay) throw new Error("slot out of range");
  const serial = SHOP_BASE + (day - 1) * SHOP_TIME.perDay + slot;
  if (day < 1 || serial >= DAILY_SERIALS) throw new Error("date out of range");
  return serial;
}

export function manualSerial(now: number): number {
  const serial = DAILY_SERIALS + Math.floor((now - EPOCH) / 60_000);
  if (serial <= DAILY_SERIALS || serial > WEB_SERIAL_MAX) throw new Error("clock out of range");
  return serial;
}

/** Today's date in Thailand, where the player is — Vercel's clock runs on UTC. */
export function bangkokDay(now: number, offsetDays = 0): string {
  const t = new Date(now + 7 * 3_600_000 + offsetDays * 86_400_000);
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}-${String(t.getUTCDate()).padStart(2, "0")}`;
}
