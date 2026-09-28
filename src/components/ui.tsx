"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { shareCurrentUrl } from "@/lib/seedUrl";

export function BackHeader({
  title,
  sub,
  href = "/",
  right,
  comic,
}: {
  title: string;
  sub?: string;
  href?: string;
  right?: React.ReactNode;
  /** Bangers comic-style title (use for short English titles). */
  comic?: boolean;
}) {
  return (
    <header className="mb-4 flex items-center gap-3">
      <Link
        href={href}
        aria-label="กลับ"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border-[2.5px] border-ink bg-white shadow-[3px_3px_0_#1e2a3a] active:translate-y-0.5 active:shadow-[1px_1px_0_#1e2a3a]"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1e2a3a" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 5l-7 7 7 7" />
        </svg>
      </Link>
      <div className="min-w-0 flex-1">
        <h1
          className={
            comic
              ? "comic-title truncate py-0.5 text-[28px] text-yellow"
              : "truncate font-display text-xl font-extrabold leading-tight"
          }
        >
          {title}
        </h1>
        {sub && <p className="truncate font-display text-xs font-bold text-muted">{sub}</p>}
      </div>
      {right}
    </header>
  );
}

export function Stars({ n, max = 3, size = "text-base" }: { n: number; max?: number; size?: string }) {
  return (
    <span className={`${size} tracking-tight`} aria-label={`${n} ดาว`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < n ? "text-yellow [text-shadow:1px_1px_0_#1E2A3A]" : "text-ink/15"}>
          ★
        </span>
      ))}
    </span>
  );
}

export function Pill({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-ink/5 px-2.5 py-1 text-xs ${className}`}>
      {children}
    </span>
  );
}

export function Tabs<T extends string | number>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1 rounded-2xl border-[2.5px] border-ink bg-white p-1 shadow-[3px_3px_0_#1e2a3a]">
      {options.map((o) => (
        <button
          key={String(o.value)}
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-xl border-2 px-2 py-1.5 font-display text-sm font-bold transition ${
            o.value === value ? "border-ink bg-yellow text-ink" : "border-transparent text-muted"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Puzzle code + "challenge a friend" link sharing. */
export function SeedBar({ code, title, onNew }: { code: string; title: string; onNew: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <span className="rounded-lg bg-ink/5 px-2 py-1 font-mono text-xs text-muted" title="รหัสโจทย์">
        #{code}
      </span>
      <div className="flex-1" />
      <button
        className="btn btn-ghost !min-h-9 !px-3 text-xs"
        onClick={async () => setCopied(await shareCurrentUrl(title))}
      >
        {copied ? "คัดลอกลิงก์แล้ว ✔" : "📤 ท้าเพื่อน"}
      </button>
      <button className="btn btn-ghost !min-h-9 !px-3 text-xs" onClick={onNew}>
        🎲 โจทย์ใหม่
      </button>
    </div>
  );
}

/** Renders children only in the browser — puzzles are random, so SSR output would never match. */
export function ClientOnly({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  return mounted ? children : fallback;
}

export function useNow(intervalMs = 250, active = true) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, active]);
  return now;
}
