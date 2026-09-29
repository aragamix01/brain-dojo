const pad = (n: number) => String(n).padStart(2, "0");

/** Local-time day key, e.g. "2026-09-28". */
export function dayKey(d = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function yesterdayKey(d = new Date()): string {
  const y = new Date(d);
  y.setDate(y.getDate() - 1);
  return dayKey(y);
}

export function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${pad(s % 60)}`;
}

export const elapsedSince = (startedAt: number) => Date.now() - startedAt;

/** Whole days from day key `a` to day key `b` (both "YYYY-MM-DD", local time). */
export function daysBetween(a: string, b: string): number {
  const at = (k: string) => {
    const [y, m, dd] = k.split("-").map(Number);
    return new Date(y, m - 1, dd).getTime();
  };
  return Math.round((at(b) - at(a)) / 86_400_000);
}

/** Day key `n` days after `key` (negative = before). */
export function shiftDay(key: string, n: number): string {
  const [y, m, dd] = key.split("-").map(Number);
  return dayKey(new Date(y, m - 1, dd + n));
}

/** The seven day keys of the week containing `key`, Sunday first. */
export function weekOf(key: string): string[] {
  const [y, m, dd] = key.split("-").map(Number);
  const sunday = -new Date(y, m - 1, dd).getDay();
  return Array.from({ length: 7 }, (_, i) => shiftDay(key, sunday + i));
}
