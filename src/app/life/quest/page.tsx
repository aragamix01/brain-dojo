"use client";

import Link from "next/link";
import { useState } from "react";
import { forgetCheckInDue } from "@/components/CheckInDue";
import { syncDailies } from "@/components/LifeSync";
import { dayKey } from "@/lib/date";
import { formatMinutes, rewardMinutes, DAILY_REWARD } from "@/lib/kidtimer/reward";
import { ACHIEVEMENTS, CHECKIN_KIND, isCheckInDay, levelFor, missing, type Answer, type Answers } from "@/lib/life/model";
import { useProgress } from "@/lib/store";
import type { Question } from "@/lib/life/questions";
import { Bar, errorText, hm, Loading, post, useApi, type PlayerData } from "../shared";

const API = "/api/lq/player";

export default function QuestPage() {
  const { data, err } = useApi<PlayerData>(API);
  if (err) return <p className="lq-card mt-10 p-5 text-center">{err === "signed-out" ? "ออกจากระบบแล้ว" : errorText(err)}</p>;
  if (!data) return <Loading />;
  if (!data.signedIn) {
    return (
      <div className="mt-10 text-center">
        <Link href="/life" className="lq-btn lq-btn-primary">
          ใส่ PIN ก่อนนะ
        </Link>
      </div>
    );
  }
  return <Quest d={data} />;
}

type Result = { xp: number; achievements: string[]; unlocked: number; first: boolean; daily?: number };

/** On a Friday or Saturday the first check-in of the week is that day's Brain Dojo Daily. */
async function countAsDaily(startedAt: number): Promise<number | undefined> {
  const today = dayKey();
  const s = useProgress.getState();
  if (!isCheckInDay(today) || s.daily[today]) return undefined;
  s.recordDaily(today, {
    timeMs: Date.now() - startedAt,
    hints: 0,
    stages: [{ kind: CHECKIN_KIND, label: "📝 เช็กอินประจำสัปดาห์", stars: 3, detail: "ตอบ Weekly Quest" }],
  });
  forgetCheckInDue();
  await syncDailies(true);
  return rewardMinutes(DAILY_REWARD.maxStars);
}

