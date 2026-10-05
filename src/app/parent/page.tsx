"use client";

import { useState } from "react";
import { CodeDisplay } from "@/components/TimeCodeBox";
import { BackHeader, ClientOnly } from "@/components/ui";
import { MAX_MINUTES, UNIT_MIN, formatMinutes } from "@/lib/kidtimer/reward";

const QUICK = [15, 30, 60, 120];
const LOG_KEY = "kidtimer-parent-log";

type Issued = { code: string; minutes: number; at: number; note: string };

function readLog(): Issued[] {
  try {
    return JSON.parse(localStorage.getItem(LOG_KEY) ?? "[]");
  } catch {
    return [];
  }
}

/** Parent-only: make a PC time code for any amount of time. The server checks the password. */
function ParentCodes() {
  const [password, setPassword] = useState("");
  const [minutes, setMinutes] = useState(60);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [log, setLog] = useState<Issued[]>(readLog);
  const last = log[0];

  const make = async () => {
    // Serials are per minute: a second code in the same minute would be refused by the PC.
    if (last && Math.floor(last.at / 60_000) === Math.floor(Date.now() / 60_000)) {
      setErr("เพิ่งสร้างโค้ดไปในนาทีนี้ — รอให้ขึ้นนาทีใหม่ก่อน แล้วค่อยกดอีกครั้ง");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/parent-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, minutes }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(
          data.error === "wrong-password"
            ? "รหัสผ่านไม่ถูก"
            : data.error === "not-configured"
              ? "ยังไม่ได้ตั้งค่า KIDTIMER_KEY / PARENT_PASSWORD บน Vercel"
              : "สร้างโค้ดไม่สำเร็จ",
        );
        return;
      }
      const next = [{ code: data.code, minutes: data.minutes, at: data.at, note: note.trim() }, ...log].slice(0, 20);
      setLog(next);
      setNote("");
      try {
        localStorage.setItem(LOG_KEY, JSON.stringify(next));
      } catch {
        /* the log is a convenience */
      }
    } catch {
      setErr("ต่อเน็ตไม่ได้ ลองใหม่อีกครั้ง");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="card space-y-3 p-4">
        <label className="block">
          <span className="text-sm text-muted">รหัสผ่านผู้ปกครอง</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="mt-1 w-full rounded-lg bg-ink/5 px-3 py-2 outline-none focus:ring-2 focus:ring-pink"
          />
        </label>
        <div>
          <span className="text-sm text-muted">เวลา (ทีละ {UNIT_MIN} นาที)</span>
          <div className="mt-1 flex flex-wrap gap-2">
            {QUICK.map((m) => (
              <button
                key={m}
                className={`btn !min-h-9 text-sm ${minutes === m ? "btn-gold" : "btn-ghost"}`}
                onClick={() => setMinutes(m)}
              >
                {formatMinutes(m)}
              </button>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <button className="btn btn-ghost !min-h-9 w-10 text-lg" onClick={() => setMinutes(Math.max(UNIT_MIN, minutes - UNIT_MIN))}>
              −
            </button>
            <span className="flex-1 text-center font-display text-lg font-bold">{formatMinutes(minutes)}</span>
            <button
              className="btn btn-ghost !min-h-9 w-10 text-lg"
              onClick={() => setMinutes(Math.min(MAX_MINUTES, minutes + UNIT_MIN))}
            >
              +
            </button>
          </div>
        </div>
        <label className="block">
          <span className="text-sm text-muted">โน้ต (เก็บไว้ในเครื่องนี้เท่านั้น)</span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="เช่น ช่วยงานบ้าน"
            className="mt-1 w-full rounded-lg bg-ink/5 px-3 py-2 outline-none focus:ring-2 focus:ring-pink"
          />
        </label>
        <button className="btn btn-primary w-full" disabled={busy || !password} onClick={make}>
          {busy ? "กำลังสร้าง…" : `🔑 สร้างโค้ด ${formatMinutes(minutes)}`}
        </button>
        {err && <p className="text-sm text-bad">{err}</p>}
      </div>

      {last && (
        <div className="card p-4 text-center">
          <CodeDisplay code={last.code} minutes={last.minutes} />
          {last.note && <p className="mt-2 text-xs text-muted">{last.note}</p>}
        </div>
      )}

      {log.length > 1 && (
        <div className="card p-4">
          <p className="font-display">ที่สร้างไปแล้ว (เครื่องนี้)</p>
          <ul className="mt-2 space-y-1.5 text-sm">
            {log.slice(1).map((c) => (
              <li key={c.at} className="flex items-center justify-between gap-2 rounded-xl bg-ink/5 px-3 py-2">
                <span className="text-xs text-muted">{new Date(c.at).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })}</span>
                <span className="select-all font-mono font-bold">{c.code}</span>
                <span className="text-xs">{formatMinutes(c.minutes)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-center text-xs text-muted">
        โค้ดใช้ที่คอมได้ครั้งเดียว · โค้ดหายก็สร้างใหม่ได้ · สร้างได้นาทีละโค้ด
      </p>
    </div>
  );
}

export default function ParentPage() {
  return (
    <>
      <BackHeader title="👨 Parent" sub="สร้างโค้ดเวลาคอม (KidTimer)" />
      <ClientOnly>
        <ParentCodes />
      </ClientOnly>
    </>
  );
}
