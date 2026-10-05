"use client";

import { useEffect, useState } from "react";
import { formatMinutes } from "@/lib/kidtimer/reward";
import { useProgress, type DailyResult } from "@/lib/store";

/** Stars a finished Daily is worth for the PC reward; a Star Hunt counts as a full 9. */
export function rewardStars(r: DailyResult): number {
  if (r.stages?.[0]?.kind === "hunt") return 9;
  return (r.stages ?? []).reduce((a, st) => a + st.stars, 0);
}

/** Big, copyable code. */
export function CodeDisplay({ code, minutes }: { code: string; minutes: number }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <p className="font-display text-sm">⏰ เวลาคอม {formatMinutes(minutes)}</p>
      <p className="mt-1 select-all rounded-xl border-[2.5px] border-ink bg-white py-3 font-mono text-2xl font-bold tracking-wider">
        {code}
      </p>
      <button
        className="btn btn-cyan mt-2 w-full text-sm"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
          } catch {
            /* clipboard blocked: the code is selectable */
          }
        }}
      >
        {copied ? "คัดลอกแล้ว ✔" : "📋 คัดลอกโค้ด"}
      </button>
    </div>
  );
}

type State = { status: "loading" } | { status: "error"; reason: string };

/** After the Daily: fetch (once) and show today's PC time code. */
export function TimeCodeBox({ date, r }: { date: string; r: DailyResult }) {
  const saved = useProgress((s) => s.timeCodes?.[date]);
  const saveTimeCode = useProgress((s) => s.saveTimeCode);
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const stars = rewardStars(r);

  useEffect(() => {
    if (saved) return;
    let live = true;
    fetch("/api/reward", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date, stars }) })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!live) return;
        if (res.ok && data.code) saveTimeCode(date, { code: data.code, minutes: data.minutes, at: Date.now() });
        else setState({ status: "error", reason: data.error ?? "server" });
      })
      .catch(() => live && setState({ status: "error", reason: "offline" }));
    return () => {
      live = false;
    };
  }, [saved, date, stars, saveTimeCode, attempt]);

  return (
    <div className="mt-4 rounded-2xl border-[2.5px] border-dashed border-ink bg-yellow/40 p-4 text-center">
      <p className="font-display text-base font-extrabold">🎁 รางวัล: โค้ดเวลาคอม</p>
      {saved ? (
        <>
          <div className="mt-2">
            <CodeDisplay code={saved.code} minutes={saved.minutes} />
          </div>
          <p className="mt-2 text-xs text-muted">พิมพ์โค้ดนี้ที่คอม · ใช้ได้ครั้งเดียว · เปิดดูอีกได้ในหน้าแชร์ผลงาน</p>
        </>
      ) : state.status === "loading" ? (
        <p className="mt-2 text-sm text-muted">กำลังสร้างโค้ด…</p>
      ) : (
        <>
          <p className="mt-2 text-sm text-bad">
            {state.reason === "not-configured"
              ? "ยังสร้างโค้ดไม่ได้ — ให้น้าตั้งค่า KIDTIMER_KEY ก่อน"
              : state.reason === "bad-date"
                ? "Daily วันนี้หมดเวลารับโค้ดแล้ว"
                : "สร้างโค้ดไม่สำเร็จ ลองใหม่อีกครั้ง"}
          </p>
          {state.reason !== "bad-date" && (
            <button
              className="btn btn-ghost mt-2 text-sm"
              onClick={() => {
                setState({ status: "loading" });
                setAttempt(attempt + 1);
              }}
            >
              ↻ ลองใหม่
            </button>
          )}
        </>
      )}
    </div>
  );
}
