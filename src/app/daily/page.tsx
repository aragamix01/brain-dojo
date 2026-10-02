"use client";

import { useMemo, useState } from "react";
import { CoinChip, useSession } from "@/components/game";
import type { Session } from "@/components/PuzzleShell";
import { BackHeader, ClientOnly } from "@/components/ui";
import {
  DAILY_LEVELS,
  DAILY_STAGES,
  START_LEVEL,
  dailyPlan,
  isBossDay,
  playLevel,
  sprintDailyStars,
  strongRunsAt,
  type DailyStageWithSeed,
} from "@/games/daily/plan";
import { HuntBoard } from "@/games/daily/HuntBoard";
import { isHuntDay } from "@/games/daily/hunt";
import { HanoiGame } from "@/games/hanoi/HanoiGame";
import { JugsGame } from "@/games/jugs/JugsGame";
import { generateJugs } from "@/games/jugs/logic";
import { LightsGame } from "@/games/lights/LightsGame";
import { generateLights } from "@/games/lights/logic";
import { NonogramGame } from "@/games/nonogram/NonogramGame";
import { generateNonogram } from "@/games/nonogram/logic";
import { RobotGame } from "@/games/robot/RobotGame";
import { generateRobotLevel } from "@/games/robot/generate";
import { DailySituation } from "@/games/situation/SituationGame";
import { theme } from "@/games/situation/data";
import { SprintGame } from "@/games/sprint/SprintGame";
import { dayKey, elapsedSince, formatTime, shiftDay } from "@/lib/date";
import { starsFor } from "@/lib/rank";
import { rngFrom } from "@/lib/rng";
import { levelHistory, useHydrated, useProgress, type DailyResult, type DailyStage } from "@/lib/store";

const SITE = "https://brain-dojo.yok016.dev";

const starText = (n: number) => "★".repeat(n) + "☆".repeat(3 - n);

function shareText(date: string, r: DailyResult, name: string) {
  const lines = r.stages
    ? r.stages.map((st) => `${st.label}: ${starText(st.stars)} ${st.detail}`)
    : [
        // days played before games were randomised
        `⚡ Speed Math: ${r.sprintScore} pts`,
        `💡 Lights Out: ${r.lightsMoves} moves`,
        `🫙 Water Jugs: ${r.jugsMoves} moves`,
      ];
  const origin = typeof window === "undefined" ? SITE : window.location.origin;
  return [
    name ? `⚔️ ${name} ชวนคุณมาประลองการแก้ปัญหา!` : "⚔️ มาประลองการแก้ปัญหากัน!",
    "",
    `🧠 Brain Dojo · Daily ${date}${r.played ? ` · Lv${r.played}${r.played > (r.level ?? r.played) ? " 👹" : ""}` : ""}${name ? ` · ${name}` : ""}`,
    ...lines,
    `⏱ ${formatTime(r.timeMs)} · 💡hint ${r.hints}`,
    "",
    r.stages?.[0]?.kind === "hunt"
      ? "วันล่าดาว — เก็บดาวได้เร็วกว่านี้ไหม? 🏴‍☠️"
      : "คนที่อยู่เลเวลเดียวกันได้โจทย์ชุดเดียวกัน — ทำได้ดีกว่าไหม? 🏴‍☠️",
    `👉 ${origin}/daily`,
  ].join("\n");
}

function ShareBox({ date, r }: { date: string; r: DailyResult }) {
  const name = useProgress((s) => s.name);
  const level = useProgress((s) => s.dailyLevel ?? START_LEVEL);
  const [copied, setCopied] = useState(false);
  const text = shareText(date, r, name);
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ text });
      else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
      }
    } catch {
      /* user cancelled the share sheet */
    }
  };
  return (
    <div className="card speedlines p-5 text-center">
      <p className="font-display text-3xl text-pink glow-text">Daily Clear!</p>
      <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-ink/5 p-3 text-left font-sans text-sm">{text}</pre>
      <button className="btn btn-primary mt-4 w-full" onClick={share}>
        {copied ? "คัดลอกแล้ว ✔" : "📤 ส่งผลไปท้าเพื่อน"}
      </button>
      <p className="mt-3 font-display text-sm font-bold">
        ⚔️ เลเวล Daily ตอนนี้: Lv{level} · {DAILY_LEVELS[level].name}
      </p>
      <p className="mt-1 text-xs text-muted">
        {isHuntDay(shiftDay(date, 1)) ? "พรุ่งนี้วันล่าดาว ⭐ เตรียมตัวไว้!" : isBossDay(shiftDay(date, 1)) ? "พรุ่งนี้วันบอส 👹 โจทย์ยากขึ้น 1 ขั้น!" : "พรุ่งนี้สุ่มเกมชุดใหม่"}
      </p>
    </div>
  );
}

