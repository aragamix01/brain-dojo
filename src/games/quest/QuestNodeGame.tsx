"use client";

import { useMemo, useState } from "react";
import { ResultModal, useSession } from "@/components/game";
import type { Solved } from "@/components/PuzzleShell";
import { formatTime, elapsedSince } from "@/lib/date";
import { starsFor } from "@/lib/rank";
import { rngFrom } from "@/lib/rng";
import { useProgress } from "@/lib/store";
import { HanoiGame } from "../hanoi/HanoiGame";
import { JugsGame } from "../jugs/JugsGame";
import { generateJugs } from "../jugs/logic";
import { LightsGame } from "../lights/LightsGame";
import { generateLights } from "../lights/logic";
import { NonogramGame } from "../nonogram/NonogramGame";
import { generateNonogram } from "../nonogram/logic";
import { RobotGame } from "../robot/RobotGame";
import { robotLevel } from "../robot/levels";
import { FixedSituation } from "../situation/SituationGame";
import { theme } from "../situation/data";
import { SprintGame, type SprintResult } from "../sprint/SprintGame";
import type { QuestNode } from "./data";
import { nodeSeed, questKey } from "./progress";

const MAP = "/quest";

type Nav = { nextHref?: string };

function xpFor(node: QuestNode) {
  return node.boss ? 30 : 15;
}

/** Lights / Jugs / Nonogram / Hanoi with one fixed puzzle; retry replays the same one. */
function QuestPuzzle({ node, nextHref }: { node: Extract<QuestNode, { kind: "lights" | "jugs" | "nonogram" | "hanoi" }> } & Nav) {
  const seed = useMemo(() => nodeSeed(node), [node]);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ stars: number; xp: number; ms: number; moves: number; par?: number } | null>(
    null,
  );
  const session = useSession();
  const recordWin = useProgress((s) => s.recordWin);

  const onSolved = ({ moves, par }: Solved) => {
    const stars = par == null ? Math.max(1, 3 - session.hints) : starsFor(moves, par, session.hints);
    const ms = elapsedSince(session.startedAt);
    const xp = recordWin(questKey(node.id), { stars, timeMs: ms, xpBase: xpFor(node) });
    setTimeout(() => setResult({ stars, xp, ms, moves, par }), 450);
  };

  const retry = () => {
    setResult(null);
    setAttempt(attempt + 1);
    session.restart();
  };

  const props = { session, onSolved };
  let game: React.ReactNode;
  if (node.kind === "lights") game = <LightsGame puzzle={generateLights(rngFrom(seed), node.size, node.minPar)} {...props} />;
  else if (node.kind === "jugs") game = <JugsGame puzzle={generateJugs(rngFrom(seed), node.variant)} {...props} />;
  else if (node.kind === "nonogram")
    game = <NonogramGame puzzle={generateNonogram(rngFrom(seed), node.size)} {...props} />;
  else game = <HanoiGame disks={node.disks} {...props} />;

  return (
    <>
      <div key={attempt}>{game}</div>
      <ResultModal
        open={!!result}
        stars={result?.stars}
        xp={result?.xp}
        stats={[
          ["เวลา", result ? formatTime(result.ms) : ""],
          ["Moves", result ? `${result.moves}${result.par ? ` / par ${result.par}` : ""}` : ""],
        ]}
        nextHref={nextHref}
        onRetry={retry}
        retryLabel="เล่นใหม่เพื่อเก็บดาว"
        backHref={MAP}
        backLabel="🗺️ กลับแผนที่"
      />
    </>
  );
}

function QuestSprint({ node, nextHref }: { node: Extract<QuestNode, { kind: "sprint" }> } & Nav) {
  const [run, setRun] = useState(0);
  const [result, setResult] = useState<(SprintResult & { stars: number; xp: number }) | null>(null);
  const recordWin = useProgress((s) => s.recordWin);
  const seed = useMemo(() => nodeSeed(node), [node]);

  const done = (r: SprintResult) => {
    const g = node.goal;
    const stars = r.score >= g ? 3 : r.score >= g * 0.66 ? 2 : r.score >= g * 0.33 ? 1 : 0;
    const xp = stars ? recordWin(questKey(node.id), { stars, score: r.score, xpBase: xpFor(node) }) : 0;
    setResult({ ...r, stars, xp });
  };

  return (
    <>
      {run === 0 ? (
        <div className="card speedlines p-6 text-center">
          <p className="text-5xl">⚡</p>
          <p className="mt-3 font-display text-xl">
            {node.seconds} วินาที · เป้าหมาย {node.goal} แต้ม
          </p>
          <p className="mt-2 text-sm text-muted">
            ได้ {Math.ceil(node.goal * 0.33)} แต้มขึ้นไปถึงจะผ่าน · ครบ {node.goal} แต้ม = 3 ดาว
          </p>
          <button className="btn btn-primary mt-5 w-full text-lg" onClick={() => setRun(1)}>
            START!
          </button>
        </div>
      ) : (
        <SprintGame key={run} seed={`${seed}-${run}`} durationSec={node.seconds} onDone={done} />
      )}
      <ResultModal
        open={!!result}
        title={result?.stars ? "Clear!" : "ยังไม่ผ่าน"}
        stars={result?.stars}
        xp={result?.xp}
        stats={[
          ["Score", `${result?.score ?? 0} / ${node.goal}`],
          ["ตอบถูก", `${result?.correct ?? 0} ข้อ`],
        ]}
        nextHref={result?.stars ? nextHref : undefined}
        onRetry={() => {
          setResult(null);
          setRun(run + 1);
        }}
        retryLabel="ลองอีกรอบ"
        backHref={MAP}
        backLabel="🗺️ กลับแผนที่"
      />
    </>
  );
}

export function QuestNodeGame({ node, nextHref }: { node: QuestNode } & Nav) {
  switch (node.kind) {
    case "robot": {
      const level = robotLevel(node.level)!;
      return (
        <RobotGame
          level={level}
          recordKey={questKey(node.id)}
          backHref={MAP}
          backLabel="🗺️ กลับแผนที่"
          nextHref={nextHref}
          nextLabel="ด่านถัดไปบนแผนที่ →"
        />
      );
    }
    case "situation":
      return <FixedSituation th={theme(node.theme)!} seed={nodeSeed(node)} recordKey={questKey(node.id)} backHref={MAP} />;
    case "sprint":
      return <QuestSprint node={node} nextHref={nextHref} />;
    default:
      return <QuestPuzzle node={node} nextHref={nextHref} />;
  }
}
