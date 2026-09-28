"use client";

import { useState } from "react";
import { ResultModal } from "@/components/game";
import { BackHeader, ClientOnly } from "@/components/ui";
import { SprintGame, type SprintResult } from "@/games/sprint/SprintGame";
import { sprintStars } from "@/games/sprint/logic";
import { randomSeed } from "@/lib/rng";
import { useProgress } from "@/lib/store";

export default function SprintPage() {
  const [run, setRun] = useState<number | null>(null);
  const [result, setResult] = useState<(SprintResult & { stars: number; xp: number }) | null>(null);
  const recordWin = useProgress((s) => s.recordWin);
  const best = useProgress((s) => s.games.sprint?.bestScore ?? 0);

  const done = (r: SprintResult) => {
    const stars = sprintStars(r.score);
    const xp = r.score > 0 ? recordWin("sprint", { stars, score: r.score, xpBase: 8 }) : 0;
    setResult({ ...r, stars, xp });
  };

  return (
    <>
      <BackHeader title="⚡ Speed Math" sub="คิดเลขในใจ 60 วินาที" href="/play" />
      {run === null ? (
        <div className="card speedlines p-6 text-center">
          <p className="text-5xl">⚡</p>
          <p className="mt-3 font-display text-xl">60 วินาที ตอบให้ได้มากที่สุด</p>
          <ul className="mt-3 space-y-1 text-left text-sm text-muted">
            <li>• พิมพ์คำตอบถูกเมื่อไหร่ ไปข้อต่อไปทันที</li>
            <li>• ยิ่งตอบถูกเยอะ โจทย์ยิ่งยาก และได้แต้มมากขึ้น</li>
            <li>• ห้ามใช้เครื่องคิดเลข / ห้ามถาม AI — ใช้สมองล้วนๆ 🧠</li>
          </ul>
          <ClientOnly>
            <p className="mt-4 text-sm">
              Best: <b className="text-yellow">{best}</b>
            </p>
          </ClientOnly>
          <button className="btn btn-primary mt-5 w-full text-lg" onClick={() => setRun(randomSeed())}>
            START!
          </button>
        </div>
      ) : (
        <SprintGame key={run} seed={run} onDone={done} />
      )}
      <ResultModal
        open={!!result}
        title="Time's up!"
        stars={result?.stars}
        xp={result?.xp}
        stats={[
          ["Score", result?.score ?? 0],
          ["ตอบถูก", `${result?.correct ?? 0} ข้อ`],
        ]}
        onRetry={() => {
          setResult(null);
          setRun(randomSeed());
        }}
        backHref="/play"
      />
    </>
  );
}
