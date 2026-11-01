"use client";

import { useEffect, useRef, useState } from "react";
import { useNow } from "@/components/ui";
import { QUIZ_SECONDS, type Quiz } from "./quiz";

export type QuizResult = { ok: boolean; ms: number };

const DISK_COLORS = ["#ff5fcf", "#ffd84d", "#41e8ff", "#3ddc97"];
const PEGS = "ABC";

function HanoiArt({ pegs }: { pegs: number[][] }) {
  return (
    <div className="flex justify-center gap-3">
      {pegs.map((p, i) => (
        <div key={i} className="flex w-20 flex-col items-center">
          <div className="flex h-20 w-full flex-col-reverse items-center justify-start border-b-[3px] border-ink">
            {p.map((d) => (
              <div
                key={d}
                className="h-4 rounded-md border-2 border-ink"
                style={{ width: `${30 + d * 15}%`, background: DISK_COLORS[d - 1] }}
              >
                <span className="block text-center text-[9px] font-bold leading-3">{d}</span>
              </div>
            ))}
          </div>
          <span className="font-display text-sm">{PEGS[i]}</span>
        </div>
      ))}
    </div>
  );
}

function MiniLights({ grid, mark }: { grid: boolean[]; mark?: number }) {
  return (
    <div className="grid w-fit grid-cols-3 gap-1">
      {grid.map((on, i) => (
        <span
          key={i}
          className={`flex h-7 w-7 items-center justify-center rounded border-2 border-ink text-xs ${on ? "bg-yellow" : "bg-white"}`}
        >
          {i === mark ? "👆" : ""}
        </span>
      ))}
    </div>
  );
}

function SudokuArt({ grid, cell }: { grid: number[]; cell: number }) {
  return (
    <div className="mx-auto grid w-fit grid-cols-4 border-[3px] border-ink">
      {grid.map((v, i) => (
        <span
          key={i}
          className={`flex h-9 w-9 items-center justify-center border-ink/30 font-display text-lg ${
            i % 4 === 1 ? "border-r-[3px] !border-r-ink" : "border-r"
          } ${Math.floor(i / 4) === 1 ? "border-b-[3px] !border-b-ink" : "border-b"} ${i === cell ? "bg-pink/40" : ""}`}
        >
          {i === cell ? "?" : v || ""}
        </span>
      ))}
    </div>
  );
}

function NonogramArt({ clue, length }: { clue: number[]; length: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      <span className="font-display text-lg">{clue.join(" ")}</span>
      <div className="flex">
        {Array.from({ length }, (_, i) => (
          <span key={i} className="flex h-8 w-8 items-center justify-center border-2 border-ink bg-white text-xs text-muted">
            {i + 1}
          </span>
        ))}
      </div>
    </div>
  );
}

function question(q: Quiz): { text: string; art: React.ReactNode } {
  switch (q.kind) {
    case "hanoi":
      return { text: "ย้ายทั้งหอไปเสา C ให้น้อยครั้งที่สุด — ตาต่อไปต้องย้ายอะไร?", art: <HanoiArt pegs={q.pegs} /> };
    case "lights":
      return {
        text: "กดดวงที่ 👆 แล้วไฟจะเป็นแบบไหน?",
        art: (
          <div className="flex justify-center">
            <MiniLights grid={q.grid} mark={q.press} />
          </div>
        ),
      };
    case "sudoku":
      return { text: "เลข 1–4 ห้ามซ้ำในแถว คอลัมน์ และกล่อง — ช่อง ? ต้องเป็นเลขอะไร?", art: <SudokuArt grid={q.grid} cell={q.cell} /> };
    case "nonogram":
      return {
        text: `แถวนี้มีเลข ${q.clue.join(" ")} — ช่องไหนต้องระบายแน่ๆ ไม่ว่าจะวางแบบไหน?`,
        art: <NonogramArt clue={q.clue} length={q.length} />,
      };
  }
}

function optionLabel(q: Quiz, i: number): React.ReactNode {
  switch (q.kind) {
    case "hanoi":
      return `แผ่น ${q.options[i].disk} → เสา ${PEGS[q.options[i].to]}`;
    case "lights":
      return <MiniLights grid={q.options[i]} />;
    case "sudoku":
      return q.options[i];
    case "nonogram":
      return `ช่อง ${q.options[i] + 1}`;
  }
}

/**
 * The bonus question between Daily stages. A wrong pick, running out of time, or leaving the app all
 * count as a miss. The player only hears "bonus"; the reason for it stays with the uncle.
 */
export function QuizCard({ quiz, onDone }: { quiz: Quiz; onDone: (r: QuizResult) => void }) {
  const [startedAt] = useState(() => Date.now());
  const [picked, setPicked] = useState<{ i: number; ok: boolean } | null>(null);
  const now = useNow(250, !picked);
  const left = Math.max(0, QUIZ_SECONDS - (now - startedAt) / 1000);
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  });

  const finish = (i: number) => {
    if (picked) return;
    const ok = i === quiz.answer;
    setPicked({ i, ok });
    const ms = Date.now() - startedAt;
    setTimeout(() => doneRef.current({ ok, ms }), ok ? 700 : 1600);
  };
  const finishRef = useRef(finish);
  useEffect(() => {
    finishRef.current = finish;
  });

  useEffect(() => {
    if (left <= 0) finishRef.current(-1);
  }, [left]);

  useEffect(() => {
    const leave = () => finishRef.current(-1);
    const visibility = () => document.hidden && leave();
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("blur", leave);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("blur", leave);
    };
  }, []);

  const { text, art } = question(quiz);
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <p className="font-display text-lg">⚡ คำถามโบนัส</p>
        <span className="font-mono text-sm tabular-nums">{Math.ceil(left)} วิ</span>
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-ink/10">
        <div className="h-full rounded-full bg-pink transition-all" style={{ width: `${(left / QUIZ_SECONDS) * 100}%` }} />
      </div>
      <p className="mt-3 text-sm">{text}</p>
      <div className="my-4">{art}</div>
      <div className={`grid gap-2 ${quiz.kind === "lights" ? "grid-cols-3" : "grid-cols-1"}`}>
        {quiz.options.map((_, i) => {
          const state = !picked ? "" : i === quiz.answer ? "bg-good/30 border-good" : i === picked.i ? "bg-bad/20" : "opacity-50";
          return (
            <button
              key={i}
              className={`btn btn-ghost flex justify-center py-2 font-display ${state}`}
              disabled={!!picked}
              onClick={() => finish(i)}
            >
              {optionLabel(quiz, i)}
            </button>
          );
        })}
      </div>
      {picked && (
        <p className={`mt-3 text-center font-display ${picked.ok ? "text-good" : "text-bad"}`}>
          {picked.ok ? "✔ ถูกต้อง!" : picked.i < 0 ? "⏱ หมดเวลา — คำตอบที่ถูกคือช่องสีเขียว" : "✗ ยังไม่ใช่ — คำตอบที่ถูกคือช่องสีเขียว"}
        </p>
      )}
    </div>
  );
}
