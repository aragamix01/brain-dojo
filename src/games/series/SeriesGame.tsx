"use client";

import { useState } from "react";
import { HintButton, Toast } from "@/components/game";
import type { Session, Solved } from "@/components/PuzzleShell";
import type { SeriesPuzzle } from "./logic";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "−", "0", "⌫"];

export function SeriesGame({
  puzzle,
  session,
  onSolved,
  onAction,
}: {
  puzzle: SeriesPuzzle;
  session: Session;
  onSolved: (r: Solved) => void;
  /** every answer, for the Daily's move guard */
  onAction?: () => void;
}) {
  const { items } = puzzle;
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [tries, setTries] = useState(0);
  const [shake, setShake] = useState(false);
  const [msg, setMsg] = useState<{ text: string; tone: "bad" | "good" | "info" } | null>(null);
  // Hints shown for the current series: 1 = how to look at it, 2 = the rule itself.
  const [hinted, setHinted] = useState(0);
  const done = idx >= items.length;
  const cur = items[Math.min(idx, items.length - 1)];

  const press = (k: string) => {
    if (done) return;
    if (k === "⌫") setInput(input.slice(0, -1));
    else if (k === "−") setInput(input.startsWith("-") ? input.slice(1) : `-${input}`);
    else if (input.replace("-", "").length < 4) setInput(input + k);
  };

  const check = () => {
    if (!input || input === "-") return;
    const t = tries + 1;
    setTries(t);
    onAction?.();
    if (Number(input) !== cur.answer) {
      setShake(true);
      setTimeout(() => setShake(false), 300);
      setMsg({ text: "ยังไม่ใช่ ลองดูแพทเทิร์นอีกที", tone: "bad" });
      setInput("");
      return;
    }
    setMsg({ text: `ถูกต้อง! ${cur.rule}`, tone: "good" });
    setInput("");
    setHinted(0);
    if (idx + 1 >= items.length) {
      setIdx(items.length);
      onSolved({ moves: t, par: items.length });
    } else setIdx(idx + 1);
  };

  const hint = () => {
    session.takeHint();
    const level = Math.min(2, hinted + 1);
    setHinted(level);
    setMsg({ text: level === 1 ? cur.hint : `กฎคือ: ${cur.rule}`, tone: "info" });
  };

  return (
    <div>
      <div className="mb-3 flex gap-1.5">
        {items.map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i < idx ? "bg-good" : i === idx ? "bg-pink" : "bg-ink/10"}`} />
        ))}
      </div>
      <p className="mb-2 text-center text-sm text-muted">
        ข้อ {Math.min(idx + 1, items.length)}/{items.length} · ตอบไป {tries} ครั้ง (เต็ม {items.length} ได้ 3★)
      </p>

      <div className={`card px-3 py-5 ${shake ? "animate-shake" : ""}`}>
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {cur.terms.map((t, i) => (
            <span key={i} className="flex h-12 min-w-12 items-center justify-center rounded-xl bg-ink/5 px-2 font-display text-xl font-bold">
              {t}
            </span>
          ))}
          <span className="flex h-12 min-w-14 items-center justify-center rounded-xl border-[2.5px] border-dashed border-ink bg-yellow/40 px-2 font-display text-xl font-bold">
            {done ? cur.answer : input || "?"}
          </span>
        </div>
      </div>

      <Toast msg={msg?.text ?? null} tone={msg?.tone} />

      {!done && (
        <div className="mx-auto mt-4 grid max-w-xs grid-cols-3 gap-2">
          {KEYS.map((k) => (
            <button
              key={k}
              onClick={() => press(k)}
              className="flex h-12 items-center justify-center rounded-xl border-[2.5px] border-ink bg-white font-display text-xl font-bold shadow-[0_3px_0_#1e2a3a] active:translate-y-0.5"
            >
              {k}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 flex justify-center gap-2">
        <button className="btn btn-primary !min-h-10 text-sm" disabled={done || !input || input === "-"} onClick={check}>
          ✓ ตอบ
        </button>
        <HintButton startedAt={session.startedAt} used={session.hints} onHint={hint} disabled={done || hinted >= 2} />
      </div>
    </div>
  );
}
