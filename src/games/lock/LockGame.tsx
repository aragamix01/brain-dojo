"use client";

import { useState } from "react";
import { HintButton, Toast } from "@/components/game";
import type { Session, Solved } from "@/components/PuzzleShell";
import { randomItem } from "@/lib/rng";
import { GEMS, score, stillPossible, type Feedback, type LockPuzzle } from "./logic";

type Row = { guess: number[]; fb: Feedback };

function Pegs({ fb, pegs }: { fb: Feedback; pegs: number }) {
  const dots = [
    ...Array(fb.exact).fill("exact"),
    ...Array(fb.near).fill("near"),
    ...Array(pegs - fb.exact - fb.near).fill("none"),
  ];
  return (
    <div className="grid grid-cols-2 gap-1" aria-label={`ถูกที่ ${fb.exact} ถูกสีผิดที่ ${fb.near}`}>
      {dots.map((d, i) => (
        <span
          key={i}
          className={`h-3 w-3 rounded-full border-2 border-ink ${d === "exact" ? "bg-ink" : d === "near" ? "bg-white" : "border-ink/20"}`}
        />
      ))}
    </div>
  );
}

export function LockGame({ puzzle, session, onSolved }: { puzzle: LockPuzzle; session: Session; onSolved: (r: Solved) => void }) {
  const { pegs, colors, code } = puzzle;
  const [rows, setRows] = useState<Row[]>([]);
  const [cur, setCur] = useState<(number | null)[]>(() => Array(pegs).fill(null));
  const [slot, setSlot] = useState(0);
  // Positions revealed by hints stay locked in.
  const [known, setKnown] = useState<Record<number, number>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const done = rows.at(-1)?.fb.exact === pegs;

  const put = (color: number) => {
    if (done) return;
    if (!puzzle.repeats && cur.some((c, i) => c === color && i !== slot)) {
      setMsg("กุญแจนี้ไม่มีอัญมณีซ้ำกัน");
      return;
    }
    const next = [...cur];
    next[slot] = color;
    setCur(next);
    setMsg(null);
    const empty = next.findIndex((c, i) => c === null && i > slot);
    const anyEmpty = next.findIndex((c) => c === null);
    setSlot(empty >= 0 ? empty : anyEmpty >= 0 ? anyEmpty : slot);
  };

  const submit = () => {
    if (cur.some((c) => c === null)) return;
    const guess = cur as number[];
    const fb = score(code, guess);
    const next = [...rows, { guess, fb }];
    setRows(next);
    setMsg(null);
    if (fb.exact === pegs) {
      onSolved({ moves: next.length, par: puzzle.par });
      return;
    }
    // Keep hinted gems in place for the next try.
    setCur(Array.from({ length: pegs }, (_, i) => known[i] ?? null));
    setSlot(Array.from({ length: pegs }, (_, i) => i).find((i) => known[i] == null) ?? 0);
  };

  const hint = () => {
    const open = Array.from({ length: pegs }, (_, i) => i).filter((i) => known[i] == null);
    if (!open.length) return;
    const i = randomItem(open);
    session.takeHint();
    setKnown({ ...known, [i]: code[i] });
    const nextCur = [...cur];
    nextCur[i] = code[i];
    setCur(nextCur);
    const left = stillPossible(puzzle, rows).length;
    setMsg(`ช่องที่ ${i + 1} คือ ${GEMS[code[i]]} · จากที่ลองมา เหลือรหัสที่เป็นไปได้ ${left} แบบ`);
  };

  return (
    <div>
      <div className="card mb-3 px-4 py-3 text-center text-sm">
        <p className="font-display text-base">🔐 ไขรหัสอัญมณี {pegs} ช่อง</p>
        <p className="mt-1 text-xs text-muted">
          ● ดำ = ถูกอัญมณีและถูกที่ · ○ ขาว = มีอัญมณีนี้แต่ผิดที่ · {puzzle.repeats ? "อัญมณีซ้ำกันได้" : "ไม่มีอัญมณีซ้ำ"}
        </p>
        <p className="mt-1 text-xs text-muted">
          ครั้งที่ <b className="text-fg">{rows.length + (done ? 0 : 1)}</b> · Par {puzzle.par}
        </p>
      </div>

      <div className="space-y-1.5">
        {rows.map((r, k) => (
          <div key={k} className="flex items-center justify-center gap-3 rounded-xl bg-ink/5 px-3 py-1.5">
            <span className="w-5 text-right font-display text-xs text-muted">{k + 1}</span>
            <div className="flex gap-1.5">
              {r.guess.map((c, i) => (
                <span key={i} className="flex h-9 w-9 items-center justify-center text-2xl">
                  {GEMS[c]}
                </span>
              ))}
            </div>
            <Pegs fb={r.fb} pegs={pegs} />
          </div>
        ))}
      </div>

      {!done && (
        <>
          <div className="mt-3 flex justify-center gap-2">
            {cur.map((c, i) => (
              <button
                key={i}
                onClick={() => setSlot(i)}
                aria-label={`ช่อง ${i + 1}`}
                className={`flex h-14 w-14 items-center justify-center rounded-2xl border-[2.5px] bg-white text-3xl ${
                  slot === i ? "border-ink shadow-[0_4px_0_#1e2a3a]" : "border-ink/30"
                } ${known[i] != null ? "bg-yellow" : ""}`}
              >
                {c == null ? "" : GEMS[c]}
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {GEMS.slice(0, colors).map((g, c) => (
              <button
                key={c}
                onClick={() => put(c)}
                className="flex h-12 w-12 items-center justify-center rounded-xl border-[2.5px] border-ink bg-white text-2xl shadow-[0_3px_0_#1e2a3a] active:translate-y-0.5"
              >
                {g}
              </button>
            ))}
          </div>
        </>
      )}

      <Toast msg={msg} tone="info" />
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <button
          className="btn btn-ghost !min-h-10 text-sm"
          disabled={done}
          onClick={() => {
            setCur(Array.from({ length: pegs }, (_, i) => known[i] ?? null));
            setSlot(0);
          }}
        >
          ⌫ ล้าง
        </button>
        <button className="btn btn-primary !min-h-10 text-sm" disabled={done || cur.some((c) => c === null)} onClick={submit}>
          🔑 ลองไข
        </button>
        <HintButton startedAt={session.startedAt} used={session.hints} onHint={hint} disabled={done} />
      </div>
    </div>
  );
}
