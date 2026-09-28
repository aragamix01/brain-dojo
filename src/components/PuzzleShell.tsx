"use client";

import { useEffect, useState } from "react";
import { elapsedSince, formatTime } from "@/lib/date";
import { starsFor } from "@/lib/rank";
import { randomSeed } from "@/lib/rng";
import { codeToSeed, readParams, seedToCode, writeParams } from "@/lib/seedUrl";
import { useProgress } from "@/lib/store";
import { ResultModal, useSession } from "./game";
import { BackHeader, SeedBar, Tabs } from "./ui";

export type Session = ReturnType<typeof useSession>;
export type Solved = { moves: number; par?: number };

export type PuzzleRenderArgs<L> = {
  level: L;
  seed: number;
  session: Session;
  onSolved: (r: Solved) => void;
};

export function PuzzleShell<L extends string | number>({
  gameKey,
  title,
  sub,
  rules,
  levels,
  xpBase = 10,
  render,
}: {
  gameKey: string;
  title: string;
  sub: string;
  rules: React.ReactNode;
  levels: { value: L; label: string }[];
  xpBase?: number;
  render: (a: PuzzleRenderArgs<L>) => React.ReactNode;
}) {
  // A shared link (?lv=…&s=…) reproduces the exact same puzzle.
  const [level, setLevel] = useState<L>(
    () =>
      levels.find((l) => String(l.value) === readParams().get("lv"))?.value ??
      levels[Math.min(1, levels.length - 1)].value,
  );
  const [seed, setSeed] = useState(() => codeToSeed(readParams().get("s")) ?? randomSeed());
  useEffect(() => writeParams({ lv: String(level), s: seedToCode(seed) }), [level, seed]);
  const [result, setResult] = useState<{ moves: number; par?: number; stars: number; xp: number; ms: number } | null>(
    null,
  );
  const session = useSession();
  const recordWin = useProgress((s) => s.recordWin);

  const fresh = (lv = level) => {
    setLevel(lv);
    setSeed(randomSeed());
    setResult(null);
    session.restart();
  };

  const onSolved = ({ moves, par }: Solved) => {
    const ms = elapsedSince(session.startedAt);
    const stars = par == null ? Math.max(1, 3 - session.hints) : starsFor(moves, par, session.hints);
    const xp = recordWin(`logic:${gameKey}`, { stars, timeMs: ms, xpBase });
    // let the final move animate before the modal covers it
    setTimeout(() => setResult({ moves, par, stars, xp, ms }), 450);
  };

  return (
    <>
      <BackHeader title={title} sub={sub} href="/logic" />
      <div className="mb-3 space-y-2">
        <Tabs value={level} options={levels} onChange={(v) => fresh(v)} />
        <SeedBar code={seedToCode(seed)} title={`Brain Dojo · ${title}`} onNew={() => fresh()} />
      </div>
      <details className="card mb-4 px-4 py-3 text-sm text-muted">
        <summary className="cursor-pointer font-display text-fg">📖 วิธีเล่น / How to play</summary>
        <div className="mt-2 space-y-1">{rules}</div>
      </details>
      <div key={`${seed}-${level}`}>{render({ level, seed, session, onSolved })}</div>
      <ResultModal
        open={!!result}
        stars={result?.stars}
        xp={result?.xp}
        stats={[
          ["เวลา", result ? formatTime(result.ms) : ""],
          ["Moves", result ? `${result.moves}${result.par ? ` / par ${result.par}` : ""}` : ""],
        ]}
        onRetry={() => fresh()}
        retryLabel="โจทย์ใหม่"
        backHref="/logic"
      />
    </>
  );
}
