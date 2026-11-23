"use client";

import { useEffect, useState } from "react";
import { BackHeader, ClientOnly, Stars } from "@/components/ui";
import { LOGIC_GAMES } from "@/games/catalog";
import { ROBOT_LEVELS } from "@/games/robot/levels";
import { THEMES } from "@/games/situation/data";
import { COINS } from "@/lib/coins";
import { dayKey, formatTime, shiftDay } from "@/lib/date";
import { rankFor } from "@/lib/rank";
import { decodeProgress, encodeProgress, encodeReport, REPORT_DAYS, reportUrl, type Decoded } from "@/lib/share";
import { liveStreak, snapshot, useProgress, type ProgressData } from "@/lib/store";
import { weekCompare, weekRange, weekReport } from "@/lib/weekly";
import { formatMinutes } from "@/lib/kidtimer/reward";
import { DAILY_LEVELS, START_LEVEL } from "@/games/daily/plan";

function last14Days(today: string) {
  return Array.from({ length: 14 }, (_, i) => shiftDay(today, i - 13));
}

const WEEKDAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

/** The week (Sunday → Saturday) around `today`: flames, totals and how each game went. */
function WeekSection({ data, today, showLevel }: { data: ProgressData; today: string; showLevel: boolean }) {
  const w = weekReport(data, today);
  const avg = w.runs ? formatTime(w.totalMs / w.runs) : "-";
  const tiles: [string, string, string][] = [
    ["📅", `${w.played}/7`, "วัน Daily"],
    ["⏱", w.runs ? formatTime(w.totalMs) : "-", `เฉลี่ย ${avg}`],
    ["⭐", w.stages ? `${w.stars}/${w.maxStars}` : "-", `3★ ${w.three} ด่าน`],
    ["💡", String(w.hints), "คำใบ้"],
  ];
  const fastest = w.fastest && `${formatTime(w.fastest.ms)} (${WEEKDAYS[w.days.indexOf(w.fastest.day)]})`;
  const lv = data.dailyLevel ?? START_LEVEL;
  const lines = [
    // Only on a pasted code (the uncle's view) — the player never sees their level.
    showLevel && `🔒 ระดับ Daily (เห็นเฉพาะตอนเปิดจากโค้ด): Lv${lv} · ${DAILY_LEVELS[lv].name}`,
    fastest && `⚡ Daily เร็วสุด ${fastest}`,
    w.huntDays > 0 && `🌟 วันล่าดาว สำเร็จ ${w.huntDone}/${w.huntDays}`,
    w.played > 0 && w.noHintDays > 0 && `🧠 ไม่ใช้คำใบ้เลย ${w.noHintDays} วัน`,
    w.best && `🏆 เก่งสุด: ${w.best.name} (เฉลี่ย ${(w.best.stars / w.best.plays).toFixed(1)}★)`,
    w.practice && `🎯 ต้องฝึก: ${w.practice.name} (เฉลี่ย ${(w.practice.stars / w.practice.plays).toFixed(1)}★)`,
    w.outside.wins > 0 &&
      `🗺️ นอก Daily: ชนะ ${w.outside.wins} ด่าน${w.outside.quest ? ` (แผนที่ ${w.outside.quest})` : ""} · ⭐ ${w.outside.stars} · 🪙 +${w.outside.coins}`,
    w.prev && w.runs > 0 && `📈 เทียบสัปดาห์ก่อน: ${weekCompare(w, w.prev)}`,
  ].filter((l): l is string => typeof l === "string");
  return (
    <div className="panel overflow-hidden bg-white">
      <div className="bg-[#6f5cf0] p-4 text-white">
        <p className="font-comic text-sm tracking-[2px] text-[#ffe27a]">WEEKLY LOG · {weekRange(w)}</p>
        <p className="font-display text-xl font-extrabold">📊 สรุป Daily ทั้งสัปดาห์</p>
        <div className="mt-2 flex gap-1.5">
          {w.marks.map((m, i) => (
            <div key={w.days[i]} className="flex flex-1 flex-col items-center gap-0.5">
              <span className={`text-lg ${m === "future" || m === "miss" ? "opacity-30 grayscale" : ""}`}>
                {m === "freeze" ? "🧊" : "🔥"}
              </span>
              <span className="font-display text-[10px] font-bold">{WEEKDAYS[i]}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 p-3 text-center">
        {tiles.map(([icon, v, k]) => (
          <div key={k} className="rounded-xl bg-ink/5 px-1 py-2">
            <p className="text-sm">{icon}</p>
            <p className="font-display text-base font-extrabold leading-tight">{v}</p>
            <p className="text-[10px] leading-tight text-muted">{k}</p>
          </div>
        ))}
      </div>
      {w.kinds.length > 0 && (
        <div className="px-4">
          <p className="mb-1 font-display text-sm">🎮 แต่ละเกมใน Daily</p>
          {w.kinds.map((k) => (
            <div key={k.kind} className="flex justify-between border-b border-ink/10 py-1 text-sm">
              <span>{k.name}</span>
              <span className="text-muted">
                {k.plays} ครั้ง · เฉลี่ย {(k.stars / k.plays).toFixed(1)}★{k.timed ? ` · ${formatTime(k.ms / k.timed)}` : ""}
              </span>
            </div>
          ))}
        </div>
      )}
      {lines.length > 0 && (
        <div className="space-y-1 px-4 pt-3 text-sm">
          {lines.map((l) => (
            <p key={l}>{l}</p>
          ))}
        </div>
      )}
      {showLevel && <AwayLog data={data} days={w.days} />}
      <div className="h-4" />
    </div>
  );
}

const secs = (ms: number) => (ms < 60_000 ? `${Math.round(ms / 1000)} วิ` : formatTime(ms));

/** Uncle's view only: trips out of the app and bonus questions, per Daily stage this week. */
function AwayLog({ data, days }: { data: ProgressData; days: string[] }) {
  const rows = days.flatMap((day, i) => {
    const stages = data.daily[day]?.stages;
    if (!stages?.length || stages[0].kind === "hunt") return [];
    if (stages.every((st) => !st.away)) return [{ day: i, text: "ยังไม่มีข้อมูล (ก่อนเริ่มจับ)", bad: false }];
    const notes = stages.flatMap((st) => {
      const parts: string[] = [];
      if (st.away?.n) parts.push(`ออก ${st.away.n} ครั้ง รวม ${secs(st.away.ms)}`);
      if (st.resets) parts.push(`โดนรีเซ็ต ${st.resets} ครั้ง`);
      if (st.quiz) parts.push(`คำถาม ${st.quiz.ok ? "✔" : "✗"} ${secs(st.quiz.ms)}`);
      if (!parts.length) return [];
      return [{ day: i, text: `${st.label} ${st.stars}★ · ${parts.join(" · ")}`, bad: !!st.away?.n || st.quiz?.ok === false }];
    });
    return notes.length ? notes : [{ day: i, text: "✅ ไม่ออกจากแอปเลย", bad: false }];
  });
  if (!rows.length) return null;
  return (
    <div className="mx-4 mt-3 rounded-xl border-2 border-dashed border-ink/30 p-3 text-sm">
      <p className="font-display">🔒 ตรวจคิดเอง (เห็นเฉพาะตอนเปิดจากโค้ด)</p>
      <p className="mb-1 text-[11px] text-muted">
        ออก = สลับไปแอป/หน้าต่างอื่นเกิน 1 วิ (ครั้งที่ 4 ของด่าน ด่านเริ่มใหม่เงียบๆ) · คำถาม = คำถามโบนัสหลังผ่านด่าน ตอบผิดได้ไม่เกิน 2★ · ไม่นับวันล่าดาว
      </p>
      {rows.map((r, i) => (
        <p key={i} className={r.bad ? "text-bad" : "text-muted"}>
          <span className="inline-block w-7 font-bold text-ink">{WEEKDAYS[r.day]}</span>
          {r.text}
        </p>
      ))}
    </div>
  );
}

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

function Summary({ data, exportedAt, dailyCount }: { data: ProgressData; exportedAt?: number; dailyCount?: number }) {
  const rank = rankFor(data.xp);
  const g = data.games;
  // A pasted code shows the week as it was when it was shared.
  const today = exportedAt ? dayKey(new Date(exportedAt)) : dayKey();
  return (
    <div className="space-y-3">
      <div className="card p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-xl border-[2.5px] border-ink font-comic text-4xl text-white [-webkit-text-stroke:1.5px_#1e2a3a] [text-shadow:2px_2px_0_#1e2a3a]" style={{ background: rank.color }}>
            {rank.name}
          </span>
          <div className="flex-1">
            <p className="font-display text-lg">{data.name || "Player"}</p>
            <p className="text-xs text-muted">
              {rank.title} · {data.xp} XP
            </p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
          {[
            ["⚔️ streak", liveStreak(data)],
            ["best", data.bestStreak],
            ["📅 daily", dailyCount ?? Object.keys(data.daily).length],
            ["💡 hints", data.hintsUsed],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-ink/5 py-2">
              <p className="font-display text-lg">{v}</p>
              <p className="text-muted">{k}</p>
            </div>
          ))}
        </div>
        {exportedAt && (
          <p className="mt-2 text-right text-[11px] text-muted">ข้อมูล ณ {new Date(exportedAt).toLocaleString("th-TH")}</p>
        )}
      </div>

      <WeekSection data={data} today={today} showLevel={!!exportedAt} />

      <div className="card p-4">
        <p className="mb-2 font-display">📅 Daily 14 วันล่าสุด</p>
        <div className="flex gap-1">
          {last14Days(today).map((d) => {
            const r = data.daily[d];
            return (
              <div
                key={d}
                title={r ? `${d} · ${formatTime(r.timeMs)}` : d}
                className={`h-6 flex-1 rounded ${r ? "bg-pink" : "bg-ink/5"}`}
              />
            );
          })}
        </div>
      </div>

      <div className="card p-4 text-sm">
        <p className="mb-2 font-display">🤖 Robot Code</p>
        <div className="grid grid-cols-8 gap-1">
          {ROBOT_LEVELS.map((l, i) => (
            <div key={l.id} className="rounded-lg bg-ink/5 py-1 text-center">
              <p className="text-[10px] text-muted">{i + 1}</p>
              <Stars n={g[`robot:${l.id}`]?.bestStars ?? 0} size="text-[10px]" />
            </div>
          ))}
        </div>

        <p className="mb-2 mt-4 font-display">🧩 Logic Lab</p>
        {LOGIC_GAMES.map((lg) => {
          const s = g[`logic:${lg.id}`];
          return (
            <div key={lg.id} className="flex justify-between border-b border-ink/10 py-1">
              <span>
                {lg.emoji} {lg.title}
              </span>
              <span className="text-muted">
                {s ? `ชนะ ${s.wins} · เร็วสุด ${s.bestTimeMs ? formatTime(s.bestTimeMs) : "-"}` : "-"}
              </span>
            </div>
          );
        })}

        <p className="mb-2 mt-4 font-display">🎯 Situations</p>
        {THEMES.map((sc) => (
          <div key={sc.id} className="flex justify-between border-b border-ink/10 py-1">
            <span>{sc.title}</span>
            <Stars n={g[`situation:${sc.id}`]?.bestStars ?? 0} size="text-sm" />
          </div>
        ))}

        <p className="mt-4 font-display">
          ⚡ Speed Math best: <span className="text-gold">{g.sprint?.bestScore ?? 0}</span>
        </p>
      </div>
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
