"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { HintButton, ResultModal, Toast, useSession } from "@/components/game";
import { elapsedSince, formatTime } from "@/lib/date";
import { useProgress } from "@/lib/store";
import {
  compact,
  initRun,
  parseBoard,
  parseProgram,
  step,
  type Cmd,
  type Color,
  type Op,
  type Program,
  type RobotLevel,
  type RunState,
} from "./engine";

const TILE: Record<Color, string> = { r: "#ff4d6d", g: "#3ddc97", b: "#4d7cff" };
const OP_ICON: Record<Exclude<Op, "C">, string> = { F: "↑", L: "↺", R: "↻" };
const DELAY = [420, 200, 90];

const FAIL_MSG: Partial<Record<RunState["status"], string>> = {
  fell: "💥 ตกขอบ! ลองดูว่าหุ่นเดินเลยไปตรงไหน",
  timeout: "🌀 วนไม่รู้จบ — เกิน 1500 steps แล้ว",
  overflow: "📚 Stack ล้น! เรียกฟังก์ชันซ้อนลึกเกินไป",
  ended: "🏁 โปรแกรมจบแล้ว แต่ยังเก็บดาวไม่ครบ",
};

function CmdIcon({ cmd }: { cmd: Cmd }) {
  return <>{cmd.op === "C" ? `F${cmd.fn! + 1}` : OP_ICON[cmd.op]}</>;
}

const emptyProgram = (level: RobotLevel): Program =>
  level.preset ? parseProgram(level.preset, level.funcs) : level.funcs.map((n) => Array(n).fill(null));

