"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNow } from "@/components/ui";
import { rngFrom } from "@/lib/rng";
import { levelFor, makeQuestion, pointsFor, type Question } from "./logic";

export type SprintResult = { score: number; correct: number; skipped: number };

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "skip"] as const;

export function SprintGame({
  seed,
  durationSec = 60,
  onDone,
}: {
  seed: string | number;
  durationSec?: number;
  onDone: (r: SprintResult) => void;
}) {
  const rng = useMemo(() => rngFrom(seed), [seed]);
  const [endAt] = useState(() => Date.now() + durationSec * 1000);
  const [q, setQ] = useState<Question>(() => makeQuestion(rng, 0));
  const [input, setInput] = useState("");
  const [stats, setStats] = useState<SprintResult>({ score: 0, correct: 0, skipped: 0 });
  const [fx, setFx] = useState<{ kind: "good" | "bad"; id: number; text?: string } | null>(null);
  const finished = useRef(false);
  const now = useNow(100);
  const left = Math.max(0, endAt - now);

  useEffect(() => {
    if (left === 0 && !finished.current) {
      finished.current = true;
      onDone(stats);
    }
  }, [left, stats, onDone]);

  const nextQ = useCallback(
    (correct: number) => {
      setQ(makeQuestion(rng, levelFor(correct)));
      setInput("");
    },
    [rng],
  );

  const press = useCallback(
    (k: string) => {
      if (finished.current) return;
      if (k === "⌫") return setInput((s) => s.slice(0, -1));
      if (k === "skip") {
        setStats((s) => ({ ...s, skipped: s.skipped + 1 }));
        setFx({ kind: "bad", id: Date.now(), text: `= ${q.answer}` });
        return nextQ(stats.correct);
      }
      const val = (input + k).replace(/^0+(?=\d)/, "");
      const ans = String(q.answer);
      if (val === ans) {
        const pts = pointsFor(q.level);
        const correct = stats.correct + 1;
        setStats((s) => ({ ...s, score: s.score + pts, correct }));
        setFx({ kind: "good", id: Date.now(), text: `+${pts}` });
        nextQ(correct);
      } else if (val.length >= ans.length) {
        setFx({ kind: "bad", id: Date.now() });
        setInput("");
      } else setInput(val);
    },
    [input, q, stats.correct, nextQ],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === "Backspace") press("⌫");
      else if (e.key === "Enter") press("skip");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [press]);

  const pct = left / (durationSec * 1000);

  return (
    <div className="select-none">
      <div className="mb-3 flex items-center gap-3">
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full transition-[width] duration-100 ${pct < 0.2 ? "bg-bad" : "bg-cyan"}`}
            style={{ width: `${pct * 100}%` }}
          />
        </div>
        <span className="w-10 text-right font-mono tabular-nums">{Math.ceil(left / 1000)}s</span>
      </div>
      <div className="flex justify-between text-sm text-muted">
        <span>
          Score <b className="font-display text-lg text-yellow">{stats.score}</b>
        </span>
        <span>Lv.{q.level + 1}</span>
      </div>

      <div
        key={fx?.id}
        className={`card relative my-4 flex h-40 flex-col items-center justify-center ${
          fx?.kind === "bad" ? "animate-shake !border-bad" : ""
        }`}
      >
        <p className="font-display text-4xl font-semibold tracking-wide">{q.text}</p>
        <p className="mt-2 h-10 font-mono text-3xl text-cyan">{input || " "}</p>
        {fx?.text && (
          <span
            className={`animate-pop absolute right-4 top-3 font-display ${fx.kind === "good" ? "text-good" : "text-bad"}`}
          >
            {fx.text}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {KEYS.map((k) => (
          <button
            key={k}
            onClick={() => press(k)}
            className={`btn !min-h-14 text-2xl ${k === "skip" ? "btn-ghost !text-sm text-muted" : "btn-ghost"}`}
          >
            {k === "skip" ? "ข้าม ⏭" : k}
          </button>
        ))}
      </div>
    </div>
  );
}
