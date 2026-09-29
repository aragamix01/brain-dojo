"use client";

import { useState } from "react";
import { BackHeader, ClientOnly, Stars } from "@/components/ui";
import { LOGIC_GAMES } from "@/games/catalog";
import { ROBOT_LEVELS } from "@/games/robot/levels";
import { THEMES } from "@/games/situation/data";
import { COINS } from "@/lib/coins";
import { dayKey, formatTime } from "@/lib/date";
import { rankFor } from "@/lib/rank";
import { decodeProgress, encodeProgress, type Decoded } from "@/lib/share";
import { liveStreak, snapshot, useProgress, type ProgressData } from "@/lib/store";

function last14Days() {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 13 + i);
    return dayKey(d);
  });
}

function Summary({ data, exportedAt }: { data: ProgressData; exportedAt?: number }) {
  const rank = rankFor(data.xp);
  const g = data.games;
  const dailyCount = Object.keys(data.daily).length;
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
            ["📅 daily", dailyCount],
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

      <div className="card p-4">
        <p className="mb-2 font-display">📅 Daily 14 วันล่าสุด</p>
        <div className="flex gap-1">
          {last14Days().map((d) => {
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

function ExportBox() {
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const make = () => {
    setCode(encodeProgress(snapshot()));
    setCopied(false);
  };
  const copy = async () => {
    try {
      if (navigator.share) await navigator.share({ text: code });
      else {
        await navigator.clipboard.writeText(code);
        setCopied(true);
      }
    } catch {
      /* cancelled */
    }
  };
  return (
    <div className="card p-4">
      <p className="font-display">📤 ส่งผลให้น้า / Backup</p>
      <p className="mt-1 text-xs text-muted">
        สร้างโค้ดแล้วส่งทาง LINE — อีกฝั่งวางโค้ดในหน้านี้เพื่อดูผลได้ และใช้ย้ายข้อมูลไปเครื่องใหม่ได้ด้วย
      </p>
      {code ? (
        <>
          <textarea readOnly value={code} className="mt-3 h-24 w-full rounded-xl bg-ink/5 p-2 font-mono text-[10px]" />
          <button className="btn btn-cyan mt-2 w-full" onClick={copy}>
            {copied ? "คัดลอกแล้ว ✔" : "📋 คัดลอก / แชร์"}
          </button>
        </>
      ) : (
        <button className="btn btn-primary mt-3 w-full" onClick={make}>
          สร้างโค้ด
        </button>
      )}
    </div>
  );
}

function ImportBox() {
  const [text, setText] = useState("");
  const [data, setData] = useState<Decoded | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const importData = useProgress((s) => s.importData);

  const read = () => {
    try {
      setData(decodeProgress(text));
      setErr(null);
    } catch (e) {
      setData(null);
      setErr((e as Error).message);
    }
  };

  return (
    <div className="card p-4">
      <p className="font-display">📥 ดูผลจากโค้ด</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="วางโค้ด BD1.… ที่นี่"
        className="mt-3 h-20 w-full rounded-xl bg-ink/5 p-2 font-mono text-[10px]"
      />
      <button className="btn btn-ghost mt-2 w-full" onClick={read} disabled={!text.trim()}>
        เปิดดู
      </button>
      {err && <p className="mt-2 text-sm text-bad">{err}</p>}
      {data && (
        <div className="mt-4">
          <Summary data={data} exportedAt={data.exportedAt} />
          <button
            className="btn btn-ghost mt-3 w-full text-sm text-bad"
            onClick={() => {
              if (confirm("แทนที่ข้อมูลในเครื่องนี้ด้วยข้อมูลจากโค้ด? (ข้อมูลเดิมจะหายไป)")) {
                const { exportedAt, ...rest } = data;
                void exportedAt;
                importData(rest);
                setData(null);
                setText("");
              }
            }}
          >
            กู้คืนเป็นข้อมูลของเครื่องนี้
          </button>
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

function Mine() {
  const p = useProgress();
  const setName = useProgress((s) => s.setName);
  const reset = useProgress((s) => s.reset);
  return (
    <div className="space-y-4">
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
      <Wallet />
      <ExportBox />
      <ImportBox />
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
      <BackHeader title="📊 Progress" sub="ข้อมูลเก็บในเครื่องนี้เท่านั้น ไม่มี server" />
      <ClientOnly>
        <Mine />
      </ClientOnly>
    </>
  );
}