export function RobotGame({
  level,
  nextId,
  onNext,
  recordKey = `robot:${level.id}`,
  backHref = "/robot",
  backLabel,
  nextHref = nextId ? `/robot/${nextId}` : undefined,
  nextLabel,
}: {
  level: RobotLevel;
  nextId?: string;
  onNext?: () => void;
  recordKey?: string;
  backHref?: string;
  backLabel?: string;
  nextHref?: string;
  nextLabel?: string;
}) {
  const board = useMemo(() => parseBoard(level.board), [level]);
  const [program, setProgram] = useState<Program>(() => emptyProgram(level));
  const [run, setRun] = useState<RunState>(() => initRun(level, board));
  const runRef = useRef(run);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [sel, setSel] = useState<{ fn: number; slot: number } | null>({ fn: 0, slot: 0 });
  const [brush, setBrush] = useState<Color | null>(null);
  const [hintsShown, setHintsShown] = useState(0);
  const [result, setResult] = useState<{ stars: number; xp: number; ms: number } | null>(null);
  const session = useSession();
  const recordWin = useProgress((s) => s.recordWin);

  const used = program.flat().filter(Boolean).length;
  const totalSlots = level.funcs.reduce((a, b) => a + b, 0);
  const editable = !playing;

  const setRunState = (s: RunState) => {
    runRef.current = s;
    setRun(s);
  };

  const reset = () => {
    setPlaying(false);
    setRunState(initRun(level, board));
  };

  const advance = () => {
    const next = step(runRef.current, board, program, compact(program));
    setRunState(next);
    if (next.status === "running") return;
    setPlaying(false);
    if (next.status === "won") {
      const stars = Math.max(1, 3 - session.hints);
      const ms = elapsedSince(session.startedAt);
      const xp = recordWin(recordKey, { stars, timeMs: ms, xpBase: 20 });
      setTimeout(() => setResult({ stars, xp, ms }), 500);
    }
  };

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(advance, DELAY[speed]);
    return () => clearInterval(id);
    // advance closes over program/session, which can't change while playing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, speed]);

  const startOrPause = () => {
    if (playing) return setPlaying(false);
    if (run.status !== "ready" && run.status !== "running") setRunState(initRun(level, board));
    setSel(null);
    setPlaying(true);
  };

  const stepOnce = () => {
    if (run.status !== "ready" && run.status !== "running") setRunState(initRun(level, board));
    else advance();
  };

  const edit = (cmd: Cmd | null) => {
    if (!sel) return;
    setProgram((p) => p.map((f, i) => (i === sel.fn ? f.map((c, j) => (j === sel.slot ? cmd : c)) : f)));
    reset();
    if (cmd && sel.slot + 1 < level.funcs[sel.fn]) setSel({ fn: sel.fn, slot: sel.slot + 1 });
  };

  const pickOp = (op: Op, fn?: number) => edit({ op, fn, cond: brush });

  const pickColor = (c: Color | null) => {
    setBrush(c);
    const cur = sel && program[sel.fn][sel.slot];
    if (cur) {
      setProgram((p) =>
        p.map((f, i) => (i === sel.fn ? f.map((x, j) => (j === sel.slot ? { ...cur, cond: c } : x)) : f)),
      );
      reset();
    }
  };

  const failMsg = FAIL_MSG[run.status] ?? null;
  const cellPct = { w: 100 / board.w, h: 100 / board.h };
  const fell = run.status === "fell";

  return (
    <div>
      <p className="card mb-3 px-4 py-3 text-sm">
        <span className="mr-1">🤖</span>
        {level.intro}
      </p>

      {/* Board */}
      <div
        className="relative mx-auto"
        style={{ width: `min(100%, ${board.w * 46}px)`, aspectRatio: `${board.w} / ${board.h}` }}
      >
        <div
          className="absolute inset-0 grid"
          style={{ gridTemplateColumns: `repeat(${board.w}, 1fr)`, gridTemplateRows: `repeat(${board.h}, 1fr)` }}
        >
          {board.tiles.map((t, i) => (
            <div key={i} className="p-[2px]">
              {t && (
                <div
                  className="flex h-full w-full items-center justify-center rounded-md"
                  style={{ background: TILE[t], opacity: 0.85 }}
                >
                  {run.stars.includes(i) && (
                    <span className="animate-pop text-[min(5vw,22px)] leading-none text-yellow drop-shadow-[0_0_6px_rgba(0,0,0,0.6)]">
                      ★
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        <div
          className="pointer-events-none absolute flex items-center justify-center"
          style={{
            width: `${cellPct.w}%`,
            height: `${cellPct.h}%`,
            left: `${run.x * cellPct.w}%`,
            top: `${run.y * cellPct.h}%`,
            transition: `left ${DELAY[speed]}ms, top ${DELAY[speed]}ms, opacity 300ms`,
            opacity: fell ? 0.25 : 1,
          }}
        >
          <svg
            viewBox="0 0 40 40"
            className="h-[78%] w-[78%] drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
            style={{ transform: `rotate(${run.angle}deg)`, transition: `transform ${DELAY[speed]}ms` }}
          >
            <path d="M20 3 L35 33 L20 26 L5 33 Z" fill="#fff" stroke="#0d0b1f" strokeWidth="3" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      <div className="mt-2 flex justify-between text-xs text-muted">
        <span>
          ★ เหลือ {run.stars.length}/{board.stars.length}
        </span>
        <span>
          Steps {run.steps} · ใช้ {used}/{totalSlots} ช่อง
        </span>
      </div>
      <Toast msg={failMsg} />

      {/* Controls */}
      <div className="mt-3 flex gap-2">
        <button className="btn btn-primary flex-1" onClick={startOrPause} disabled={used === 0}>
          {playing ? "⏸ Pause" : "▶ Run"}
        </button>
        <button className="btn btn-ghost" onClick={stepOnce} disabled={playing || used === 0} aria-label="ทีละขั้น">
          ⏭
        </button>
        <button className="btn btn-ghost" onClick={reset} aria-label="รีเซ็ต">
          ⟲
        </button>
        <button className="btn btn-ghost w-14 font-mono text-sm" onClick={() => setSpeed((speed + 1) % DELAY.length)}>
          {["1x", "2x", "4x"][speed]}
        </button>
      </div>

      {/* Program */}
      <div className="card mt-4 space-y-2 p-3">
        <div className="flex items-center justify-between text-xs text-muted">
          <span>{level.preset ? "🐞 โปรแกรมนี้มีบั๊ก — หาให้เจอ" : "โปรแกรม"}</span>
          <button
            className="underline disabled:opacity-40"
            disabled={!editable}
            onClick={() => {
              setProgram(emptyProgram(level));
              reset();
            }}
          >
            {level.preset ? "คืนค่าเริ่มต้น" : "ล้างทั้งหมด"}
          </button>
        </div>
        {program.map((f, fi) => (
          <div key={fi} className="flex items-center gap-2">
            <span className="w-8 shrink-0 font-display text-sm text-pink">F{fi + 1}</span>
            <div className="flex flex-wrap gap-1.5">
              {f.map((c, si) => {
                const isSel = sel?.fn === fi && sel.slot === si;
                const isExec = run.cursor?.fn === fi && run.cursor.slot === si && run.status !== "ready";
                return (
                  <button
                    key={si}
                    disabled={!editable}
                    aria-label={`F${fi + 1} slot ${si + 1}`}
                    onClick={() => setSel(isSel ? null : { fn: fi, slot: si })}
                    className={`flex h-11 w-11 items-center justify-center rounded-lg border-2 font-display text-lg transition ${
                      isExec
                        ? run.skipped
                          ? "border-white/60"
                          : "scale-110 border-yellow"
                        : isSel
                          ? "border-cyan"
                          : "border-white/15"
                    }`}
                    style={{ background: c?.cond ? TILE[c.cond] : "rgba(255,255,255,0.06)" }}
                  >
                    {c ? <CmdIcon cmd={c} /> : ""}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Palette */}
      <div className={`mt-3 space-y-2 transition ${sel && editable ? "" : "pointer-events-none opacity-40"}`}>
        <div className="flex flex-wrap gap-1.5">
          {(["F", "L", "R"] as const).map((op) => (
            <button key={op} aria-label={`op ${op}`} className="btn btn-ghost !min-h-11 w-12 text-xl" onClick={() => pickOp(op)}>
              {OP_ICON[op]}
            </button>
          ))}
          {level.funcs.map((_, i) => (
            <button
              key={i}
              aria-label={`call F${i + 1}`}
              className="btn btn-ghost !min-h-11 w-12 text-sm text-pink"
              onClick={() => pickOp("C", i)}
            >
              F{i + 1}
            </button>
          ))}
          <button className="btn btn-ghost !min-h-11 w-12 text-sm text-muted" onClick={() => edit(null)}>
            ✕
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="mr-1 text-xs text-muted">ทำเมื่ออยู่บนสี:</span>
          {([null, "r", "g", "b"] as const).map((c) => (
            <button
              key={c ?? "none"}
              onClick={() => pickColor(c)}
              aria-label={c ? `เงื่อนไขสี ${c}` : "ไม่มีเงื่อนไข"}
              className={`h-9 w-9 rounded-lg border-2 text-xs ${brush === c ? "border-white" : "border-transparent"}`}
              style={{ background: c ? TILE[c] : "rgba(255,255,255,0.1)" }}
            >
              {c ? "" : "any"}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted">
          ↑ เดินหน้า · ↺ หมุนซ้าย · ↻ หมุนขวา · F1..F{level.funcs.length} เรียกฟังก์ชัน · สี = เงื่อนไข
        </p>
      </div>

      {/* Hints */}
      <div className="mt-4 space-y-2">
        {level.hints.slice(0, hintsShown).map((h, i) => (
          <p key={i} className="rounded-xl border border-cyan/40 bg-cyan/5 px-3 py-2 text-sm text-cyan">
            💡 {h}
          </p>
        ))}
        {hintsShown < level.hints.length && (
          <div className="flex justify-center">
            <HintButton
              startedAt={session.startedAt}
              onHint={() => {
                setHintsShown(hintsShown + 1);
                session.takeHint();
              }}
            />
          </div>
        )}
      </div>

      <ResultModal
        open={!!result}
        title="Mission Clear!"
        stars={result?.stars}
        xp={result?.xp}
        stats={[
          ["เวลา", result ? formatTime(result.ms) : ""],
          ["คำสั่งที่ใช้", `${used} / ${totalSlots}`],
        ]}
        onRetry={() => setResult(null)}
        retryLabel="ดูโปรแกรมอีกที"
        nextHref={nextHref}
        onNext={onNext}
        nextLabel={nextLabel ?? (onNext ? "🎲 ด่านสุ่มถัดไป" : undefined)}
        backHref={backHref}
        backLabel={backLabel}
      />
    </div>
  );
}
