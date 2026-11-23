"use client";

import { useEffect, useState } from "react";
import { Summary } from "@/components/ProgressSummary";
import { BackHeader, ClientOnly } from "@/components/ui";
import { COINS } from "@/lib/coins";
import { decodeProgress, encodeProgress, encodeReport, REPORT_DAYS, reportUrl, type Decoded } from "@/lib/share";
import { snapshot, useProgress } from "@/lib/store";
import { formatMinutes } from "@/lib/kidtimer/reward";

/** Opens the share sheet with `text`, or copies it where there's none; true when copied. */
async function shareText(text: string): Promise<boolean> {
  try {
    if (navigator.share) {
      await navigator.share({ text });
      return false;
    }
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false; // cancelled
  }
}

/**
 * Main share: a link (and QR code) to the last two weeks, which opens the summary with one tap or
 * scan. The whole progress still goes out as a long code, for backups and moving to a new phone.
 */
function ShareCard() {
  const p = useProgress();
  const [link, setLink] = useState("");
  const [qr, setQr] = useState("");
  const [showQr, setShowQr] = useState(false);
  const [copied, setCopied] = useState<"link" | "backup" | null>(null);
  // Built ahead of time so the share sheet opens straight from the tap.
  useEffect(() => {
    let live = true;
    void encodeReport(snapshot()).then((c) => live && setLink(reportUrl(c, location.origin)));
    return () => {
      live = false;
    };
  }, [p]);
  useEffect(() => {
    if (!showQr || !link) return;
    let live = true;
    void import("qrcode")
      .then((QR) => QR.toDataURL(link, { errorCorrectionLevel: "L", margin: 2, width: 640 }))
      .then((url) => live && setQr(url));
    return () => {
      live = false;
    };
  }, [showQr, link]);

  const shareLink = async () => {
    const who = p.name ? `ของ ${p.name}` : "";
    if (await shareText(`📊 ผลงาน Brain Dojo ${who} (${REPORT_DAYS} วันล่าสุด) — กดดูได้เลย\n${link}`)) setCopied("link");
  };
  const shareBackup = async () => {
    if (await shareText(await encodeProgress(snapshot()))) setCopied("backup");
  };
  const saturday = new Date().getDay() === 6;
  return (
    <div className="card p-4">
      <div className="flex gap-2">
        <button className="btn btn-primary flex-1 text-lg" disabled={!link} onClick={shareLink}>
          {copied === "link" ? "คัดลอกลิงก์แล้ว ✔" : "📤 ส่งลิงก์ผลงาน"}
        </button>
        <button className="btn btn-ghost px-4 text-lg" disabled={!link} onClick={() => setShowQr((v) => !v)} aria-expanded={showQr}>
          🔳 QR
        </button>
      </div>
      {showQr && (
        <div className="mt-3 flex flex-col items-center">
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element -- a data: URL, nothing to optimise
            <img src={qr} alt="QR code ผลงาน" className="aspect-square w-full max-w-[280px] rounded-xl border-2 border-ink" />
          ) : (
            <div className="aspect-square w-full max-w-[280px] animate-pulse rounded-xl bg-ink/5" />
          )}
          <p className="mt-2 text-center text-xs text-muted">สแกนด้วยกล้องมือถือ · กดค้างที่รูปเพื่อบันทึกหรือส่งต่อ</p>
        </div>
      )}
      <p className="mt-2 text-center text-xs leading-relaxed text-muted">
        {saturday && <span className="font-bold text-ink">วันเสาร์แล้ว ส่งสรุปทั้งสัปดาห์ได้เลย! · </span>}
        คนที่ได้รับกดลิงก์หรือสแกน QR จะเห็นสรุปสัปดาห์กับผลงาน {REPORT_DAYS} วันล่าสุดทันที
      </p>
      <button className="mt-2 w-full py-1 text-xs text-muted underline" onClick={shareBackup}>
        {copied === "backup" ? "คัดลอกโค้ดสำรองแล้ว ✔" : "📦 สำรองข้อมูลทั้งหมด (โค้ดยาว ใช้ย้ายไปเครื่องใหม่)"}
      </button>
    </div>
  );
}