function Quest({ d }: { d: PlayerData }) {
  const qs = d.questions ?? [];
  const [answers, setAnswers] = useState<Answers>(() => d.thisWeek?.answers ?? d.draft?.answers ?? {});
  const [i, setI] = useState(0);
  const [saved, setSaved] = useState<"idle" | "saving" | "saved">("idle");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [startedAt] = useState(() => Date.now());
  const editing = !!d.thisWeek;

  if (result) return <Reward d={d} r={result} />;
  if (!qs.length) return <p className="lq-card mt-10 p-5 text-center">ยังไม่มีคำถามที่เปิดใช้ ให้พี่แตงพี่หยกเปิดคำถามก่อน</p>;

  const q = qs[i];
  const a: Answer = answers[q.id] ?? {};
  const set = (next: Answer) => {
    setAnswers({ ...answers, [q.id]: { ...next, skipped: undefined } });
    setSaved("idle");
    setHint(null);
  };

  const saveDraft = async (ans = answers) => {
    if (editing) return; // a sent check-in is edited by sending again
    setSaved("saving");
    const r = await post(API, { action: "saveDraft", answers: ans });
    setSaved(r.error ? "idle" : "saved");
  };
  const go = (step: number) => {
    const need = step > 0 ? missing(q, a) : null;
    if (need) return setHint(need);
    setHint(null);
    void saveDraft();
    setI(Math.max(0, Math.min(qs.length - 1, i + step)));
    window.scrollTo({ top: 0 });
  };
  const skip = () => {
    setHint(null);
    const ans = { ...answers, [q.id]: { skipped: true } };
    setAnswers(ans);
    void saveDraft(ans);
    if (i < qs.length - 1) setI(i + 1);
  };
  const submit = async () => {
    // Every question must be done (or skipped where allowed); open the first one that isn't.
    const open = qs.findIndex((x) => missing(x, answers[x.id]));
    if (open >= 0) {
      setI(open);
      return setHint(missing(qs[open], answers[qs[open].id]));
    }
    setBusy(true);
    setErr(null);
    const r = await post<Result & { question?: string }>(API, { action: "submit", answers });
    setBusy(false);
    if (r.error === "incomplete") {
      const k = qs.findIndex((x) => x.id === r.question);
      if (k >= 0) setI(k);
      setHint("ข้อนี้ยังตอบไม่ครบนะ");
    } else if (r.error) setErr(errorText(r.error));
    else setResult({ ...r, daily: r.first ? await countAsDaily(startedAt) : undefined });
  };

  const togglePick = (opt: string) => {
    const picks = a.picks ?? [];
    if (q.type === "multi") set({ ...a, picks: picks.includes(opt) ? picks.filter((p) => p !== opt) : [...picks, opt] });
    else set({ ...a, picks: [opt] });
  };

  return (
    <div className="flex min-h-[88dvh] flex-col gap-4">
      <div className="flex items-center gap-2.5">
        <Link href="/life" aria-label="ปิด (ร่างถูกบันทึกไว้)" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border-[2.5px] border-[#2e2a4a] bg-white">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2e2a4a" strokeWidth="2.8" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </Link>
        <div className="flex-1 space-y-1.5">
          <div className="flex justify-between font-lq text-[13px] font-semibold">
            <span>{editing ? "แก้คำตอบที่ส่งแล้ว" : "Weekly Quest"}</span>
            <span>
              {i + 1}/{qs.length}
            </span>
          </div>
          <div className="flex gap-[3px]" aria-hidden="true">
            {qs.map((x, k) => (
              <button
                key={x.id}
                type="button"
                tabIndex={-1}
                onClick={() => (setI(k), setHint(null))}
                className="h-2 flex-1 rounded-full"
                style={{ background: k <= i ? "#6a55e0" : answers[x.id] ? "#cdbeff" : "#e6e0f5" }}
              />
            ))}
          </div>
        </div>
        {!editing && (
          <button onClick={() => saveDraft()} className="lq-btn lq-btn-pink !min-h-11 !px-3 text-[13px]">
            {saved === "saved" ? "บันทึกแล้ว" : saved === "saving" ? "กำลังบันทึก" : "บันทึกร่าง"}
          </button>
        )}
      </div>

      <div className="lq-card space-y-1.5 p-4 !shadow-[5px_5px_0_#2e2a4a]">
        <p className="font-lq text-[13px] font-semibold text-[#5b47d6]">{q.topic}</p>
        <h1 className="font-lq text-[21px] font-bold leading-snug">{q.text}</h1>
        {q.help && <p className="text-[13px] text-[#5e5878]">{q.help}</p>}
      </div>

      <div className="flex flex-1 flex-col gap-3">
        {a.skipped && <p className="rounded-xl bg-[#eee8ff] px-3 py-2 text-sm">ข้ามข้อนี้ไว้ · เลือกคำตอบเมื่อไหร่ก็ได้</p>}
        {(q.type === "single" || q.type === "multi") && (
          <div className="flex flex-wrap gap-2.5" role="group" aria-label="ตัวเลือก">
            {(q.options ?? []).map((opt) => (
              <button key={opt} type="button" className="lq-chip" aria-pressed={(a.picks ?? []).includes(opt)} onClick={() => togglePick(opt)}>
                {opt}
              </button>
            ))}
          </div>
        )}
        {(a.picks ?? [])
          .filter((p) => q.followUps?.[p])
          .map((p) => (
            <label key={p} className="flex flex-col gap-1.5 rounded-[18px] border-[2.5px] border-[#2e2a4a] bg-[#eee8ff] p-3">
              <span className="text-sm font-semibold">
                {p}: {q.followUps![p]} <span className="font-normal text-[#b42357]">(ต้องเขียน)</span>
              </span>
              <input
                className="lq-input"
                value={a.notes?.[p] ?? ""}
                maxLength={300}
                onChange={(e) => set({ ...a, notes: { ...a.notes, [p]: e.target.value } })}
              />
            </label>
          ))}
        {q.type === "rating" && <Rating q={q} value={a.rating} onPick={(n) => set({ ...a, rating: n })} />}
        {(q.type === "text" || q.textLabel) && (
          <label className="mt-1 flex flex-col gap-1.5">
            <span className="text-sm font-semibold">
              {q.textLabel ?? "เขียนเพิ่มเติม"}{" "}
              {q.type === "text" ? (
                !q.skippable && <span className="font-normal text-[#b42357]">(ต้องเขียน)</span>
              ) : (
                <span className="font-normal text-[#5e5878]">(ไม่บังคับ)</span>
              )}
            </span>
            <textarea
              rows={3}
              className="lq-input resize-none"
              value={a.text ?? ""}
              placeholder={q.textHint}
              maxLength={1000}
              onChange={(e) => set({ ...a, text: e.target.value })}
            />
          </label>
        )}
        {q.skippable && (
          <button type="button" onClick={skip} className="min-h-11 self-center px-3 font-lq text-sm font-semibold text-[#5b47d6] underline">
            ขอข้ามข้อนี้
          </button>
        )}
      </div>

      {hint && (
        <p role="alert" className="text-center text-sm font-semibold text-[#b42357]">
          {hint}
        </p>
      )}

      {err && <p className="text-center text-sm font-semibold text-[#b42357]">{err}</p>}
      <div className="flex gap-2.5 pb-2">
        <button type="button" disabled={i === 0} onClick={() => go(-1)} className="lq-btn px-5">
          ย้อนกลับ
        </button>
        {i < qs.length - 1 ? (
          <button type="button" onClick={() => go(1)} className="lq-btn lq-btn-primary flex-1 text-lg">
            ข้อต่อไป
          </button>
        ) : (
          <button type="button" disabled={busy} onClick={submit} className="lq-btn lq-btn-pink flex-1 text-lg">
            {busy ? "กำลังส่ง…" : editing ? "บันทึกการแก้ไข" : "ส่งคำตอบให้พี่แตงพี่หยก"}
          </button>
        )}
      </div>
    </div>
  );
}

function Rating({ q, value, onPick }: { q: Question; value?: number; onPick: (n: number) => void }) {
  return (
    <>
      <div className="grid grid-cols-5 gap-2" role="group" aria-label="คะแนน 1 ถึง 5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={value === n}
            onClick={() => onPick(n)}
            className={`min-h-[60px] rounded-[18px] font-lq text-2xl font-bold ${
              value === n ? "border-[2.5px] border-[#2e2a4a] bg-[#ffd66b] shadow-[0_3px_0_#2e2a4a]" : "border-2 border-[#a9a2c6] bg-white"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <p className="rounded-2xl border-2 border-[#2e2a4a] bg-[#fff1c9] px-3.5 py-2.5 text-sm leading-relaxed">
        {value ? `${value} · ${q.ratingNotes?.[value - 1] ?? ""}` : "แตะตัวเลขเพื่อดูความหมายของแต่ละระดับ"}
      </p>
    </>
  );
}

function Reward({ d, r }: { d: PlayerData; r: Result }) {
  const xp = (d.player?.xp ?? 0) + r.xp;
  const lv = levelFor(xp);
  return (
    <div className="-mx-4 -mt-[max(1rem,env(safe-area-inset-top))] flex min-h-[100dvh] flex-col items-center gap-4 bg-[#cdbeff] bg-[repeating-conic-gradient(from_0deg_at_50%_22%,rgba(255,255,255,.4)_0_6deg,transparent_6deg_18deg)] px-5 pb-6 pt-10">
      <svg width="140" height="120" viewBox="0 0 150 130" fill="none" stroke="#2e2a4a" strokeWidth="2.8" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
        <path d="M30 62h90v52a8 8 0 01-8 8H38a8 8 0 01-8-8z" fill="#ffb5cf" />
        <path d="M24 48h102v16H24z" fill="#ffe3ee" />
        <path d="M75 48v74" strokeWidth="6" stroke="#6a55e0" />
        <path d="M75 46c-10-18-30-20-30-8 0 8 14 10 30 8zM75 46c10-18 30-20 30-8 0 8-14 10-30 8z" fill="#ffd66b" />
        <path d="M18 22l6 6M132 20l-6 7M75 6v10" strokeWidth="3.2" />
      </svg>
      <h1 className="font-lq text-3xl font-bold">{r.first ? "ส่ง Quest แล้ว!" : "บันทึกการแก้ไขแล้ว"}</h1>
      <p className="text-center text-[15px] leading-relaxed">
        ขอบคุณที่ใช้เวลาคุยกับตัวเองนะ
        <br />
        คำตอบนี้ส่งถึงพี่แตงพี่หยกแล้ว
      </p>
      <div className="lq-card w-full space-y-3 p-4 !shadow-[5px_5px_0_#2e2a4a]">
        <div className="flex items-center justify-between">
          <span className="font-lq text-lg font-bold">ได้รับ</span>
          <span className="rounded-[14px] border-[2.5px] border-[#2e2a4a] bg-[#ffd66b] px-3 font-lq text-[28px] font-bold">+{r.xp} XP</span>
        </div>
        <div className="flex justify-between font-lq text-[13px] font-semibold">
          <span>
            Lv {lv.level} · {lv.title}
          </span>
          <span>
            {lv.into} / {lv.need}
          </span>
        </div>
        <Bar pct={(lv.into / lv.need) * 100} />
        {r.first && r.unlocked > 0 && (
          <div className="flex items-center justify-between rounded-[14px] bg-[#2e2a4a] px-3 py-2 text-white">
            <span className="text-[13px]">ปลดล็อกเวลาคอม 30% ที่กั๊กไว้</span>
            <span className="font-lq text-lg font-bold text-[#ffd66b]">+{hm(r.unlocked)} ชม.</span>
          </div>
        )}
      </div>
      {r.achievements.map((id) => (
        <div key={id} className="flex w-full items-center gap-3 rounded-[20px] border-[2.5px] border-[#2e2a4a] bg-[#fff6ec] px-3.5 py-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-[2.5px] border-[#2e2a4a] bg-[#ffd66b]">★</span>
          <div>
            <p className="font-lq text-xs font-semibold text-[#5b47d6]">ปลดล็อก Achievement ใหม่</p>
            <p className="font-lq text-[17px] font-bold">{ACHIEVEMENTS.find((a) => a.id === id)?.name}</p>
          </div>
        </div>
      ))}
      {r.daily && (
        <div className="flex w-full items-center justify-between rounded-[20px] border-[2.5px] border-[#2e2a4a] bg-[#6a55e0] px-3.5 py-3 text-white">
          <span className="font-lq text-sm font-semibold">Daily วันนี้เคลียร์แล้ว · ไฟไม่ดับ</span>
          <span className="font-lq text-lg font-bold text-[#ffd66b]">+{formatMinutes(r.daily)}</span>
        </div>
      )}
      {r.first && <p className="text-center text-[13px]">Daily วันที่เหลือของสัปดาห์นี้ ได้เวลาคอมเต็ม 100% เลย</p>}
      <div className="flex-1" />
      <p className="font-lq text-sm font-semibold">ก้าวเล็กๆ สัปดาห์ละก้าว ก็ไปได้ไกลแล้ว</p>
      <Link href="/life" className="lq-btn lq-btn-primary w-full text-lg">
        กลับหน้าแรก
      </Link>
    </div>
  );
}
