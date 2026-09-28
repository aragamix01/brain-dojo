"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { formatTime } from "@/lib/date";
import { useProgress } from "@/lib/store";
import { Stars, useNow } from "./ui";

/** Seconds of "think first" before a hint can be asked for. */
export const THINK_FIRST_SEC = 30;

export function useSession() {
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [hints, setHints] = useState(0);
  const addHint = useProgress((s) => s.addHint);
  return {
    startedAt,
    hints,
    takeHint: useCallback(() => {
      setHints((h) => h + 1);
      addHint();
    }, [addHint]),
    restart: useCallback(() => {
      setStartedAt(Date.now());
      setHints(0);
    }, []),
  };
}

export function Timer({ startedAt, stoppedAt }: { startedAt: number; stoppedAt?: number | null }) {
  const now = useNow(500, !stoppedAt);
  return <span className="font-mono tabular-nums">{formatTime((stoppedAt ?? now) - startedAt)}</span>;
}

export function HintButton({
  startedAt,
  onHint,
  disabled,
}: {
  startedAt: number;
  onHint: () => void;
  disabled?: boolean;
}) {
  const now = useNow(500);
  const wait = Math.max(0, THINK_FIRST_SEC - Math.floor((now - startedAt) / 1000));
  return (
    <button
      className="btn btn-ghost !min-h-10 text-sm"
      onClick={onHint}
      disabled={disabled || wait > 0}
      title="ลองคิดเองก่อนนะ"
    >
      💡 {wait > 0 ? `คิดก่อน ${wait}s` : "Hint"}
    </button>
  );
}

export function ResultModal({
  open,
  title = "Clear!",
  stars,
  stats,
  xp,
  onRetry,
  retryLabel = "เล่นอีก",
  nextHref,
  onNext,
  nextLabel = "ด่านต่อไป →",
  backHref,
  backLabel = "กลับเมนู",
  children,
}: {
  open: boolean;
  title?: string;
  stars?: number;
  stats: [string, React.ReactNode][];
  xp?: number;
  onRetry?: () => void;
  retryLabel?: string;
  nextHref?: string;
  onNext?: () => void;
  nextLabel?: string;
  backHref: string;
  backLabel?: string;
  children?: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center">
      <div className="card speedlines animate-pop w-full max-w-sm p-6 text-center">
        <p className="font-display text-4xl font-semibold text-pink glow-text">{title}</p>
        {stars != null && (
          <div className="mt-2">
            <Stars n={stars} size="text-4xl" />
          </div>
        )}
        <dl className="mt-4 grid grid-cols-2 gap-2 text-left text-sm">
          {stats.map(([k, v]) => (
            <div key={k} className="rounded-xl bg-white/5 px-3 py-2">
              <dt className="text-xs text-muted">{k}</dt>
              <dd className="font-display text-lg">{v}</dd>
            </div>
          ))}
        </dl>
        {xp != null && xp > 0 && <p className="mt-3 font-display text-cyan">+{xp} XP</p>}
        {children}
        <div className="mt-5 flex flex-col gap-2">
          {nextHref && (
            <Link href={nextHref} className="btn btn-primary">
              {nextLabel}
            </Link>
          )}
          {onNext && (
            <button className="btn btn-primary" onClick={onNext}>
              {nextLabel}
            </button>
          )}
          {onRetry && (
            <button className={`btn ${nextHref || onNext ? "btn-ghost" : "btn-primary"}`} onClick={onRetry}>
              {retryLabel}
            </button>
          )}
          <Link href={backHref} className="btn btn-ghost">
            {backLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}

export function Toast({ msg, tone = "bad" }: { msg: string | null; tone?: "bad" | "good" | "info" }) {
  if (!msg) return null;
  const color = tone === "bad" ? "border-bad text-bad" : tone === "good" ? "border-good text-good" : "border-cyan text-cyan";
  return (
    <div className={`animate-pop mt-3 rounded-xl border bg-ink/80 px-3 py-2 text-center text-sm ${color}`}>{msg}</div>
  );
}
