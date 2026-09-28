import { hashString } from "./rng";
import { emptyProgress, type ProgressData } from "./store";

// Not security — just stops casual hand-editing of the code.
const SALT = "brain-dojo::keep-thinking";
const PREFIX = "BD1";

function toB64Url(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64Url(s: string): string {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export function encodeProgress(data: ProgressData): string {
  const payload = toB64Url(JSON.stringify({ ...data, exportedAt: Date.now() }));
  return `${PREFIX}.${payload}.${hashString(payload + SALT).toString(36)}`;
}

export type Decoded = ProgressData & { exportedAt?: number };

export function decodeProgress(code: string): Decoded {
  const [prefix, payload, sum] = code.trim().split(".");
  if (prefix !== PREFIX || !payload || !sum) throw new Error("รูปแบบโค้ดไม่ถูกต้อง");
  if (hashString(payload + SALT).toString(36) !== sum)
    throw new Error("โค้ดถูกแก้ไขหรือคัดลอกมาไม่ครบ");
  const parsed = JSON.parse(fromB64Url(payload));
  return { ...emptyProgress(), ...parsed };
}
