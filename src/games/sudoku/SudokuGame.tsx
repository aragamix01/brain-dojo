"use client";

import { useState } from "react";
import { HintButton, Toast } from "@/components/game";
import type { Session, Solved } from "@/components/PuzzleShell";
import { candidates, clashes, isComplete, type SudokuPuzzle } from "./logic";

export function SudokuGame({ puzzle, session, onSolved }: { puzzle: SudokuPuzzle; session: Session; onSolved: (r: Solved) => void }) {
  const { n, boxR, boxC, givens } = puzzle;
  const [grid, setGrid] = useState(givens);
  const [sel, setSel] = useState<number | null>(null);
  const [hintCell, setHintCell] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [writes, setWrites] = useState(0);
  const bad = clashes(grid, n);

  const write = (v: number) => {
    if (done || sel === null || givens[sel]) return;
    const next = [...grid];
    next[sel] = v;
    setGrid(next);
    setWrites(writes + 1);
    setHintCell(null);
    setMsg(null);
    if (isComplete(next, puzzle)) {
      setDone(true);
      // No par: stars come from hints only, so a few wrong tries cost nothing.
      onSolved({ moves: writes + 1 });
    }
  };

  const hint = () => {
    // A wrong number first: the board can't be finished around it.
    const wrong = grid.findIndex((v, i) => v && v !== puzzle.solution[i]);
    session.takeHint();
    if (wrong >= 0) {
      setHintCell(wrong);
      setMsg("ช่องนี้ยังไม่ถูกนะ ลองคิดใหม่");
      return;
    }
    // Otherwise a cell with only one possible number left.
    const empty = grid.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
    const single = empty.find((i) => candidates(grid, n, i).length === 1);
    const cell = single ?? empty[0];
    setHintCell(cell);
    setSel(cell);
    setMsg(single != null ? "ช่องนี้ใส่ได้เลขเดียว — เลขอะไรล่ะ?" : "ลองเริ่มที่ช่องนี้ ดูแถว คอลัมน์ และกล่องของมัน");
  };

  const r = (i: number) => Math.floor(i / n);
  const c = (i: number) => i % n;

  return (
    <div>
      <p className="mb-3 text-center text-sm text-muted">
        ใส่เลข 1–{n} ให้ทุกแถว ทุกคอลัมน์ และทุกกล่อง {boxR}×{boxC} มีเลขไม่ซ้ำกัน
      </p>
      <div
        className="mx-auto grid w-full max-w-sm overflow-hidden rounded-2xl border-[3px] border-ink bg-white"
        style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}
      >
        {grid.map((v, i) => {
          const fixed = !!givens[i];
          const same = sel !== null && grid[sel] && v === grid[sel];
          const related = sel !== null && (r(i) === r(sel) || c(i) === c(sel));
          return (
            <button
              key={i}
              onClick={() => setSel(i)}
              aria-label={`แถว ${r(i) + 1} คอลัมน์ ${c(i) + 1}${v ? ` เลข ${v}` : " ว่าง"}`}
              className={`flex aspect-square items-center justify-center font-display ${n === 4 ? "text-3xl" : "text-2xl"} ${
                (c(i) + 1) % boxC === 0 && c(i) < n - 1 ? "border-r-[3px] border-r-ink" : "border-r border-r-ink/20"
              } ${(r(i) + 1) % boxR === 0 && r(i) < n - 1 ? "border-b-[3px] border-b-ink" : "border-b border-b-ink/20"} ${
                sel === i ? "bg-yellow" : same ? "bg-yellow/40" : related ? "bg-ink/5" : ""
              } ${fixed ? "text-ink" : bad.has(i) ? "text-bad" : "text-ocean"} ${hintCell === i ? "hint-ring" : ""}`}
            >
              {v || ""}
            </button>
          );
        })}
      </div>

      <div className="mx-auto mt-4 flex max-w-sm justify-center gap-2">
        {Array.from({ length: n }, (_, k) => k + 1).map((v) => (
          <button
            key={v}
            onClick={() => write(v)}
            disabled={done}
            className="flex h-12 flex-1 items-center justify-center rounded-xl border-[2.5px] border-ink bg-white font-display text-xl font-bold shadow-[0_3px_0_#1e2a3a] active:translate-y-0.5"
          >
            {v}
          </button>
        ))}
        <button
          onClick={() => write(0)}
          disabled={done}
          aria-label="ลบ"
          className="flex h-12 flex-1 items-center justify-center rounded-xl border-[2.5px] border-ink bg-white text-lg shadow-[0_3px_0_#1e2a3a] active:translate-y-0.5"
        >
          ⌫
        </button>
      </div>

      <Toast msg={msg} tone="info" />
      <div className="mt-4 flex justify-center gap-2">
        <button
          className="btn btn-ghost !min-h-10 text-sm"
          disabled={done}
          onClick={() => {
            setGrid(givens);
            setHintCell(null);
          }}
        >
          ⟲ เริ่มใหม่
        </button>
        <HintButton startedAt={session.startedAt} used={session.hints} onHint={hint} disabled={done} />
      </div>
    </div>
  );
}
