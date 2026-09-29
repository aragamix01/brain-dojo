"use client";

import { useState } from "react";
import { HintButton } from "@/components/game";
import type { Session, Solved } from "@/components/PuzzleShell";
import { canMove, move, nextMove, topDisk } from "./logic";

const COLORS = ["#ff5fcf", "#ffd84d", "#41e8ff", "#3ddc97", "#9b5cff", "#ff8a4d", "#4d7cff", "#ff4d6d"];
const TARGET = 2;

export function HanoiGame({ disks, session, onSolved }: { disks: number; session: Session; onSolved: (r: Solved) => void }) {
  const [pos, setPos] = useState<number[]>(() => Array(disks).fill(0));
  const [moves, setMoves] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const [hint, setHint] = useState<{ from: number; to: number } | null>(null);
  const [done, setDone] = useState(false);
  const par = 2 ** disks - 1;

  const tapPeg = (p: number) => {
    if (done) return;
    if (sel === null) {
      if (topDisk(pos, p) !== null) setSel(p);
      return;
    }
    if (sel === p || !canMove(pos, sel, p)) {
      setSel(null);
      return;
    }
    const next = move(pos, sel, p);
    setPos(next);
    setMoves(moves + 1);
    setSel(null);
    setHint(null);
    if (next.every((x) => x === TARGET)) {
      setDone(true);
      onSolved({ moves: moves + 1, par });
    }
  };

  return (
    <div>
      <div className="mb-3 flex justify-between text-sm">
        <span>ย้ายทุกแผ่นไปเสาขวาสุด 🏁</span>
        <span className="text-muted">
          Moves <b className="text-fg">{moves}</b> · Par {par}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((p) => {
          const stack = pos
            .map((peg, d) => ({ peg, d }))
            .filter((x) => x.peg === p)
            .map((x) => x.d)
            .reverse();
          const isHint = hint && (hint.from === p || hint.to === p);
          return (
            <button
              key={p}
              onClick={() => tapPeg(p)}
              aria-label={`เสา ${p + 1}`}
              className={`relative flex h-64 flex-col-reverse items-center rounded-2xl border-[2.5px] pb-2 transition ${
                sel === p ? "border-ink bg-[#dff4ff] shadow-[3px_3px_0_#1e2a3a]" : "border-ink/60 bg-white"
              } ${isHint ? "hint-ring" : ""}`}
            >
              <div className="absolute bottom-2 top-6 w-1.5 rounded-full bg-ink/20" />
              {stack.map((d, k) => (
                <div
                  key={d}
                  className={`relative z-10 h-5 rounded-full transition-transform ${
                    sel === p && k === stack.length - 1 ? "-translate-y-3" : ""
                  }`}
                  style={{
                    width: `${28 + ((d + 1) / disks) * 68}%`,
                    background: COLORS[d % COLORS.length],
                    marginTop: 3,
                  }}
                />
              ))}
              {p === TARGET && <span className="absolute top-1 text-xs">🏁</span>}
            </button>
          );
        })}
      </div>
      {hint && (
        <p className="mt-3 text-center text-sm text-cyan">
          ลองย้ายจากเสา {hint.from + 1} ไปเสา {hint.to + 1}
        </p>
      )}
      <div className="mt-4 flex justify-center gap-2">
        <button
          className="btn btn-ghost !min-h-10 text-sm"
          disabled={done}
          onClick={() => {
            setPos(Array(disks).fill(0));
            setMoves(0);
            setSel(null);
            setHint(null);
          }}
        >
          ⟲ เริ่มใหม่
        </button>
        <HintButton
          startedAt={session.startedAt}
          used={session.hints}
          disabled={done}
          onHint={() => {
            setHint(nextMove(pos, disks, TARGET));
            session.takeHint();
          }}
        />
      </div>
    </div>
  );
}
