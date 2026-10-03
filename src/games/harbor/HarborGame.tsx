"use client";

import { useRef, useState } from "react";
import { HintButton, Toast } from "@/components/game";
import type { Session, Solved } from "@/components/PuzzleShell";
import { EXIT_ROW, GOAL_POS, SIZE, isSolved, nextMove, slideRange, type HarborPuzzle } from "./logic";

const COLORS = ["#ffc93c", "#2ec4b6", "#4d8dff", "#a78bfa", "#ff9f43", "#8bd17c", "#f78fb3", "#7ed6df"];

type Drag = { boat: number; startXY: number; startPos: number; lo: number; hi: number; pos: number };

export function HarborGame({
  puzzle,
  session,
  onSolved,
  onAction,
}: {
  puzzle: HarborPuzzle;
  session: Session;
  onSolved: (r: Solved) => void;
  /** every boat slide, for the Daily's move guard */
  onAction?: () => void;
}) {
  const { boats } = puzzle;
  const [history, setHistory] = useState([puzzle.start]);
  const state = history.at(-1)!;
  const moves = history.length - 1;
  const [drag, setDrag] = useState<Drag | null>(null);
  const [hintBoat, setHintBoat] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const board = useRef<HTMLDivElement>(null);
  const done = isSolved(state);

  const cellPx = () => (board.current?.clientWidth ?? SIZE * 50) / SIZE;

  const down = (e: React.PointerEvent, i: number) => {
    if (done) return;
    const [lo, hi] = slideRange(boats, state, i);
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({ boat: i, startXY: boats[i].horiz ? e.clientX : e.clientY, startPos: state[i], lo, hi, pos: state[i] });
  };

  const move = (e: React.PointerEvent) => {
    if (!drag) return;
    const d = ((boats[drag.boat].horiz ? e.clientX : e.clientY) - drag.startXY) / cellPx();
    const pos = Math.max(drag.lo, Math.min(drag.hi, Math.round(drag.startPos + d)));
    if (pos !== drag.pos) setDrag({ ...drag, pos });
  };

  const up = () => {
    if (!drag) return;
    if (drag.pos !== drag.startPos) {
      const next = state.map((p, i) => (i === drag.boat ? drag.pos : p));
      setHistory([...history, next]);
      onAction?.();
      setHintBoat(null);
      setMsg(null);
      if (isSolved(next)) onSolved({ moves: moves + 1, par: puzzle.par });
    }
    setDrag(null);
  };

  const hint = () => {
    const m = nextMove(boats, state);
    if (!m) return;
    session.takeHint();
    setHintBoat(m.boat);
    const b = boats[m.boat];
    const dir = b.horiz ? (m.to > state[m.boat] ? "ขวา" : "ซ้าย") : m.to > state[m.boat] ? "ลง" : "ขึ้น";
    setMsg(m.boat === 0 ? `ลองเลื่อนเรือเราไปทาง${dir}` : `ลองเลื่อนเรือที่กระพริบไปทาง${dir}`);
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-sm">
        <span>🏴‍☠️ พาเรือแดงออกทางช่องขวา</span>
        <span className="text-muted">
          Moves <b className="text-fg">{moves}</b> · Par {puzzle.par}
        </span>
      </div>

      <div className="relative mx-auto w-full max-w-sm pr-3">
        <div
          ref={board}
          className="relative aspect-square w-full touch-none rounded-2xl border-[3px] border-ink bg-[#bfe8ff]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(30,42,58,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(30,42,58,.08) 1px, transparent 1px)",
            backgroundSize: `${100 / SIZE}% ${100 / SIZE}%`,
          }}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
        >
          {boats.map((b, i) => {
            const pos = drag?.boat === i ? drag.pos : state[i];
            const row = b.horiz ? b.lane : pos;
            const col = b.horiz ? pos : b.lane;
            const ship = i === 0;
            return (
              <button
                key={i}
                aria-label={ship ? "เรือของเรา" : `เรือลำที่ ${i}`}
                onPointerDown={(e) => down(e, i)}
                className={`absolute flex items-center justify-center rounded-xl border-[2.5px] border-ink text-xl shadow-[0_3px_0_#1e2a3a] ${
                  drag?.boat === i ? "z-10 scale-[1.03]" : "transition-all duration-150"
                } ${hintBoat === i ? "hint-ring" : ""}`}
                style={{
                  left: `calc(${(col / SIZE) * 100}% + 3px)`,
                  top: `calc(${(row / SIZE) * 100}% + 3px)`,
                  width: `calc(${((b.horiz ? b.len : 1) / SIZE) * 100}% - 6px)`,
                  height: `calc(${((b.horiz ? 1 : b.len) / SIZE) * 100}% - 6px)`,
                  background: ship ? "#ff5a5f" : COLORS[i % COLORS.length],
                }}
              >
                {ship ? "🏴‍☠️" : ""}
              </button>
            );
          })}
        </div>
        {/* The gap in the harbor wall, right of the ship's row. */}
        <div
          className="absolute right-0 flex w-4 items-center justify-center rounded-r-lg bg-[#ff5a5f]/80 text-[10px] font-bold text-white"
          style={{ top: `calc(${(EXIT_ROW / SIZE) * 100}% + 3px)`, height: `calc(${100 / SIZE}% - 6px)` }}
        >
          ▶
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-muted">
        ลากเรือไปตามแนวยาวของมัน · เรือแนวนอนเลื่อนซ้าย-ขวา แนวตั้งเลื่อนขึ้น-ลง
      </p>
      {done && state[0] === GOAL_POS && <p className="mt-2 text-center font-display text-good">ออกจากท่าได้แล้ว! ⛵</p>}

      <Toast msg={msg} tone="info" />
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <button className="btn btn-ghost !min-h-10 text-sm" onClick={() => setHistory(history.slice(0, -1))} disabled={done || !moves}>
          ↶ Undo
        </button>
        <button
          className="btn btn-ghost !min-h-10 text-sm"
          onClick={() => {
            setHistory([puzzle.start]);
            setHintBoat(null);
          }}
          disabled={done || !moves}
        >
          ⟲ เริ่มใหม่
        </button>
        <HintButton startedAt={session.startedAt} used={session.hints} onHint={hint} disabled={done} />
      </div>
    </div>
  );
}