/** The code in a shared link (`/progress#v=…`), if the page was opened from one. */
function linkCode(): string | null {
  return location.hash.startsWith("#v=") ? location.hash.slice(3) : null;
}

/** Paste a code (or a shared link) to see someone's progress; a full code can also be restored. */
function ImportBox({ initial, onClose }: { initial?: string; onClose?: () => void }) {
  const [text, setText] = useState(initial ?? "");
  const [data, setData] = useState<Decoded | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const importData = useProgress((s) => s.importData);

  const read = async () => {
    try {
      setData(await decodeProgress(text));
      setErr(null);
    } catch (e) {
      setData(null);
      setErr((e as Error).message);
    }
  };
  useEffect(() => {
    if (!initial) return;
    decodeProgress(initial).then(setData, (e: Error) => setErr(e.message));
  }, [initial]);

  if (initial)
    return (
      <div className="card border-pink p-4">
        <div className="flex items-center justify-between">
          <p className="font-display">📬 ผลงานที่ได้รับ</p>
          <button className="text-sm text-muted underline" onClick={onClose}>
            ปิด
          </button>
        </div>
        {err && <p className="mt-2 text-sm text-bad">ลิงก์นี้เปิดไม่ได้: {err}</p>}
        {data && (
          <div className="mt-3">
            <Summary data={data} exportedAt={data.exportedAt} dailyCount={data.dailyCount} />
          </div>
        )}
      </div>
    );

  return (
    <div className="card p-4">
      <p className="font-display">📥 ดูผลงาน / กู้ข้อมูล</p>
      <p className="mt-1 text-xs text-muted">วางลิงก์หรือโค้ดที่ได้รับ แล้วกดเปิดดู — เห็นผลงานกับสรุปสัปดาห์</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="วางลิงก์ หรือโค้ด BD… ที่นี่"
        className="mt-3 h-20 w-full rounded-xl bg-ink/5 p-2 font-mono text-[10px]"
      />
      <button className="btn btn-ghost mt-2 w-full" onClick={read} disabled={!text.trim()}>
        เปิดดู
      </button>
      {err && <p className="mt-2 text-sm text-bad">{err}</p>}
      {data && (
        <div className="mt-4">
          <Summary data={data} exportedAt={data.exportedAt} dailyCount={data.dailyCount} />
          {data.report ? (
            <p className="mt-3 text-center text-xs text-muted">นี่คือสรุป {REPORT_DAYS} วันล่าสุด · กู้ข้อมูลต้องใช้โค้ดสำรอง 📦</p>
          ) : (
            <button
              className="btn btn-ghost mt-3 w-full text-sm text-bad"
              onClick={() => {
                if (confirm("แทนที่ข้อมูลในเครื่องนี้ด้วยข้อมูลจากโค้ด? (ข้อมูลเดิมจะหายไป)")) {
                  const { exportedAt, report, dailyCount, ...rest } = data;
                  void [exportedAt, report, dailyCount];
                  importData(rest);
                  setData(null);
                  setText("");
                }
              }}
            >
              กู้คืนเป็นข้อมูลของเครื่องนี้
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Wallet() {
  const coins = useProgress((s) => s.coins);
  const log = useProgress((s) => s.coinLog);
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <p className="font-display">🪙 เหรียญคำใบ้</p>
        <p className="font-display text-lg font-extrabold">
          {coins} <span className="text-xs font-medium text-muted">/ {COINS.cap}</span>
        </p>
      </div>
      <p className="mt-1 text-xs text-muted">
        ทุกด่านใช้คำใบ้ฟรีได้ {COINS.freePerPuzzle} ครั้ง ครั้งต่อไปใช้ 1 เหรียญ · หาเหรียญได้จาก 3★ บนแผนที่, ชนะบอส (+2),
        เปิดหีบ (+3), เล่น Daily จบ, 3★ ในลานฝึกดาบ (วันละไม่เกิน {COINS.freePlayPerDay}) และเล่น Daily ติดกันทุก 7 วัน (+2)
      </p>
      {log.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm">
          {log.slice(0, 8).map((e, i) => (
            <li key={i} className="flex justify-between border-b border-ink/10 py-1">
              <span>{e.reason}</span>
              <span className={e.delta > 0 ? "font-bold text-good" : "font-bold text-bad"}>
                {e.delta > 0 ? "+" : ""}
                {e.delta}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** PC time codes from recent Dailies, newest first. */
function TimeCodes() {
  const codes = useProgress((s) => s.timeCodes);
  const list = Object.entries(codes ?? {})
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 7);
  if (!list.length) return null;
  return (
    <div className="card p-4">
      <p className="font-display">⏰ โค้ดเวลาคอม</p>
      <p className="mt-1 text-xs text-muted">ซื้อในร้านค้า (โค้ดจาก Daily แบบเก่าก็อยู่ที่นี่) · แต่ละโค้ดใช้ที่คอมได้ครั้งเดียว · เวลาจาก Daily ส่งผลงานให้ผู้ปกครองแลกเป็นโค้ด</p>
      <ul className="mt-3 space-y-1.5 text-sm">
        {list.map(([date, c]) => (
          <li key={date} className="flex items-center justify-between gap-2 rounded-xl bg-ink/5 px-3 py-2">
            <span className="text-xs text-muted">
              {date.slice(8, 10)}/{date.slice(5, 7)}
              {date.includes("#shop") && " 🏪"}
            </span>
            <span className="select-all font-mono font-bold tracking-wide">{c.code}</span>
            <span className="text-xs font-bold">{formatMinutes(c.minutes)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Mine() {
  const p = useProgress();
  const setName = useProgress((s) => s.setName);
  const reset = useProgress((s) => s.reset);
  // Opened from a shared link or QR code: show what was sent first.
  const [incoming, setIncoming] = useState<string | null>(null);
  useEffect(() => {
    const pick = () => setIncoming(linkCode());
    pick();
    addEventListener("hashchange", pick);
    return () => removeEventListener("hashchange", pick);
  }, []);
  const closeIncoming = () => {
    history.replaceState(null, "", location.pathname);
    setIncoming(null);
  };
  return (
    <div className="space-y-4">
      {incoming && <ImportBox key={incoming} initial={incoming} onClose={closeIncoming} />}
      <ShareCard />
      <label className="card flex items-center gap-3 p-4">
        <span className="text-sm text-muted">ชื่อเล่น</span>
        <input
          value={p.name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ใส่ชื่อ (โชว์ตอนแชร์ผล)"
          className="flex-1 rounded-lg bg-ink/5 px-3 py-2 outline-none focus:ring-2 focus:ring-pink"
        />
      </label>
      <Summary data={p} />
      <TimeCodes />
      <Wallet />
      <ImportBox />
      <a href="/life/parent" className="btn btn-ghost w-full text-sm">
        👨 สำหรับผู้ปกครอง · Life Quest โหมดน้า
      </a>
      <button
        className="w-full py-2 text-xs text-muted underline"
        onClick={() => confirm("ลบความคืบหน้าทั้งหมดในเครื่องนี้? ย้อนกลับไม่ได้") && reset()}
      >
        ลบข้อมูลทั้งหมด
      </button>
    </div>
  );
}

export default function ProgressPage() {
  return (
    <>
      <BackHeader title="📊 Progress" sub="ผลงาน · สรุปสัปดาห์ · แชร์" />
      <ClientOnly>
        <Mine />
      </ClientOnly>
    </>
  );
}
