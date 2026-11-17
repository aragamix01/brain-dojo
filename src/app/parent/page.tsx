"use client";

import { useEffect, useState } from "react";
import { QrScan } from "@/components/QrScan";
import { CodeDisplay } from "@/components/TimeCode";
import { BackHeader, ClientOnly } from "@/components/ui";
import { dayKey } from "@/lib/date";
import { claimDays, markPaid, readPaid, unpaidMinutes, CLAIM_DAYS, type ClaimDay } from "@/lib/kidtimer/claim";
import { MAX_MINUTES, UNIT_MIN, formatMinutes } from "@/lib/kidtimer/reward";
import { decodeProgress } from "@/lib/share";

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

const PIN_LEN = 6;
const LOCK_KEY = "kidtimer-pin-lock";
const MAX_TRIES = 5;

/** Seconds the pad stays locked after too many wrong PINs. */
function lockedFor(): number {
  try {
    const left = Number(localStorage.getItem(LOCK_KEY) ?? 0) - Date.now();
    return left > 0 ? Math.ceil(left / 1000) : 0;
  } catch {
    return 0;
  }
}

/** A few wrong PINs in a row lock the pad for a minute. */
function countWrongPin() {
  try {
    const tries = Number(sessionStorage.getItem(LOCK_KEY + ":tries") ?? 0) + 1;
    sessionStorage.setItem(LOCK_KEY + ":tries", String(tries));
    if (tries >= MAX_TRIES) {
      localStorage.setItem(LOCK_KEY, String(Date.now() + 60_000));
      sessionStorage.removeItem(LOCK_KEY + ":tries");
    }
  } catch {
    /* storage blocked: the server's slow wrong answers still apply */
  }
}

/** 6-digit PIN pad; the server checks it against PARENT_PASSWORD. */
function PinGate({ onOpen }: { onOpen: (pin: string) => void }) {
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  const check = async (full: string) => {
    const wait = lockedFor();
    if (wait) {
      setErr(`ใส่ผิดหลายครั้ง — รออีก ${wait} วินาที`);
      setPin("");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/parent-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: full }),
      });
      if (res.ok) return onOpen(full);
      const data = await res.json().catch(() => ({}));
      if (data.error === "not-configured") setErr("ยังไม่ได้ตั้งค่า KIDTIMER_KEY / PARENT_PASSWORD บน Vercel");
      else {
        countWrongPin();
        setErr("PIN ไม่ถูก");
        setShake(true);
        setTimeout(() => setShake(false), 300);
      }
    } catch {
      setErr("ต่อเน็ตไม่ได้ ลองใหม่อีกครั้ง");
    } finally {
      setBusy(false);
      setPin("");
    }
  };

  const press = (k: string) => {
    if (busy) return;
    if (k === "⌫") return setPin(pin.slice(0, -1));
    if (pin.length >= PIN_LEN) return;
    const next = pin + k;
    setPin(next);
    setErr(null);
    if (next.length === PIN_LEN) void check(next);
  };

  return (
    <div className="card mx-auto max-w-xs p-5 text-center">
      <p className="font-display text-lg">🔒 ใส่ PIN ผู้ปกครอง</p>
      <div className={`mt-4 flex justify-center gap-2 ${shake ? "animate-shake" : ""}`}>
        {Array.from({ length: PIN_LEN }, (_, i) => (
          <span
            key={i}
            className={`h-4 w-4 rounded-full border-[2.5px] border-ink ${i < pin.length ? "bg-ink" : "bg-white"}`}
          />
        ))}
      </div>
      <p className="mt-2 h-5 text-sm text-bad">{busy ? <span className="text-muted">กำลังตรวจ…</span> : err}</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map((k, i) =>
          k ? (
            <button
              key={i}
              onClick={() => press(k)}
              className="flex h-14 items-center justify-center rounded-xl border-[2.5px] border-ink bg-white font-display text-2xl font-bold shadow-[0_3px_0_#1e2a3a] active:translate-y-0.5"
            >
              {k}
            </button>
          ) : (
            <span key={i} />
          ),
        )}
      </div>
    </div>
  );
}

