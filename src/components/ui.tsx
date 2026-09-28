"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

export function BackHeader({
  title,
  sub,
  href = "/",
  right,
}: {
  title: string;
  sub?: string;
  href?: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="mb-4 flex items-center gap-3">
      <Link href={href} aria-label="กลับ" className="btn btn-ghost !min-h-10 !px-3 text-lg">
        ←
      </Link>
      <div className="min-w-0 flex-1">
        <h1 className="truncate font-display text-xl font-semibold leading-tight">{title}</h1>
        {sub && <p className="truncate text-xs text-muted">{sub}</p>}
      </div>
      {right}
    </header>
  );
}

export function Stars({ n, max = 3, size = "text-base" }: { n: number; max?: number; size?: string }) {
  return (
    <span className={`${size} tracking-tight`} aria-label={`${n} ดาว`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < n ? "text-yellow" : "text-white/15"}>
          ★
        </span>
      ))}
    </span>
  );
}

export function Pill({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-white/8 px-2.5 py-1 text-xs ${className}`}>
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
    <div className="flex gap-1 rounded-xl bg-white/5 p-1">
      {options.map((o) => (
        <button
          key={String(o.value)}
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-lg px-2 py-1.5 font-display text-sm transition ${
            o.value === value ? "bg-pink text-white shadow" : "text-muted"
          }`}
        >
          {o.label}
        </button>
      ))}
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
