"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { formatTime } from "@/lib/date";
import { COINS } from "@/lib/coins";
import { useProgress } from "@/lib/store";
import { CoinSheet } from "./CoinSheet";
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

/**
 * Hint gate: locked for the first seconds, then a few free hints per puzzle,
 * after which each hint costs one coin from the wallet.
 */
export function HintButton({
  startedAt,
  used,
  onHint,
  disabled,
}: {
  startedAt: number;
  /** hints already taken on this puzzle */
  used: number;
  onHint: () => void;
  disabled?: boolean;
}) {
  const now = useNow(500);
  const coins = useProgress((s) => s.coins);
  const spendCoin = useProgress((s) => s.spendCoin);
  const wait = Math.max(0, THINK_FIRST_SEC - Math.floor((now - startedAt) / 1000));
  const freeLeft = Math.max(0, COINS.freePerPuzzle - used);
  const broke = freeLeft === 0 && coins <= 0;
  const label =
    wait > 0 ? `คิดก่อน ${wait}s` : broke ? "เหรียญหมด — คิดเองนะ 💪" : freeLeft ? `Hint · ฟรี ${freeLeft}` : "Hint · 🪙1";
  return (
    <button
      className="btn btn-ghost !min-h-10 text-sm"
      onClick={() => {
        if (!freeLeft && !spendCoin("ใช้คำใบ้")) return;
        onHint();
      }}
      disabled={disabled || wait > 0 || broke}
      title={freeLeft ? "ใช้คำใบ้ฟรี (หักดาว)" : `ใช้ 1 เหรียญ (มี ${coins})`}
    >
      {broke ? "🔒" : "💡"} {label}
    </button>
  );
}

/** Wallet chip: coins in hand; tap for today's remaining coins, how to earn more and tips. */
export function CoinChip({ className = "" }: { className?: string }) {
  const coins = useProgress((s) => s.coins);
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1 rounded-full border-[2.5px] border-ink bg-yellow px-2.5 py-0.5 font-display text-sm font-extrabold shadow-[2px_2px_0_#1e2a3a] active:translate-y-0.5 active:shadow-none ${className}`}
        aria-label={`เหรียญคำใบ้ ${coins} เหรียญ — แตะเพื่อดูรายละเอียด`}
      >
        🪙 {coins}
        <span className="text-[10px] font-bold opacity-70">ⓘ</span>
      </button>
      {open && <CoinSheet onClose={() => setOpen(false)} />}
    </>
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
            <div key={k} className="rounded-xl bg-ink/5 px-3 py-2">
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
    <div className={`animate-pop mt-3 rounded-xl border bg-white px-3 py-2 text-center text-sm ${color}`}>{msg}</div>
  );
}
