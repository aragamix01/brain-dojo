"use client";

import { useMemo, useState } from "react";
import type { Session } from "@/components/PuzzleShell";
import { elapsedSince, formatTime } from "@/lib/date";
import { starsFor } from "@/lib/rank";
import { rngFrom } from "@/lib/rng";
import { useProgress, type GameStat } from "@/lib/store";
import { HanoiGame } from "../hanoi/HanoiGame";
import { JugsGame } from "../jugs/JugsGame";
import { generateJugs } from "../jugs/logic";
import { LightsGame } from "../lights/LightsGame";
import { generateLights } from "../lights/logic";
import { NonogramGame } from "../nonogram/NonogramGame";
import { generateNonogram } from "../nonogram/logic";
import { QUEST_NODES, type QuestNode } from "../quest/data";
import { nodeSeed, questKey, questView } from "../quest/progress";
import { RobotGame } from "../robot/RobotGame";
import { robotLevel } from "../robot/levels";
import { DailySituation } from "../situation/SituationGame";
import { theme } from "../situation/data";
import { SprintGame } from "../sprint/SprintGame";
import { useMoveGuard } from "./MoveGuard";

/** How many map nodes a map day asks for, starting at the player's next unfinished one. */
export const MAP_STEPS = 2;

export type MapStage = { kind: "map"; node: QuestNode; emoji: string; label: string };

/** The next nodes on the player's map, as Daily stages. Empty once the map is finished. */
export function mapStages(games: Record<string, GameStat>): MapStage[] {
  const { current } = questView(games);
  return QUEST_NODES.slice(current, current + MAP_STEPS).map((node) => {
    const n = node.island.nodes.findIndex((x) => x.id === node.id) + 1;
    return { kind: "map", node, emoji: "🗺️", label: `${node.island.name} ด่าน ${n}${node.boss ? " 👹" : ""}` };
  });
}

type Done = (stars: number, detail: string) => void;

const xpFor = (node: QuestNode) => (node.boss ? 30 : 15);

/** Moves-based map puzzles, with the Daily's move guard. */
function GuardedPuzzle({ node, session, onWin }: { node: QuestNode; session: Session; onWin: (stars: number, detail: string) => void }) {
  const seed = useMemo(() => nodeSeed(node), [node]);
  const game = useMemo(() => {
    if (node.kind === "lights") return { kind: "lights" as const, puzzle: generateLights(rngFrom(seed), node.size, node.minPar) };
    if (node.kind === "jugs") return { kind: "jugs" as const, puzzle: generateJugs(rngFrom(seed), node.variant) };
    if (node.kind === "hanoi") return { kind: "hanoi" as const, disks: node.disks };
    if (node.kind === "nonogram") return { kind: "nonogram" as const, puzzle: generateNonogram(rngFrom(seed), node.size) };
    return null;
  }, [node, seed]);
  const par = game?.kind === "hanoi" ? 2 ** game.disks - 1 : game && "puzzle" in game && "par" in game.puzzle ? game.puzzle.par : 0;
  const guard = useMoveGuard(Math.max(1, par));
  if (!game) return null;
  const solved = ({ moves }: { moves: number }) =>
    onWin(par ? starsFor(moves, par, session.hints) : Math.max(1, 3 - session.hints), par ? `${moves} moves` : formatTime(elapsedSince(session.startedAt)));
  const props = { session, onSolved: solved, onAction: par ? guard.onAction : undefined };
  return (
    <>
      {par > 0 && guard.banner}
      <div key={guard.key}>
        {game.kind === "lights" && <LightsGame puzzle={game.puzzle} {...props} />}
        {game.kind === "jugs" && <JugsGame puzzle={game.puzzle} {...props} />}
        {game.kind === "hanoi" && <HanoiGame disks={game.disks} {...props} />}
        {game.kind === "nonogram" && <NonogramGame puzzle={game.puzzle} session={session} onSolved={solved} />}
      </div>
    </>
  );
}

/** A Speed Math node has to reach a third of its goal to pass, so it replays until it does. */
function MapSprint({ node, onWin }: { node: Extract<QuestNode, { kind: "sprint" }>; onWin: (stars: number, detail: string) => void }) {
  const [run, setRun] = useState(0);
  const [missed, setMissed] = useState<number | null>(null);
  return (
    <>
      {missed != null && (
        <p className="mb-3 rounded-xl bg-[#ffd6d6] px-3 py-2 text-center text-sm font-bold">
          ได้ {missed} แต้ม ยังไม่ถึง {Math.ceil(node.goal * 0.33)} — ลองอีกรอบ!
        </p>
      )}
      <SprintGame
        key={run}
        seed={`${nodeSeed(node)}-${run}`}
        durationSec={node.seconds}
        onDone={(r) => {
          const g = node.goal;
          const stars = r.score >= g ? 3 : r.score >= g * 0.66 ? 2 : r.score >= g * 0.33 ? 1 : 0;
          if (stars) return onWin(stars, `${r.score} pts`);
          setMissed(r.score);
          setRun(run + 1);
        }}
      />
    </>
  );
}

/** One map node played inside the Daily: the result also counts on the Quest map. */
export function DailyMapStage({ node, session, onDone }: { node: QuestNode; session: Session; onDone: Done }) {
  const recordWin = useProgress((s) => s.recordWin);
  const win = (stars: number, detail: string) => {
    recordWin(questKey(node.id), { stars, timeMs: elapsedSince(session.startedAt), xpBase: xpFor(node) });
    onDone(stars, detail);
  };
  switch (node.kind) {
    case "robot":
      return <RobotGame level={robotLevel(node.level)!} onWin={({ stars, steps }) => win(stars, `${steps} steps`)} />;
    case "situation":
      return <DailySituation th={theme(node.theme)!} seed={nodeSeed(node)} onFinish={({ stars, detail }) => win(stars, detail)} />;
    case "sprint":
      return <MapSprint node={node} onWin={win} />;
    default:
      return <GuardedPuzzle node={node} session={session} onWin={win} />;
  }
}
