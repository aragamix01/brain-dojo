"use client";

import { useRef, useState } from "react";
import { HintButton } from "@/components/game";
import { randomItem } from "@/lib/rng";
import type { Session, Solved } from "@/components/PuzzleShell";
import { isSolved, lineStatus, type Cell, type NonogramPuzzle } from "./logic";

const range = (a: number, b: number) =>
  Array.from({ length: Math.abs(b - a) + 1 }, (_, k) => (a < b ? a + k : a - k));

export function NonogramGame({
  puzzle,
  session,
  onSolved,
}: {
  puzzle: NonogramPuzzle;
  session: Session;
  onSolved: (r: Solved) => void;
}) {
  const { n } = puzzle;
  const [cells, setCells] = useState<Cell[]>(() => Array(n * n).fill(0));
  const [mode, setMode] = useState<"fill" | "x">("fill");
  const [flash, setFlash] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  // Drag paints a straight line from the start cell, so fast swipes never skip cells.
  const drag = useRef<{ v: Cell; start: number; base: Cell[] } | null>(null);
  const status = lineStatus(cells, n, puzzle);

  const cellsRef = useRef(cells);

  const paint = (i: number, v: Cell) => {
    const cur = cellsRef.current;
    if (cur[i] === v) return;
    const next = cur.slice();
    next[i] = v;
    cellsRef.current = next;
    setCells(next);
  };

  const checkSolved = () => {
    if (done || !isSolved(cellsRef.current, puzzle)) return;
    setDone(true);
    onSolved({ moves: cellsRef.current.filter((c) => c === 1).length });
  };

  const dragTo = (i: number) => {
    const d = drag.current;
    if (!d) return;
    const [r0, c0, r1, c1] = [Math.floor(d.start / n), d.start % n, Math.floor(i / n), i % n];
    const line =
      r0 === r1
        ? range(c0, c1).map((c) => r0 * n + c)
        : c0 === c1
          ? range(r0, r1).map((r) => r * n + c0)
          : [d.start];
    const next = d.base.slice();
    for (const k of line) next[k] = d.v;
    cellsRef.current = next;
    setCells(next);
  };

  const finishDrag = () => {
    if (drag.current === null) return;
    drag.current = null;
    checkSolved();
  };

  const cellFromPoint = (x: number, y: number) => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    const idx = el?.dataset.idx;
    return idx == null ? null : Number(idx);
  };

  const hint = () => {
    // Prefer fixing a wrong fill, otherwise reveal a missing one.
    const wrong = cells.flatMap((c, i) => (c === 1 && !puzzle.solution[i] ? [i] : []));
    const missing = cells.flatMap((c, i) => (c !== 1 && puzzle.solution[i] ? [i] : []));
    const pool = wrong.length ? wrong : missing;
    if (!pool.length) return;
    const i = randomItem(pool);
    paint(i, puzzle.solution[i] ? 1 : 2);
    setFlash(i);
    session.takeHint();
    setTimeout(() => setFlash(null), 1200);
    checkSolved();
  };

  const clueW = n <= 5 ? 56 : n <= 8 ? 72 : 84;

  return (
    <div className="select-none">
      <div className="mx-auto w-full max-w-md">
        <div className="grid" style={{ gridTemplateColumns: `${clueW}px repeat(${n}, 1fr)` }}>
          <div />
          {puzzle.cols.map((clue, c) => (
            <div
              key={c}
              className={`flex flex-col items-center justify-end pb-1 font-mono text-[11px] leading-[1.15] ${
                status.cols[c] ? "text-good/60" : "text-fg"
              } ${c % 5 === 4 && c !== n - 1 ? "border-r border-ink/20" : ""}`}
            >
              {clue.map((v, k) => (
                <span key={k}>{v}</span>
              ))}
            </div>
          ))}
        </div>
        <div className="grid" style={{ gridTemplateColumns: `${clueW}px 1fr` }}>
          <div className="grid" style={{ gridTemplateRows: `repeat(${n}, 1fr)` }}>
            {puzzle.rows.map((clue, r) => (
              <div
                key={r}
                className={`flex items-center justify-end gap-1 pr-1.5 font-mono text-[11px] ${
                  status.rows[r] ? "text-good/60" : "text-fg"
                }`}
              >
                {clue.map((v, k) => (
                  <span key={k}>{v}</span>
                ))}
              </div>
            ))}
          </div>
          <div
            className="grid aspect-square touch-none overflow-hidden rounded-lg border border-ink/30"
            style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}
            onPointerMove={(e) => {
              if (!drag.current) return;
              const i = cellFromPoint(e.clientX, e.clientY);
              if (i !== null) dragTo(i);
            }}
            onPointerUp={finishDrag}
            onPointerCancel={finishDrag}
            onPointerLeave={finishDrag}
          >
            {cells.map((c, i) => {
              const r = Math.floor(i / n);
              const col = i % n;
              return (
                <div
                  key={i}
                  data-idx={i}
                  onPointerDown={(e) => {
                    if (done) return;
                    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
                    const v: Cell = mode === "fill" ? (c === 1 ? 0 : 1) : c === 2 ? 0 : 2;
                    drag.current = { v, start: i, base: cellsRef.current };
                    dragTo(i);
                  }}
                  className={`flex items-center justify-center border-ink/15 text-muted transition-colors ${
                    col % 5 === 4 && col !== n - 1 ? "border-r-ink/40" : ""
                  } ${r % 5 === 4 && r !== n - 1 ? "border-b-ink/40" : ""} border-b border-r ${
                    c === 1 ? "bg-pink" : "bg-white"
                  } ${flash === i ? "hint-ring" : ""}`}
                >
                  {c === 2 && <span className="pointer-events-none text-xs">✕</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2">
        <div className="flex rounded-xl bg-ink/5 p-1">
          <button
            onClick={() => setMode("fill")}
            className={`rounded-lg px-4 py-2 font-display text-sm ${mode === "fill" ? "bg-pink text-white" : "text-muted"}`}
          >
            ■ ระบาย
          </button>
          <button
            onClick={() => setMode("x")}
            className={`rounded-lg px-4 py-2 font-display text-sm ${mode === "x" ? "bg-panel-2 text-fg" : "text-muted"}`}
          >
            ✕ กากบาท
          </button>
        </div>
        <HintButton startedAt={session.startedAt} used={session.hints} onHint={hint} disabled={done} />
      </div>
      <div className="mt-2 text-center">
        <button
          className="text-xs text-muted underline"
          disabled={done}
          onClick={() => {
            cellsRef.current = Array(n * n).fill(0);
            setCells(cellsRef.current);
          }}
        >
          ล้างกระดาน
        </button>
      </div>
    </div>
  );
}