const shortDay = (d: string) => {
  const [y, m, dd] = d.split("-").map(Number);
  return new Date(y, m - 1, dd).toLocaleDateString("th-TH", { weekday: "short", day: "numeric", month: "short" });
};

/** The code in a link to this page (`/parent#v=…`), sent here from a received report. */
const linkCode = () => (location.hash.startsWith("#v=") ? location.hash.slice(3) : "");

type Claim = { name: string; days: ClaimDay[]; at?: number };

/**
 * The weekly hand-off: the player's report link / QR code → every Daily not yet paid → one code.
 * Paid days are remembered on this device, so the same report can't be cashed twice here.
 */
function Redeem({ issue }: { issue: (minutes: number, why: string) => Promise<Issued | string> }) {
  const [text, setText] = useState("");
  const [claim, setClaim] = useState<Claim | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [issued, setIssued] = useState<Issued | null>(null);

  const open = async (t: string) => {
    setText(t);
    setIssued(null);
    try {
      const d = await decodeProgress(t);
      if (!d.report || !d.rewards) throw new Error("นี่เป็นโค้ดสำรอง — ให้หลานกด 'ส่งลิงก์ผลงาน' หรือโชว์ QR แทน");
      setClaim({ name: d.name, days: claimDays(d.rewards, readPaid(), dayKey()), at: d.exportedAt });
      setErr(null);
    } catch (e) {
      setClaim(null);
      setErr((e as Error).message);
    }
  };
  // Arrived from the "แลกเป็นเวลาคอม" button on a received report.
  useEffect(() => {
    const code = linkCode();
    if (!code) return;
    history.replaceState(null, "", location.pathname);
    decodeProgress(code).then(
      (d) => {
        setText(code);
        if (d.report && d.rewards) setClaim({ name: d.name, days: claimDays(d.rewards, readPaid(), dayKey()), at: d.exportedAt });
      },
      (e: Error) => setErr(e.message),
    );
  }, []);

  const unpaid = claim ? claim.days.filter((d) => !d.paid) : [];
  const total = claim ? unpaidMinutes(claim.days) : 0;
  const pay = async () => {
    if (!claim || !total) return;
    setBusy(true);
    const range = `${shortDay(unpaid[0].day)} – ${shortDay(unpaid.at(-1)!.day)}`;
    const got = await issue(total, `Daily ${unpaid.length} วัน (${range})${claim.name ? ` · ${claim.name}` : ""}`);
    if (typeof got === "string") setErr(got);
    else {
      setIssued(got);
      const paid = markPaid(unpaid.map((d) => d.day));
      setClaim({ ...claim, days: claim.days.map((d) => ({ ...d, paid: d.day in paid })) });
    }
    setBusy(false);
  };

  return (
    <div className="card space-y-3 p-4">
      <div>
        <p className="font-display text-lg">🎁 แลกเวลาคอมจากผลงาน</p>
        <p className="text-xs text-muted">
          สแกน QR ที่หลานโชว์ เลือกรูป QR ที่ส่งมา หรือวางลิงก์ · รวมทุก Daily ที่ยังไม่ได้แลก ({CLAIM_DAYS} วันล่าสุด) เป็นโค้ดเดียว
        </p>
      </div>
      <QrScan onCode={open} />
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="หรือวางลิงก์ผลงานที่นี่"
          className="min-w-0 flex-1 rounded-lg bg-ink/5 px-3 py-2 font-mono text-xs outline-none focus:ring-2 focus:ring-pink"
        />
        <button className="btn btn-ghost !min-h-9 text-sm" disabled={!text.trim()} onClick={() => open(text)}>
          เปิด
        </button>
      </div>
      {err && <p className="text-sm text-bad">{err}</p>}
      {claim && (
        <div className="rounded-xl border-2 border-ink/20 p-3">
          <p className="font-display">
            {claim.name || "Player"}
            {claim.at && (
              <span className="ml-2 text-xs font-normal text-muted">ส่งเมื่อ {new Date(claim.at).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })}</span>
            )}
          </p>
          {claim.days.length ? (
            <ul className="mt-2 space-y-1 text-sm">
              {claim.days.map((d) => (
                <li key={d.day} className={`flex justify-between ${d.paid ? "text-muted line-through" : ""}`}>
                  <span>{shortDay(d.day)}</span>
                  <span>
                    {d.stars}★ · {formatMinutes(d.minutes)}
                    {d.paid && " · แลกแล้ว"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted">ไม่มี Daily ให้แลกในช่วงนี้</p>
          )}
          {total > 0 ? (
            <button className="btn btn-primary mt-3 w-full" disabled={busy} onClick={pay}>
              {busy ? "กำลังสร้าง…" : `🔑 สร้างโค้ด ${formatMinutes(total)} (${unpaid.length} วัน)`}
            </button>
          ) : (
            claim.days.length > 0 && <p className="mt-3 text-center text-sm font-bold text-good">✅ แลกครบทุกวันแล้ว</p>
          )}
          {issued && (
            <div className="mt-3 text-center">
              <CodeDisplay code={issued.code} minutes={issued.minutes} />
              <p className="mt-2 text-xs text-muted">ส่งโค้ดนี้ให้หลานพิมพ์ที่คอม · ใช้ได้ครั้งเดียว</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Parent-only: make a PC time code for any amount of time. The server checks the PIN again. */
function ParentCodes({ password }: { password: string }) {
  const [minutes, setMinutes] = useState(60);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [log, setLog] = useState<Issued[]>(readLog);
  const last = log[0];

  /** Asks the server for a code; returns it (also kept in the log), or an error message. */
  const issue = async (mins: number, why: string): Promise<Issued | string> => {
    // Serials are per minute: a second code in the same minute would be refused by the PC.
    if (last && Math.floor(last.at / 60_000) === Math.floor(Date.now() / 60_000))
      return "เพิ่งสร้างโค้ดไปในนาทีนี้ — รอให้ขึ้นนาทีใหม่ก่อน แล้วค่อยกดอีกครั้ง";
    try {
      const res = await fetch("/api/parent-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, minutes: mins }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        return data.error === "wrong-password"
          ? "PIN ไม่ถูก — ออกแล้วเข้าใหม่"
          : data.error === "not-configured"
            ? "ยังไม่ได้ตั้งค่า KIDTIMER_KEY / PARENT_PASSWORD บน Vercel"
            : "สร้างโค้ดไม่สำเร็จ";
      const made: Issued = { code: data.code, minutes: data.minutes, at: data.at, note: why };
      const next = [made, ...log].slice(0, 20);
      setLog(next);
      try {
        localStorage.setItem(LOG_KEY, JSON.stringify(next));
      } catch {
        /* the log is a convenience */
      }
      return made;
    } catch {
      return "ต่อเน็ตไม่ได้ ลองใหม่อีกครั้ง";
    }
  };

  const make = async () => {
    setBusy(true);
    setErr(null);
    const got = await issue(minutes, note.trim());
    setErr(typeof got === "string" ? got : null);
    if (typeof got !== "string") setNote("");
    setBusy(false);
  };

  return (
    <div className="space-y-4">
      <Redeem issue={issue} />
      <p className="pt-2 font-display">✍️ สร้างโค้ดเอง</p>
      <div className="card space-y-3 p-4">
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
        <button className="btn btn-primary w-full" disabled={busy} onClick={make}>
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
        โค้ดใช้ที่คอมได้ครั้งเดียว · โค้ดหายก็สร้างใหม่ได้ · สร้างได้นาทีละโค้ด · วันที่แลกแล้วจำไว้ในเครื่องนี้เท่านั้น
      </p>
    </div>
  );
}

function Parent() {
  // The PIN only lives in memory: leaving the page locks it again.
  const [pin, setPin] = useState<string | null>(null);
  return pin ? <ParentCodes password={pin} /> : <PinGate onOpen={setPin} />;
}

export default function ParentPage() {
  return (
    <>
      <BackHeader title="👨 Parent" sub="สร้างโค้ดเวลาคอม (KidTimer)" href="/progress" />
      <ClientOnly>
        <Parent />
      </ClientOnly>
    </>
  );
}
