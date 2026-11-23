"use client";

// The progress summary: the player's own view on /progress, and the uncle's view of a shared code
// or of the progress synced to Weekly Life Quest (which adds the Daily level and trips out of the app).
import { Stars } from "@/components/ui";
import { LOGIC_GAMES } from "@/games/catalog";
import { DAILY_LEVELS, START_LEVEL } from "@/games/daily/plan";
import { ROBOT_LEVELS } from "@/games/robot/levels";
import { THEMES } from "@/games/situation/data";
import { dayKey, formatTime, shiftDay } from "@/lib/date";
import { rankFor } from "@/lib/rank";
import { liveStreak, type ProgressData } from "@/lib/store";
import { weekCompare, weekRange, weekReport } from "@/lib/weekly";

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
    showLevel && `🔒 ระดับ Daily (เห็นเฉพาะน้า): Lv${lv} · ${DAILY_LEVELS[lv].name}`,
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
      <p className="font-display">🔒 ตรวจคิดเอง (เห็นเฉพาะน้า)</p>
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

export function Summary({ data, exportedAt, dailyCount }: { data: ProgressData; exportedAt?: number; dailyCount?: number }) {
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