type Done = (stars: number, detail: string) => void;
type StageProps<K extends DailyStageWithSeed["kind"]> = {
  st: Extract<DailyStageWithSeed, { kind: K }>;
  session: Session;
  onDone: Done;
};

function LightsStage({ st, session, onDone }: StageProps<"lights">) {
  const puzzle = useMemo(() => generateLights(rngFrom(st.seed), st.size, st.minPar), [st]);
  return (
    <LightsGame
      puzzle={puzzle}
      session={session}
      onSolved={({ moves, par }) => onDone(starsFor(moves, par!, session.hints), `${moves} moves`)}
    />
  );
}

function JugsStage({ st, session, onDone }: StageProps<"jugs">) {
  const puzzle = useMemo(() => generateJugs(rngFrom(st.seed), st.variant), [st]);
  return (
    <JugsGame
      puzzle={puzzle}
      session={session}
      onSolved={({ moves, par }) => onDone(starsFor(moves, par!, session.hints), `${moves} moves`)}
    />
  );
}

function NonogramStage({ st, session, onDone }: StageProps<"nonogram">) {
  const puzzle = useMemo(() => generateNonogram(rngFrom(st.seed), st.size), [st]);
  return (
    <NonogramGame
      puzzle={puzzle}
      session={session}
      onSolved={() => onDone(Math.max(1, 3 - session.hints), formatTime(elapsedSince(session.startedAt)))}
    />
  );
}

function RobotStage({ st, onDone }: StageProps<"robot">) {
  const level = useMemo(() => generateRobotLevel(st.tier, st.seed, st.opts), [st]);
  return <RobotGame level={level} onWin={({ stars, steps }) => onDone(stars, `${steps} steps`)} />;
}

/** One daily game with its fixed puzzle; reports stars + a short summary when cleared. */
function StagePlayer({ st, session, onDone }: { st: DailyStageWithSeed; session: Session; onDone: Done }) {
  switch (st.kind) {
    case "sprint":
      return (
        <SprintGame
          seed={String(st.seed)}
          durationSec={st.seconds}
          onDone={(r) => onDone(sprintDailyStars(r.score, st.stars), `${r.score} pts`)}
        />
      );
    case "lights":
      return <LightsStage st={st} session={session} onDone={onDone} />;
    case "jugs":
      return <JugsStage st={st} session={session} onDone={onDone} />;
    case "nonogram":
      return <NonogramStage st={st} session={session} onDone={onDone} />;
    case "hanoi":
      return (
        <HanoiGame
          disks={st.disks}
          session={session}
          onSolved={({ moves }) => onDone(starsFor(moves, 2 ** st.disks - 1, session.hints), `${moves} moves`)}
        />
      );
    case "situation":
      return <DailySituation th={theme(st.theme)!} seed={st.seed} pick={st.pick} onFinish={({ stars, detail }) => onDone(stars, detail)} />;
    case "robot":
      return <RobotStage st={st} session={session} onDone={onDone} />;
  }
}

/** "Lv3 · ต้นหน", plus the boss-day bump on Saturdays. */
function LevelBadge({ level, played }: { level: number; played: number }) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <span className="rounded-xl border-[2.5px] border-ink bg-yellow px-2.5 py-1 font-display text-sm font-extrabold shadow-[2px_2px_0_#1e2a3a]">
        ⚔️ Lv{played} · {DAILY_LEVELS[played].name}
      </span>
      {played > level && (
        <span className="rounded-xl border-[2.5px] border-ink bg-pink px-2.5 py-1 font-display text-sm font-extrabold text-white shadow-[2px_2px_0_#1e2a3a]">
          👹 วันบอส +1
        </span>
      )}
    </div>
  );
}

