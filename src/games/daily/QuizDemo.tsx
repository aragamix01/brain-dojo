"use client";

import { useState } from "react";
import { randomSeed, rngFrom } from "@/lib/rng";
import { QUIZ_KINDS, makeQuiz } from "./quiz";
import { QuizCard, type QuizResult } from "./QuizCard";

/** Secret test page (/daily?quizdemo): every kind of bonus question once, nothing recorded. */
export function QuizDemo() {
  const [results, setResults] = useState<(QuizResult & { kind: string })[]>([]);
  const [seed] = useState(randomSeed);
  const i = results.length;

  if (i >= QUIZ_KINDS.length)
    return (
      <div className="card p-4">
        <p className="font-display text-lg">🧪 ทดลองคำถามโบนัส — จบแล้ว (ไม่ได้บันทึกอะไร)</p>
        <ul className="mt-2 space-y-1 text-sm">
          {results.map((r) => (
            <li key={r.kind}>
              {r.ok ? "✔" : "✗"} {r.kind} · {(r.ms / 1000).toFixed(1)} วิ
            </li>
          ))}
        </ul>
        <button className="btn btn-ghost mt-3 w-full" onClick={() => setResults([])}>
          ↻ เล่นอีกรอบ
        </button>
      </div>
    );

  const kind = QUIZ_KINDS[i];
  return (
    <>
      <p className="mb-2 text-xs text-muted">
        🧪 ทดลอง {i + 1}/{QUIZ_KINDS.length} · {kind} · ไม่บันทึกผล
      </p>
      <QuizCard
        key={`${seed}-${i}`}
        quiz={makeQuiz(kind, rngFrom(`${seed}:${i}`))!}
        onDone={(r) => setResults((rs) => [...rs, { ...r, kind }])}
      />
    </>
  );
}
