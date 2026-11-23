"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Answer } from "@/lib/life/model";
import type { playerState } from "@/lib/life/server";

export type PlayerData = {
  signedIn: boolean;
  id?: string;
  players?: { id: string; name: string; hasPin: boolean }[];
  error?: string;
} & Partial<Awaited<ReturnType<typeof playerState>>>;

export async function post<T = Record<string, unknown>>(path: string, body: unknown): Promise<T & { error?: string }> {
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return await res.json().catch(() => ({ error: "server" }));
  } catch {
    return { error: "offline" } as T & { error?: string };
  }
}

/** Loads a Life Quest endpoint; `reload` fetches again after a change. */
export function useApi<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const reload = useCallback(async () => {
    try {
      const res = await fetch(path, { cache: "no-store" });
      const json = await res.json();
      if (json.error) setErr(json.error);
      else setErr(null);
      setData(json);
    } catch {
      setErr("offline");
    }
  }, [path]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading the page's data on mount
    void reload();
  }, [reload]);
  return { data, err, reload, setData };
}

export function errorText(err: string): string {
  if (err === "not-configured") return "ยังไม่ได้ต่อฐานข้อมูล — ให้น้าเพิ่ม Upstash Redis ใน Vercel ก่อน";
  if (err === "offline") return "ต่อเน็ตไม่ได้ ลองใหม่อีกครั้ง";
  return "มีอะไรผิดพลาด ลองใหม่อีกครั้ง";
}

export function Loading() {
  return <p className="py-20 text-center font-lq text-lg text-[#5e5878]">กำลังเปิดสมุดบันทึก…</p>;
}

export function Header({ title, back = "/life", right }: { title: string; back?: string; right?: React.ReactNode }) {
  return (
    <header className="mb-4 flex items-center gap-3">
      <Link
        href={back}
        aria-label="กลับ"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border-[2.5px] border-[#2e2a4a] bg-white"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2e2a4a" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 5l-7 7 7 7" />
        </svg>
      </Link>
      <h1 className="min-w-0 flex-1 truncate font-lq text-2xl font-bold">{title}</h1>
      {right}
    </header>
  );
}

export function Bar({ pct, color = "#ffd66b", h = "h-3.5" }: { pct: number; color?: string; h?: string }) {
  return (
    <div className={`${h} overflow-hidden rounded-full border-[2.5px] border-[#2e2a4a] bg-white`}>
      <div className="h-full" style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color }} />
    </div>
  );
}

/** "4:45" for PC time in hours and minutes. */
export const hm = (m: number) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;

/** Number pad for a `len`-digit PIN; calls onDone with the full PIN. */
export function PinPad({ len, onDone, busy }: { len: number; onDone: (pin: string) => void; busy?: boolean }) {
  const [pin, setPin] = useState("");
  const press = (k: string) => {
    if (busy) return;
    if (k === "del") return setPin(pin.slice(0, -1));
    if (pin.length >= len) return;
    const next = pin + k;
    setPin(next);
    if (next.length === len) {
      onDone(next);
      setTimeout(() => setPin(""), 150);
    }
  };
  return (
    <div>
      <div className="mb-5 flex justify-center gap-4" aria-label={`ใส่ไปแล้ว ${pin.length} จาก ${len} หลัก`}>
        {Array.from({ length: len }, (_, i) => (
          <span key={i} className={`h-[18px] w-[18px] rounded-full border-[2.5px] border-[#2e2a4a] ${i < pin.length ? "bg-[#6a55e0]" : "bg-white"}`} />
        ))}
      </div>
      <div className="mx-auto grid max-w-[300px] grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"].map((k, i) =>
          k ? (
            <button
              key={i}
              type="button"
              onClick={() => press(k)}
              aria-label={k === "del" ? "ลบ" : k}
              className="lq-btn !min-h-[60px] font-lq text-2xl"
            >
              {k === "del" ? "⌫" : k}
            </button>
          ) : (
            <span key={i} />
          ),
        )}
      </div>
    </div>
  );
}

export function LockIcon({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#2e2a4a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="3" fill="#fff" />
      <path d="M8 11V8a4 4 0 018 0v3" />
      <circle cx="12" cy="16" r="1.2" fill="#2e2a4a" />
    </svg>
  );
}

/** An answer's choices or rating in one line (its written note is shown separately). */
export function answerText(a?: Answer): string {
  if (!a) return "—";
  if (a.skipped) return "ข้าม";
  const parts = [...(a.picks ?? []), ...(a.rating ? [`${a.rating}/5`] : [])];
  return parts.join(" · ") || (a.text ? "" : "—");
}
