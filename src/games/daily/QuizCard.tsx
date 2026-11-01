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

const LETTERS = "ABCDEFGHIJKL";
const BOAT_COLORS = ["#ffc93c", "#2ec4b6", "#4d8dff", "#a78bfa", "#ff9f43", "#8bd17c", "#f78fb3", "#7ed6df"];
const OP_ICON: Record<RobotOp, string> = { F: "↑", L: "↺", R: "↻" };

function RobotArt({ marks }: { marks: number[] }) {
  return (
    <div className="mx-auto grid w-fit grid-cols-5 gap-0.5">
      {Array.from({ length: ROBOT_GRID * ROBOT_GRID }, (_, i) => (
        <span key={i} className="flex h-8 w-8 items-center justify-center rounded bg-[#4d8dff]/70 font-display text-sm text-white">
          {i === ROBOT_START ? "▲" : marks.includes(i) ? LETTERS[marks.indexOf(i)] : ""}
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
          <div className="flex w-12 flex-col-reverse overflow-hidden rounded-b-lg border-[3px] border-ink" style={{ height: cap * 12 }}>
            <div className="bg-[#41b8ff]" style={{ height: state[j] * 12 - 3 }} />
          </div>
          <span className="font-display text-sm">
            {"AB"[j]} · {state[j]}/{cap}
          </span>
        </div>
      ))}
    </div>
  );
}

const gems = (code: number[]) => code.map((c) => GEMS[c]).join(" ");

function LockArt({ history }: { history: { guess: number[]; fb: { exact: number; near: number } }[] }) {
  return (
    <div className="mx-auto w-fit space-y-1">
      {history.map((h, i) => (
        <p key={i} className="flex items-center gap-3 rounded-lg bg-ink/5 px-3 py-1">
          <span className="text-xl">{gems(h.guess)}</span>
          <span className="font-mono text-sm">{"●".repeat(h.fb.exact) + "○".repeat(h.fb.near) || "—"}</span>
        </p>
      ))}
      <p className="text-center text-[11px] text-muted">● ถูกอัญมณีและถูกที่ · ○ มีแต่ผิดที่ · ไม่มีอัญมณีซ้ำ</p>
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
            {o === 0 ? "🚢" : o > 0 ? LETTERS[o - 1] : ""}
          </span>
        ))}
      </div>
      <span className="ml-1 font-display text-lg" style={{ transform: `translateY(${(EXIT_ROW - 2.5) * 30}px)` }}>
        ⇨
      </span>
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
    case "robot":
      return {
        text: `หุ่น ▲ หันขึ้น ทำซ้ำ ${q.times} ครั้ง: ${q.block.map((o) => OP_ICON[o]).join(" ")} — หยุดที่ช่องไหน?`,
        art: <RobotArt marks={q.options} />,
      };
    case "jugs":
      return {
        text: "เท A ลง B จนกว่า B จะเต็มหรือ A จะหมด — แล้วแต่ละเหยือกมีน้ำเท่าไหร่?",
        art: <JugsArt caps={q.caps} state={q.state} />,
      };
    case "lock":
      return { text: "จากที่เดาไปแล้ว รหัสไหนยังเป็นไปได้?", art: <LockArt history={q.history} /> };
    case "harbor":
      return { text: "เรือ 🚢 ต้องแล่นออกทาง ⇨ — เรือลำไหนขวางทางอยู่?", art: <HarborArt boats={q.boats} pos={q.pos} /> };
    case "series":
      return {
        text: "เลขถัดไปคืออะไร?",
        art: <p className="text-center font-display text-2xl">{q.terms.join(", ")}, ?</p>,
      };
    case "situation":
      return {
        text: `${q.long.emoji} ${q.long.name}: ลงมือ ${q.long.active} นาที แล้วรอเองอีก ${q.long.wait} นาที · ${q.short.emoji} ${q.short.name}: ต้องทำเอง ${q.short.active} นาที — ทำเสร็จทั้งสองอย่างเร็วสุดกี่นาที?`,
        art: null,
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
    case "robot":
      return `ช่อง ${LETTERS[i]}`;
    case "jugs":
      return `A มี ${q.options[i][0]} · B มี ${q.options[i][1]}`;
    case "lock":
      return <span className="text-xl">{gems(q.options[i])}</span>;
    case "harbor":
      return `เรือ ${LETTERS[q.options[i] - 1]}`;
    case "series":
      return q.options[i];
    case "situation":
      return `${q.options[i]} นาที`;
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
          // Inline: .btn styles sit outside the Tailwind layers and would win over utility classes.
          const style: React.CSSProperties = !picked
            ? {}
            : i === quiz.answer
              ? { background: "#b6ecd0", opacity: 1 }
              : i === picked.i
                ? { background: "#f8c4c6", opacity: 1 }
                : { opacity: 0.4 };
          return (
            <button
              key={i}
              className="btn btn-ghost flex justify-center py-2 font-display"
              style={style}
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
