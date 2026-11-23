import "server-only";
import { Redis } from "@upstash/redis";

/**
 * The few storage calls Life Quest needs. Upstash Redis on Vercel (its integration sets
 * KV_REST_API_URL / KV_REST_API_TOKEN, or UPSTASH_REDIS_REST_*); an in-memory stand-in for local
 * development, which forgets everything on restart.
 */
export interface Store {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown): Promise<void>;
  del(key: string): Promise<void>;
  hgetall<T>(key: string): Promise<Record<string, T>>;
  hset(key: string, field: string, value: unknown): Promise<void>;
  hdel(key: string, field: string): Promise<void>;
  /** sets only when the field is new; true if it was set */
  hsetnx(key: string, field: string, value: unknown): Promise<boolean>;
  hincrby(key: string, field: string, by: number): Promise<number>;
  incr(key: string, ttlSeconds: number): Promise<number>;
}

function redisStore(url: string, token: string): Store {
  const r = new Redis({ url, token });
  return {
    get: async <T>(k: string) => (await r.get<T>(k)) ?? null,
    set: async (k, v) => void (await r.set(k, v)),
    del: async (k) => void (await r.del(k)),
    hgetall: async <T>(k: string) => ((await r.hgetall<Record<string, T>>(k)) ?? {}) as Record<string, T>,
    hset: async (k, f, v) => void (await r.hset(k, { [f]: v })),
    hdel: async (k, f) => void (await r.hdel(k, f)),
    hsetnx: async (k, f, v) => (await r.hsetnx(k, f, v)) === 1,
    hincrby: (k, f, by) => r.hincrby(k, f, by),
    incr: async (k, ttl) => {
      const n = await r.incr(k);
      if (n === 1) await r.expire(k, ttl);
      return n;
    },
  };
}

type Mem = Map<string, unknown>;
const g = globalThis as unknown as { __lqMem?: Mem };

function memoryStore(): Store {
  const m: Mem = (g.__lqMem ??= new Map());
  const copy = <T>(v: unknown) => (v === undefined ? null : (JSON.parse(JSON.stringify(v)) as T));
  const hash = (k: string) => (m.get(k) as Record<string, unknown> | undefined) ?? {};
  return {
    get: async <T>(k: string) => copy<T>(m.get(k)),
    set: async (k, v) => void m.set(k, copy(v)),
    del: async (k) => void m.delete(k),
    hgetall: async <T>(k: string) => copy<Record<string, T>>(hash(k)) ?? {},
    hset: async (k, f, v) => void m.set(k, { ...hash(k), [f]: copy(v) }),
    hdel: async (k, f) => {
      const h = { ...hash(k) };
      delete h[f];
      m.set(k, h);
    },
    hsetnx: async (k, f, v) => {
      if (f in hash(k)) return false;
      m.set(k, { ...hash(k), [f]: copy(v) });
      return true;
    },
    hincrby: async (k, f, by) => {
      const n = Number(hash(k)[f] ?? 0) + by;
      m.set(k, { ...hash(k), [f]: n });
      return n;
    },
    incr: async (k) => {
      const n = Number(m.get(k) ?? 0) + 1;
      m.set(k, n);
      return n;
    },
  };
}

/** Null when no database is set up in production. */
export function store(): Store | null {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (url && token) return redisStore(url, token);
  return process.env.NODE_ENV === "production" ? null : memoryStore();
}

/** Every key Life Quest uses, in one place. */
export const K = {
  pin: "lq:pin",
  pinFails: "lq:pin-fails",
  player: "lq:player",
  questions: "lq:questions",
  draft: "lq:draft",
  weeks: "lq:weeks",
  study: "lq:study",
  daily: "lq:daily",
  paid: "lq:paid",
  messages: "lq:messages",
  log: "lq:log",
  redeems: "lq:redeems",
} as const;
