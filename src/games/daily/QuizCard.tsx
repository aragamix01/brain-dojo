"use client";

import { useEffect, useRef, useState } from "react";
import { useNow } from "@/components/ui";
import { GEMS } from "../lock/logic";
import { EXIT_ROW, SIZE as HARBOR_SIZE, cellsOf, type Boat } from "../harbor/logic";
import { QUIZ_SECONDS, ROBOT_GRID, ROBOT_START, type Quiz, type RobotOp } from "./quiz";

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

const BOAT_COLORS = ["#ffc93c", "#2ec4b6", "#4d8dff", "#a78bfa", "#ff9f43", "#8bd17c", "#f78fb3", "#7ed6df"];
const OP_ICON: Record<RobotOp, string> = { F: "↑", L: "↺", R: "↻" };

function RobotArt() {
  return (
    <div className="mx-auto grid w-fit grid-cols-5 gap-0.5">
      {Array.from({ length: ROBOT_GRID * ROBOT_GRID }, (_, i) => (
        <span
          key={i}
          className="flex h-8 w-8 items-center justify-center rounded bg-[#4d8dff]/70 font-display text-white"
        >
          {i === ROBOT_START ? <span className="text-base">▲</span> : <span className="text-[10px] opacity-80">{i + 1}</span>}
        </span>
      ))}
    </div>
  );
}

function JugsArt({ caps, state }: { caps: [number, number]; state: [number, number] }) {
  return (
    <div className="flex items-end justify-center gap-6">
      {caps.map((cap, j) => (
        <div key={j} className="flex flex-col items-center gap-1">
          <div
            className="flex w-12 flex-col-reverse overflow-hidden rounded-b-lg border-[3px] border-ink"
            style={{ height: cap * 12 }}
          >
            <div className="bg-[#41b8ff]" style={{ height: state[j] * 12 - 3 }} />
          </div>
          <span className="font-display text-sm">
            {"AB"[j]} · มี {state[j]} จุ {cap}
          </span>
        </div>
      ))}
    </div>
  );
}

const gems = (code: number[]) => code.map((c) => GEMS[c]).join(" ");

function LockArt({ secret, guess }: { secret: number[]; guess: number[] }) {
  return (
    <div className="mx-auto w-fit space-y-1 text-sm">
      <p className="flex items-center gap-3 rounded-lg bg-good/10 px-3 py-1">
        <span className="w-16 text-muted">รหัสจริง</span>
        <span className="text-xl">{gems(secret)}</span>
      </p>
      <p className="flex items-center gap-3 rounded-lg bg-ink/5 px-3 py-1">
        <span className="w-16 text-muted">เดาว่า</span>
        <span className="text-xl">{gems(guess)}</span>
      </p>
      <p className="text-center text-[11px] text-muted">● ถูกอัญมณีและถูกที่ · ○ มีอัญมณีนี้แต่ผิดที่</p>
    </div>
  );
}

function HarborArt({ boats, pos }: { boats: Boat[]; pos: number[] }) {
  const owner = Array<number>(HARBOR_SIZE * HARBOR_SIZE).fill(-1);
  boats.forEach((b, i) => cellsOf(b, pos[i]).forEach((c) => (owner[c] = i)));
  return (
    <div className="mx-auto flex w-fit items-center">
      <div className="grid grid-cols-6 gap-0.5 rounded-lg border-[3px] border-ink bg-[#bfe8ff] p-0.5">
        {owner.map((o, c) => (
          <span
            key={c}
            style={o > 0 ? { background: BOAT_COLORS[(o - 1) % BOAT_COLORS.length] } : undefined}
            className={`flex h-7 w-7 items-center justify-center rounded font-display text-xs ${
              o === 0 ? "bg-[#ff5a5f] text-white" : ""
            }`}
          >
            {o === 0 ? "🚢" : o > 0 ? o : ""}
          </span>
        ))}
      </div>
      <span className="ml-1 font-display text-lg" style={{ transform: `translateY(${(EXIT_ROW - 2.5) * 30}px)` }}>
        ⇨
      </span>
    </div>
  );
}

