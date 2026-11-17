import { dayKey, shiftDay } from "./date";
import { hashString } from "./rng";
import { emptyProgress, type DailyResult, type ProgressData } from "./store";

// Not security — just stops casual hand-editing of the code.
const SALT = "brain-dojo::keep-thinking";

function bytesToB64Url(bytes: Uint8Array): string {
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64UrlToBytes(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Blob([bytes as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

const sign = (prefix: string, payload: string) => `${prefix}.${payload}.${hashString(payload + SALT).toString(36)}`;

/** `kind` "BD" is the whole progress, "BR" the two-week report; "2" when deflated, "1" when plain. */
async function encode(kind: "BD" | "BR", value: object): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(value));
  if (typeof CompressionStream === "undefined") return sign(`${kind}1`, bytesToB64Url(json));
  return sign(`${kind}2`, bytesToB64Url(await pipe(json, new CompressionStream("deflate-raw"))));
}

/** The whole progress (backup / moving to a new device). Grows with every Daily. */
export function encodeProgress(data: ProgressData): Promise<string> {
  return encode("BD", { ...data, exportedAt: Date.now() });
}

/** Days a report covers: this week and last week always fit, as does the 14-day strip. */
export const REPORT_DAYS = 14;

/**
 * Just what the uncle's view shows for the last two weeks — small enough for a link or a QR code
 * however long the player has been playing. Not a backup: it can't be restored.
 */
export function encodeReport(data: ProgressData, now = Date.now()): Promise<string> {
  const from = shiftDay(dayKey(new Date(now)), 1 - REPORT_DAYS);
  const recent = <T>(r: Record<string, T> | undefined) =>
    Object.fromEntries(Object.entries(r ?? {}).filter(([d]) => d >= from));
  // Stage details ("12 moves") and the level actually played aren't shown in the uncle's view.
  const daily = Object.fromEntries(
    Object.entries(recent(data.daily)).map(([d, r]): [string, DailyResult] => [
      d,
      { ...r, played: undefined, stages: r.stages?.map((st) => ({ ...st, detail: "" })) },
    ]),
  );
  return encode("BR", {
    name: data.name,
    xp: data.xp,
    streak: data.streak,
    bestStreak: data.bestStreak,
    lastActive: data.lastActive,
    freezes: data.freezes,
    hintsUsed: data.hintsUsed,
    dailyLevel: data.dailyLevel,
    games: data.games,
    daily,
    dailyCount: Object.keys(data.daily).length,
    activeDays: recent(data.activeDays),
    dayLog: recent(data.dayLog),
    exportedAt: now,
  });
}

export type Decoded = ProgressData & {
  exportedAt?: number;
  /** a two-week report: only recent days, and nothing to restore from */
  report?: boolean;
  /** all-time Daily count, which a report's trimmed `daily` can't give */
  dailyCount?: number;
};

/** Finds a code anywhere in the text, so a whole pasted share message or a link works too. */
export function findCode(text: string): string | null {
  return text.match(/B[DR][12]\.[\w-]+\.[0-9a-z]+/)?.[0] ?? null;
}

export async function decodeProgress(text: string): Promise<Decoded> {
  const code = findCode(text);
  if (!code) throw new Error("ไม่เจอโค้ด BD… ในข้อความ");
  const [prefix, payload, sum] = code.split(".");
  if (hashString(payload + SALT).toString(36) !== sum) throw new Error("โค้ดถูกแก้ไขหรือคัดลอกมาไม่ครบ");
  let bytes = b64UrlToBytes(payload);
  if (prefix.endsWith("2")) bytes = await pipe(bytes, new DecompressionStream("deflate-raw"));
  const parsed = JSON.parse(new TextDecoder().decode(bytes));
  return { ...emptyProgress(), ...parsed, report: prefix.startsWith("BR") };
}

/** A link that opens the progress page straight onto this code. */
export function reportUrl(code: string, origin: string): string {
  return `${origin}/progress#v=${code}`;
}
