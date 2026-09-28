"use client";

import { useState } from "react";
import { HintButton, Toast } from "@/components/game";
import type { Session, Solved } from "@/components/PuzzleShell";
import { randomItem } from "@/lib/rng";
import { press, solve, type LightsPuzzle } from "./logic";

/** Cells toggled by pressing i: itself plus its orthogonal neighbours. */
function plus(i: number, n: number): Set<number> {
  const r = Math.floor(i / n);
  const c = i % n;
  const out = new Set([i]);
  if (r > 0) out.add(i - n);
  if (r < n - 1) out.add(i + n);
  if (c > 0) out.add(i - 1);
  if (c < n - 1) out.add(i + 1);
  return out;
}

export function LightsGame({
  puzzle,
  session,
  onSolved,
}: {
  puzzle: LightsPuzzle;
  session: Session;
  onSolved: (r: Solved) => void;
}) {
  const { n } = puzzle;
  const [history, setHistory] = useState([puzzle.grid]);
  const [hintCell, setHintCell] = useState<number | null>(null);
  const [hintMsg, setHintMsg] = useState<string | null>(null);
  const [preview, setPreview] = useState<number | null>(null);
  const [chase, setChase] = useState(false);
  const [done, setDone] = useState(false);
  const grid = history[history.length - 1];
  const moves = history.length - 1;
  const lit = grid.filter(Boolean).length;
  const previewSet = preview === null ? null : plus(preview, n);
  const upperClear = grid.slice(0, n * (n - 1)).every((v) => !v);

  const tap = (i: number) => {
    if (done) return;
    const g = press(grid, n, i);
    setHistory([...history, g]);
    if (hintCell === i) {
      setHintCell(null);
      setHintMsg(null);
    }
    if (g.every((v) => !v)) {
      setDone(true);
      onSolved({ moves: moves + 1, par: puzzle.par });
    }
  };

  const hint = () => {
    const sol = solve(grid, n);
    if (!sol?.length) return;
    // Once the upper rows are clear, the real puzzle is "which top-row cells fix the bottom row?"
    const top = sol.filter((i) => i < n);
    if (upperClear && top.length) {
      setHintCell(randomItem(top));
      setHintMsg("เหลือแค่แถวล่าง → กดช่องนี้ที่แถวบนสุด แล้วไล่ไฟลงมาใหม่อีกรอบ");
    } else {
      setHintCell(randomItem(sol));
      setHintMsg("ช่องนี้อยู่ในคำตอบที่สั้นที่สุด");
    }
    session.takeHint();
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-sm">
        <span>
          💡 เหลือ <b className="text-gold">{lit}</b> ดวง
        </span>
        <span className="text-muted">
          Moves <b className="text-fg">{moves}</b> · Par {puzzle.par}
        </span>
      </div>
      <div
        className="mx-auto grid aspect-square w-full max-w-sm gap-2"
        style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}
        onPointerLeave={() => setPreview(null)}
      >
        {grid.map((on, i) => {
          const chaseMark = chase && i >= n && grid[i - n];
          const inPreview = previewSet?.has(i);
          return (
            <button
              key={i}
              aria-label={`ช่อง ${i + 1} ${on ? "เปิด" : "ปิด"}`}
              onClick={() => tap(i)}
              onPointerEnter={(e) => e.pointerType === "mouse" && setPreview(i)}
              onPointerDown={(e) => e.pointerType !== "mouse" && setPreview(i)}
              onPointerUp={(e) => e.pointerType !== "mouse" && setPreview(null)}
              className={`relative rounded-xl transition-all duration-150 active:scale-90 ${
                on
                  ? "border-[2.5px] border-ink bg-yellow shadow-[0_4px_0_#1e2a3a]"
                  : "border-[2.5px] border-ink/40 bg-white"
              } ${inPreview ? "outline-2 outline-offset-1 outline-ink/60 outline-dashed" : ""} ${
                hintCell === i ? "hint-ring" : ""
              }`}
            >
              {chaseMark && (
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-lg text-cyan">
                  ↓
                </span>
              )}
            </button>
          );
        })}
      </div>

      {chase && (
        <p className="mt-3 text-center text-xs text-cyan">
          {upperClear && lit
            ? "แถวบนเคลียร์หมดแล้ว! เหลือแถวล่าง — ลองหาว่าต้องกดแถวบนสุดช่องไหน แล้วไล่ลงมาใหม่"
            : "↓ = ไฟข้างบนยังเปิดอยู่ กดช่องนี้เพื่อดับมัน ทำทีละแถวจากบนลงล่าง"}
        </p>
      )}
      <Toast msg={hintMsg} tone="info" />

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <button
          className="btn btn-ghost !min-h-10 text-sm"
          onClick={() => setHistory(history.slice(0, -1))}
          disabled={done || moves === 0}
        >
          ↶ Undo
        </button>
        <button
          className="btn btn-ghost !min-h-10 text-sm"
          onClick={() => {
            setHistory([puzzle.grid]);
            setHintCell(null);
            setHintMsg(null);
          }}
          disabled={done || moves === 0}
        >
          ⟲ เริ่มใหม่
        </button>
        <button
          className={`btn !min-h-10 text-sm ${chase ? "btn-cyan" : "btn-ghost"}`}
          onClick={() => setChase(!chase)}
          disabled={done}
        >
          🧭 ท่าไล่ไฟ
        </button>
        <HintButton startedAt={session.startedAt} onHint={hint} disabled={done} />
      </div>
    </div>
  );
}