function DailyRun({ date }: { date: string }) {
  // Fixed for the whole run: the level only moves after this Daily is recorded.
  const [level] = useState(() => useProgress.getState().dailyLevel ?? START_LEVEL);
  const played = playLevel(level, date);
  const strong = useProgress((s) => strongRunsAt(level, levelHistory(s.daily)));
  const plan = useMemo(() => dailyPlan(date, played), [date, played]);
  const [stage, setStage] = useState(-1);
  const [results, setResults] = useState<DailyStage[]>([]);
  const [started, setStarted] = useState({ at: 0, hintBase: 0 });
  const session = useSession();
  const recordDaily = useProgress((s) => s.recordDaily);

  if (stage === -1) {
    return (
      <div className="card speedlines p-6">
        <LevelBadge level={level} played={played} />
        <p className="font-display text-xl">ภารกิจวันนี้ {DAILY_STAGES} ด่าน</p>
        <p className="text-sm text-muted">สุ่มเกมใหม่ทุกวัน — วันนี้ได้:</p>
        <ol className="mt-3 space-y-2">
          {plan.map((st, i) => (
            <li key={st.kind} className="flex items-center gap-3 rounded-xl bg-ink/5 px-3 py-2">
              <span className="font-display text-pink">{i + 1}</span>
              <span className="text-xl">{st.emoji}</span>
              {st.label}
            </li>
          ))}
        </ol>
        <p className="mt-3 text-sm text-muted">
          จับเวลารวมทุกด่าน · เล่นได้ครั้งเดียวต่อวัน · ออกกลางคันต้องเริ่มใหม่ · เล่นจบ = ⚔️ วันติด +1
        </p>
        <p className="mt-2 rounded-xl bg-ink/5 px-3 py-2 text-xs leading-relaxed text-muted">
          {isBossDay(date) && "👹 เสาร์คือวันบอส โจทย์ยากขึ้น 1 ขั้น · "}
          {level < 5
            ? `🔼 เลื่อนขั้น: ได้ 8★ ขึ้นไปโดยไม่ใช้คำใบ้ 3 วันติด (ตอนนี้ ${strong}/3)`
            : "🏆 เลเวลสูงสุดแล้ว รักษาไว้ให้ได้!"}
          {" · ได้ดาวน้อยหรือใช้คำใบ้เยอะ 2 วันติด เลเวลลด 1 ขั้น"}
        </p>
        <button
          className="btn btn-primary mt-5 w-full text-lg"
          onClick={() => {
            // Hints are counted across every game kind, so diff the global counter at the end.
            setStarted({ at: Date.now(), hintBase: useProgress.getState().hintsUsed });
            session.restart();
            setStage(0);
          }}
        >
          START!
        </button>
      </div>
    );
  }

  const st = plan[stage];
  const finishStage: Done = (stars, detail) => {
    const next = [...results, { kind: st.kind, label: `${st.emoji} ${st.label}`, stars, detail, ms: elapsedSince(session.startedAt) }];
    setResults(next);
    if (stage + 1 < plan.length) {
      setTimeout(() => {
        session.restart();
        setStage(stage + 1);
        window.scrollTo({ top: 0 });
      }, 600);
    } else {
      recordDaily(date, {
        timeMs: elapsedSince(started.at),
        hints: useProgress.getState().hintsUsed - started.hintBase,
        stages: next,
        level,
        played,
      });
    }
  };

  return (
    <>
      <div className="mb-4 flex gap-1.5">
        {plan.map((p, i) => (
          <div key={p.kind} className={`h-1.5 flex-1 rounded-full ${i <= stage ? "bg-pink" : "bg-ink/10"}`} />
        ))}
      </div>
      <p className="mb-3 font-display text-lg">
        ด่าน {stage + 1}/{plan.length}: {st.emoji} {st.label}{" "}
        <span className="text-sm text-muted">· Lv{played}</span>
      </p>
      <StagePlayer key={st.kind} st={st} session={session} onDone={finishStage} />
    </>
  );
}

function Daily() {
  const date = dayKey();
  const hydrated = useHydrated();
  const result = useProgress((s) => s.daily[date]);
  if (!hydrated) return null;
  if (result) return <ShareBox date={date} r={result} />;
  return isHuntDay(date) ? <HuntBoard /> : <DailyRun date={date} />;
}

export default function DailyPage() {
  return (
    <>
      <BackHeader title="📅 Daily Quest" sub="ภารกิจประจำวัน · สุ่มเกมทุกวัน" right={<CoinChip />} />
      <ClientOnly>
        <Daily />
      </ClientOnly>
    </>
  );
}
