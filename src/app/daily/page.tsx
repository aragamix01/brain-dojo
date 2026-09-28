"use client";

import { useMemo, useState } from "react";
import { useSession } from "@/components/game";
import { BackHeader, ClientOnly } from "@/components/ui";
import { JugsGame } from "@/games/jugs/JugsGame";
import { generateJugs } from "@/games/jugs/logic";
import { LightsGame } from "@/games/lights/LightsGame";
import { generateLights } from "@/games/lights/logic";
import { SprintGame } from "@/games/sprint/SprintGame";
import { dayKey, elapsedSince, formatTime } from "@/lib/date";
import { rngFrom } from "@/lib/rng";
import { useHydrated, useProgress, type DailyResult } from "@/lib/store";

const STAGES = ["⚡ Speed Math 45s", "💡 Lights Out 5×5", "🫙 Water Jugs"];

function shareText(date: string, r: DailyResult, name: string) {
  return [
    `🧠 Brain Dojo · Daily ${date}${name ? ` · ${name}` : ""}`,
    `⚡ Speed Math: ${r.sprintScore} pts`,
    `💡 Lights Out: ${r.lightsMoves} moves`,
    `🫙 Water Jugs: ${r.jugsMoves} moves`,
    `⏱ ${formatTime(r.timeMs)} · 💡hint ${r.hints}`,
  ].join("\n");
}

function ShareBox({ date, r }: { date: string; r: DailyResult }) {
  const name = useProgress((s) => s.name);
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
      <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-black/30 p-3 text-left font-sans text-sm">{text}</pre>
      <button className="btn btn-primary mt-4 w-full" onClick={share}>
        {copied ? "คัดลอกแล้ว ✔" : "📤 ส่งผลไปท้าน้า"}
      </button>
      <p className="mt-3 text-xs text-muted">โจทย์ใหม่มาทุกเที่ยงคืน · ทุกคนได้โจทย์ชุดเดียวกัน</p>
    </div>
  );
}

function DailyRun({ date }: { date: string }) {
  const lights = useMemo(() => generateLights(rngFrom(`daily-${date}-lights`), 5), [date]);
  const jugs = useMemo(() => generateJugs(rngFrom(`daily-${date}-jugs`), "two"), [date]);
  const [stage, setStage] = useState(-1);
  const [acc, setAcc] = useState({ sprintScore: 0, lightsMoves: 0, hints: 0 });
  const [startedAt, setStartedAt] = useState(0);
  const session = useSession();
  const recordDaily = useProgress((s) => s.recordDaily);

  if (stage === -1) {
    return (
      <div className="card speedlines p-6">
        <p className="font-display text-xl">ภารกิจวันนี้ 3 ด่าน</p>
        <ol className="mt-3 space-y-2">
          {STAGES.map((s, i) => (
            <li key={s} className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2">
              <span className="font-display text-pink">{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>
        <p className="mt-3 text-sm text-muted">จับเวลารวมทั้ง 3 ด่าน · เล่นได้ครั้งเดียวต่อวัน · ออกกลางคันต้องเริ่มใหม่</p>
        <button
          className="btn btn-primary mt-5 w-full text-lg"
          onClick={() => {
            setStartedAt(Date.now());
            session.restart();
            setStage(0);
          }}
        >
          START!
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex gap-1.5">
        {STAGES.map((s, i) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= stage ? "bg-pink" : "bg-white/10"}`} />
        ))}
      </div>
      <p className="mb-3 font-display text-lg">
        ด่าน {stage + 1}: {STAGES[stage]}
      </p>
      {stage === 0 && (
        <SprintGame
          seed={`daily-${date}-sprint`}
          durationSec={45}
          onDone={(r) => {
            setAcc((a) => ({ ...a, sprintScore: r.score }));
            session.restart();
            setStage(1);
          }}
        />
      )}
      {stage === 1 && (
        <LightsGame
          puzzle={lights}
          session={session}
          onSolved={({ moves }) => {
            setAcc((a) => ({ ...a, lightsMoves: moves, hints: a.hints + session.hints }));
            setTimeout(() => {
              session.restart();
              setStage(2);
            }, 500);
          }}
        />
      )}
      {stage === 2 && (
        <JugsGame
          puzzle={jugs}
          session={session}
          onSolved={({ moves }) => {
            recordDaily(date, {
              ...acc,
              jugsMoves: moves,
              timeMs: elapsedSince(startedAt),
              hints: acc.hints + session.hints,
            });
          }}
        />
      )}
    </>
  );
}

function Daily() {
  const date = dayKey();
  const hydrated = useHydrated();
  const result = useProgress((s) => s.daily[date]);
  if (!hydrated) return null;
  return result ? <ShareBox date={date} r={result} /> : <DailyRun date={date} />;
}

export default function DailyPage() {
  return (
    <>
      <BackHeader title="📅 Daily Quest" sub="ภารกิจประจำวัน" />
      <ClientOnly>
        <Daily />
      </ClientOnly>
    </>
  );
}