function question(q: Quiz): { text: string; art: React.ReactNode; unit?: string } {
  switch (q.kind) {
    case "hanoi":
      return {
        text: "ย้ายทั้งหอไปเสา C ให้น้อยครั้งที่สุด — ตาต่อไปต้องย้ายแผ่นเลขอะไร?",
        art: <HanoiArt pegs={q.pegs} />,
      };
    case "lights":
      return {
        text: "กดดวงที่ 👆 (ดวงนั้นกับดวงข้างๆ บนล่างซ้ายขวาจะสลับ) — แล้วจะมีไฟติดกี่ดวง?",
        art: (
          <div className="flex justify-center">
            <MiniLights grid={q.grid} mark={q.press} />
          </div>
        ),
        unit: "ดวง",
      };
    case "sudoku":
      return {
        text: "เลข 1–4 ห้ามซ้ำในแถว คอลัมน์ และกล่อง — ช่อง ? ต้องเป็นเลขอะไร?",
        art: <SudokuArt grid={q.grid} cell={q.cell} />,
      };
    case "nonogram":
      return {
        text: `แถวนี้มีเลข ${q.clue.join(" ")} — พิมพ์เลขช่องที่ต้องระบายแน่ๆ มาสัก 1 ช่อง`,
        art: <NonogramArt clue={q.clue} length={q.length} />,
      };
    case "robot":
      return {
        text: `หุ่น ▲ หันขึ้น ทำซ้ำ ${q.times} รอบ: ${q.block.map((o) => OP_ICON[o]).join(" ")} — หยุดที่ช่องเลขอะไร?`,
        art: <RobotArt />,
      };
    case "jugs":
      return {
        text: "เท A ลง B จนกว่า B จะเต็ม — A เหลือน้ำเท่าไหร่?",
        art: <JugsArt caps={q.caps} state={q.state} />,
      };
    case "lock":
      return { text: "ถ้าเดาแบบนี้ จะได้ ○ (มีแต่ผิดที่) กี่อัน?", art: <LockArt secret={q.secret} guess={q.guess} />, unit: "อัน" };
    case "harbor":
      return { text: "เรือ 🚢 ต้องแล่นออกทาง ⇨ — เรือเลขอะไรขวางทางอยู่?", art: <HarborArt boats={q.boats} pos={q.pos} /> };
    case "series":
      return {
        text: "เลขถัดไปคืออะไร?",
        art: <p className="text-center font-display text-2xl">{q.terms.join(", ")}, ?</p>,
      };
    case "situation":
      return {
        text: `${q.long.emoji} ${q.long.name}: ลงมือ ${q.long.active} นาที แล้วปล่อยไว้เองอีก ${q.long.wait} นาที · ${q.short.emoji} ${q.short.name}: ต้องทำเอง ${q.short.active} นาที — ทำเสร็จทั้งสองอย่างเร็วสุดกี่นาที?`,
        art: null,
        unit: "นาที",
      };
  }
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"];

/**
 * The bonus question between Daily stages, answered by typing a number. A wrong answer, running out
 * of time, or leaving the app all count as a miss. The player only hears "bonus"; the reason for it
 * stays with the uncle.
 */
export function QuizCard({ quiz, onDone }: { quiz: Quiz; onDone: (r: QuizResult) => void }) {
  const [startedAt] = useState(() => Date.now());
  const [typed, setTyped] = useState("");
  const [result, setResult] = useState<{ ok: boolean; timeout: boolean } | null>(null);
  const now = useNow(250, !result);
  const left = Math.max(0, QUIZ_SECONDS - (now - startedAt) / 1000);
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  });

  const finish = (value: number | null) => {
    if (result) return;
    const ok = value !== null && quiz.answers.includes(value);
    setResult({ ok, timeout: value === null });
    const ms = Date.now() - startedAt;
    setTimeout(() => doneRef.current({ ok, ms }), ok ? 800 : 2200);
  };
  const finishRef = useRef(finish);
  useEffect(() => {
    finishRef.current = finish;
  });

  useEffect(() => {
    if (left <= 0) finishRef.current(null);
  }, [left]);

  useEffect(() => {
    const leave = () => finishRef.current(null);
    const visibility = () => document.hidden && leave();
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("blur", leave);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("blur", leave);
    };
  }, []);

  const press = (k: string) => {
    if (result) return;
    if (k === "⌫") setTyped((t) => t.slice(0, -1));
    else if (k === "✓") {
      if (typed) finish(Number(typed));
    }
    else setTyped((t) => (t.length < 3 ? (t === "0" ? k : t + k) : t));
  };

  const { text, art, unit } = question(quiz);
  const answerText = quiz.answers.length > 1 ? `${quiz.answers.join(", ")} (อันไหนก็ได้)` : String(quiz.answers[0]);
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
      {art && <div className="my-4">{art}</div>}
      <p
        className="mx-auto mt-3 flex h-12 w-36 items-center justify-center rounded-xl border-[2.5px] border-ink font-display text-2xl"
        style={result ? { background: result.ok ? "#b6ecd0" : "#f8c4c6" } : undefined}
      >
        {typed || <span className="text-muted">?</span>}
        {typed && unit && <span className="ml-1 text-sm">{unit}</span>}
      </p>
      {result ? (
        <p className={`mt-3 text-center font-display ${result.ok ? "text-good" : "text-bad"}`}>
          {result.ok ? "✔ ถูกต้อง!" : `${result.timeout ? "⏱ หมดเวลา" : "✗ ยังไม่ใช่"} — คำตอบคือ ${answerText}`}
        </p>
      ) : (
        <div className="mx-auto mt-3 grid max-w-60 grid-cols-3 gap-1.5">
          {KEYS.map((k) => (
            <button
              key={k}
              className={`btn !min-h-10 font-display text-lg ${k === "✓" ? "btn-primary" : "btn-ghost"}`}
              disabled={k === "✓" && !typed}
              onClick={() => press(k)}
            >
              {k}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
