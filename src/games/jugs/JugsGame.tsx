"use client";

import { useState } from "react";
import { HintButton, Toast } from "@/components/game";
import type { Session, Solved } from "@/components/PuzzleShell";
import { applyMove, isGoal, shortestPath, type JugMove, type JugPuzzle } from "./logic";

const MAX_H = 190;

export function JugsGame({
  puzzle,
  session,
  onSolved,
  onAction,
}: {
  puzzle: JugPuzzle;
  session: Session;
  onSolved: (r: Solved) => void;
  /** every pour/fill/empty, for the Daily's move guard */
  onAction?: () => void;
}) {
  const { caps, source, target } = puzzle;
  const [state, setState] = useState(puzzle.start);
  const [moves, setMoves] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const [shake, setShake] = useState<number | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const maxCap = Math.max(...caps);

  const doMove = (m: JugMove) => {
    const next = applyMove(state, caps, m);
    setState(next);
    setMoves(moves + 1);
    onAction?.();
    setSel(null);
    setHint(null);
    if (isGoal(next, target)) {
      setDone(true);
      onSolved({ moves: moves + 1, par: puzzle.par });
    }
  };

  const tapJug = (i: number) => {
    if (done) return;
    if (sel === null) {
      if (state[i] > 0) setSel(i);
      else {
        setShake(i);
        setTimeout(() => setShake(null), 260);
      }
    } else if (sel === i) setSel(null);
    else if (state[i] < caps[i]) doMove({ kind: "pour", from: sel, to: i });
    else {
      setShake(i);
      setTimeout(() => setShake(null), 260);
    }
  };

  const showHint = () => {
    const path = shortestPath(state, caps, source, target);
    const m = path?.[0];
    if (!m) return;
    session.takeHint();
    const name = (i: number) => `เหยือก ${caps[i]}L`;
    setHint(
      m.kind === "fill"
        ? `ลองเติม${name(m.i)}ให้เต็ม`
        : m.kind === "empty"
          ? `ลองเท${name(m.i)}ทิ้ง`
          : `ลองเทจาก${name(m.from)} ไป${name(m.to)}`,
    );
  };

  return (
    <div>
      <div className="card mb-4 px-4 py-3 text-center">
        <p className="text-sm text-muted">เป้าหมาย / Goal</p>
        <p className="font-display text-lg">
          ตวงน้ำให้ได้ <span className="text-2xl text-cyan">{target} ลิตร</span> ในเหยือกใดก็ได้
        </p>
        <p className="mt-1 text-xs text-muted">
          {source ? "มีก๊อกน้ำไม่จำกัด เติม/เททิ้งได้" : "ไม่มีก๊อก! เทไปมาระหว่างเหยือกได้อย่างเดียว"} · Moves{" "}
          <b className="text-fg">{moves}</b> · Par {puzzle.par}
        </p>
      </div>

      <div className="flex items-end justify-center gap-4" style={{ minHeight: MAX_H + 20 }}>
        {caps.map((cap, i) => {
          const h = Math.max(70, (cap / maxCap) * MAX_H);
          return (
            <div key={i} className="flex flex-col items-center gap-2">
              <span className="font-display text-sm">
                <b className={state[i] === target ? "text-good" : ""}>{state[i]}</b>
                <span className="text-muted">/{cap}L</span>
              </span>
              <button
                onClick={() => tapJug(i)}
                aria-label={`เหยือก ${cap} ลิตร มีน้ำ ${state[i]} ลิตร`}
                className={`relative w-16 overflow-hidden rounded-b-2xl rounded-t-md border-2 bg-ink/5 transition ${
                  sel === i ? "-translate-y-2 border-cyan shadow-[3px_3px_0_#1E2A3A]" : "border-ink/30"
                } ${shake === i ? "animate-shake border-bad" : ""}`}
                style={{ height: h }}
              >
                <div
                  className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#2a6bff] to-cyan/80 transition-all duration-300"
                  style={{ height: `${(state[i] / cap) * 100}%` }}
                />
                {Array.from({ length: cap - 1 }, (_, k) => (
                  <div
                    key={k}
                    className="absolute left-0 w-2 border-t border-ink/30"
                    style={{ bottom: `${((k + 1) / cap) * 100}%` }}
                  />
                ))}
              </button>
              {source && (
                <div className="flex gap-1">
                  <button
                    className="btn btn-ghost !min-h-8 !px-2 text-xs"
                    disabled={done || state[i] === cap}
                    onClick={() => doMove({ kind: "fill", i })}
                  >
                    🚰 เติม
                  </button>
                  <button
                    className="btn btn-ghost !min-h-8 !px-2 text-xs"
                    disabled={done || state[i] === 0}
                    onClick={() => doMove({ kind: "empty", i })}
                  >
                    🗑️
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-center text-xs text-muted">แตะเหยือกต้นทาง แล้วแตะเหยือกปลายทางเพื่อเท</p>
      <Toast msg={hint} tone="info" />
      <div className="mt-4 flex justify-center gap-2">
        <button
          className="btn btn-ghost !min-h-10 text-sm"
          disabled={done}
          onClick={() => {
            setState(puzzle.start);
            setMoves(0);
            setSel(null);
            setHint(null);
          }}
        >
          ⟲ เริ่มใหม่
        </button>
        <HintButton startedAt={session.startedAt} used={session.hints} onHint={showHint} disabled={done} />
      </div>
    </div>
  );
}
