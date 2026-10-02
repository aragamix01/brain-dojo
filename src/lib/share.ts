import { hashString } from "./rng";
import { emptyProgress, type ProgressData } from "./store";

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

/** Compressed (BD2) when the browser can deflate, else the plain BD1 format. */
export async function encodeProgress(data: ProgressData): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify({ ...data, exportedAt: Date.now() }));
  if (typeof CompressionStream === "undefined") return sign("BD1", bytesToB64Url(json));
  return sign("BD2", bytesToB64Url(await pipe(json, new CompressionStream("deflate-raw"))));
}

export type Decoded = ProgressData & { exportedAt?: number };

/** Finds a progress code anywhere in the text, so a whole pasted share message works too. */
export function findCode(text: string): string | null {
  return text.match(/BD[12]\.[\w-]+\.[0-9a-z]+/)?.[0] ?? null;
}

export async function decodeProgress(text: string): Promise<Decoded> {
  const code = findCode(text);
  if (!code) throw new Error("ไม่เจอโค้ด BD… ในข้อความ");
  const [prefix, payload, sum] = code.split(".");
  if (hashString(payload + SALT).toString(36) !== sum) throw new Error("โค้ดถูกแก้ไขหรือคัดลอกมาไม่ครบ");
  let bytes = b64UrlToBytes(payload);
  if (prefix === "BD2") bytes = await pipe(bytes, new DecompressionStream("deflate-raw"));
  const parsed = JSON.parse(new TextDecoder().decode(bytes));
  return { ...emptyProgress(), ...parsed };
}
