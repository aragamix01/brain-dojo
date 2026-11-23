"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { goalOf, weekLabel, type WeekEntry } from "@/lib/life/model";
import { Q } from "@/lib/life/questions";
import { answerText, errorText, Header, Loading, post, useApi, type PlayerData } from "../shared";

const API = "/api/lq/player";
type Tab = "weeks" | "goals" | "interests";

export default function JournalPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Journal />
    </Suspense>
  );
}

function Journal() {
  const { data, err, reload } = useApi<PlayerData>(API);
  const first = useSearchParams().get("tab");
  const [tab, setTab] = useState<Tab>(first === "goals" || first === "interests" ? first : "weeks");
  if (err) return <p className="lq-card mt-10 p-5 text-center">{err === "signed-out" ? "ออกจากระบบแล้ว" : errorText(err)}</p>;
  if (!data) return <Loading />;
  if (!data.signedIn)
    return (
      <div className="mt-10 text-center">
        <Link href="/life" className="lq-btn lq-btn-primary">
          ใส่ PIN ก่อนนะ
        </Link>
      </div>
    );
  const weeks = data.weeks ?? [];
  return (
    <div className="space-y-4">
      <Header title="My Journal" />
      <div className="grid grid-cols-3 gap-2">
        {(
          [
            ["weeks", "รายสัปดาห์"],
            ["goals", "เป้าหมาย"],
            ["interests", "ความสนใจ"],
          ] as const
        ).map(([id, label]) => (
          <button key={id} className="lq-chip justify-center !rounded-2xl !px-2 font-lq text-sm font-bold" aria-pressed={tab === id} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>
      {weeks.length === 0 && <p className="py-8 text-center text-sm text-[#5e5878]">ยังไม่มีบันทึก · ส่งเช็กอินครั้งแรกแล้วจะมาอยู่ที่นี่</p>}
      {tab === "weeks" && weeks.map((w) => <WeekCard key={w.week} w={w} />)}
      {tab === "goals" && <Goals weeks={weeks} reload={reload} />}
      {tab === "interests" && <Interests weeks={weeks} careers={data.player?.careers ?? []} />}
    </div>
  );
}

function WeekCard({ w }: { w: WeekEntry }) {
  const [open, setOpen] = useState(false);
  const mood = w.answers[Q.mood]?.picks?.[0];
  const time = w.answers[Q.timeMgmt]?.rating;
  const proud = w.answers.proud?.text;
  const goal = goalOf(w);
  return (
    <div className="lq-card space-y-1.5 p-3.5 !shadow-[3px_3px_0_#2e2a4a]">
      <div className="flex items-center justify-between gap-2">
        <p className="font-lq text-[13px] font-semibold text-[#5b47d6]">{weekLabel(w.week)}</p>
        {mood && <span className="rounded-full border-2 border-[#2e2a4a] bg-[#eee8ff] px-2.5 text-xs font-semibold">{mood}</span>}
      </div>
      {proud && <p className="text-sm leading-relaxed">ภูมิใจ: {proud}</p>}
      <p className="text-xs text-[#5e5878]">
        {time ? `จัดการเวลา ${time}/5` : ""}
        {time && goal ? " · " : ""}
        {goal ? `เป้า: ${goal.text}` : ""}
      </p>
      <button className="min-h-9 text-[13px] font-semibold text-[#5b47d6] underline" onClick={() => setOpen(!open)} aria-expanded={open}>
        {open ? "ซ่อนคำตอบ" : "ดูคำตอบทั้งหมด"}
      </button>
      {open && (
        <div className="divide-y divide-dashed divide-[#d8d0ee]">
          {w.questions.map((q, i) => (
            <div key={q.id} className="py-2">
              <p className="text-xs text-[#5e5878]">
                {i + 1}. {q.text}
              </p>
              <p className="text-sm font-semibold">{answerText(w.answers[q.id])}</p>
              {w.answers[q.id]?.text && <p className="text-sm">&ldquo;{w.answers[q.id]?.text}&rdquo;</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Goals({ weeks, reload }: { weeks: WeekEntry[]; reload: () => void }) {
  const [toast, setToast] = useState<string | null>(null);
  const list = weeks.filter((w) => goalOf(w));
  const toggle = async (w: WeekEntry) => {
    const r = await post<{ xp: number }>(API, { action: "goal", week: w.week, done: !w.goalDone });
    if (r.xp) {
      setToast(`+${r.xp} XP · ทำได้แล้ว!`);
      setTimeout(() => setToast(null), 2500);
    }
    reload();
  };
  return (
    <>
      <p className="text-[13px] text-[#5e5878]">เป้าที่ตั้งไว้ตอนท้ายเช็กอิน (ใช้กับสัปดาห์ถัดไป) · ติ๊กเมื่อทำสำเร็จ · ทำไม่สำเร็จไม่ถูกหัก XP</p>
      {list.map((w) => {
        const g = goalOf(w)!;
        return (
          <button key={w.week} onClick={() => toggle(w)} aria-pressed={!!w.goalDone} className="lq-card flex w-full items-center gap-3 p-3.5 text-left !shadow-[3px_3px_0_#2e2a4a]">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border-[2.5px] border-[#2e2a4a] ${w.goalDone ? "bg-[#bdefd9]" : "bg-white"}`}>
              {w.goalDone && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2e2a4a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12l5 5L19 7" />
                </svg>
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-lq text-xs font-semibold text-[#5b47d6]">
                ตั้งเมื่อ {weekLabel(w.week)}
                {g.area ? ` · ${g.area}` : ""}
              </span>
              <span className="block text-[15px] font-semibold leading-snug">{g.text}</span>
            </span>
          </button>
        );
      })}
      {list.length > 0 && (
        <p className="rounded-2xl border-2 border-dashed border-[#2e2a4a] bg-[#fff1c9] px-3.5 py-2.5 text-[13px] leading-relaxed">
          <b>Goal Getter</b> ปลดล็อกเมื่อทำเป้าสำเร็จ 3 ครั้ง · <b>Never Give Up</b> เมื่อทำเป้าสำเร็จหลังเคยพลาด
        </p>
      )}
      {toast && (
        <p role="status" className="fixed inset-x-4 bottom-6 mx-auto max-w-md rounded-2xl border-[2.5px] border-[#2e2a4a] bg-[#ffd66b] px-4 py-3 text-center font-lq font-bold shadow-[4px_4px_0_#2e2a4a]">
          {toast}
        </p>
      )}
    </>
  );
}

function Interests({ weeks, careers }: { weeks: WeekEntry[]; careers: string[] }) {
  const [list, setList] = useState(careers);
  const [text, setText] = useState("");
  const save = async (next: string[]) => {
    setList(next);
    await post(API, { action: "careers", list: next });
  };
  return (
    <>
      <div className="lq-card space-y-2.5 p-3.5">
        <p className="font-lq font-bold">คณะ / อาชีพที่เริ่มสนใจ</p>
        <div className="flex flex-wrap gap-1.5">
          {list.map((c) => (
            <button key={c} onClick={() => save(list.filter((x) => x !== c))} className="rounded-full border-2 border-[#2e2a4a] bg-[#eee8ff] px-3 py-1 text-[13px] font-semibold" aria-label={`ลบ ${c}`}>
              {c} ×
            </button>
          ))}
          {!list.length && <span className="text-[13px] text-[#5e5878]">ยังไม่มี · ไม่ต้องรีบ ค่อยๆ ดูไปก็ได้</span>}
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim() && !list.includes(text.trim())) void save([...list, text.trim()]);
            setText("");
          }}
        >
          <input className="lq-input text-sm" value={text} onChange={(e) => setText(e.target.value)} placeholder="เช่น วิศวะคอม, เชฟ" aria-label="เพิ่มคณะหรืออาชีพ" />
          <button className="lq-btn shrink-0 !px-4">เพิ่ม</button>
        </form>
      </div>
      <p className="text-[13px] text-[#5e5878]">ความสนใจของเราเปลี่ยนไปยังไงบ้าง (จากคำถามเรื่องความสนใจกับสิ่งที่อยากลอง)</p>
      {weeks.map((w) => (
        <div key={w.week} className="flex gap-3">
          <span className="w-16 shrink-0 pt-2 font-lq text-xs font-semibold">{weekLabel(w.week)}</span>
          <div className="lq-card flex-1 space-y-1.5 p-3 !shadow-none">
            <div className="flex flex-wrap gap-1.5">
              {(w.answers[Q.interests]?.picks ?? ["—"]).map((t) => (
                <span key={t} className="rounded-full border-2 border-[#2e2a4a] bg-[#eee8ff] px-2.5 text-[13px] font-semibold">
                  {t}
                </span>
              ))}
            </div>
            {w.answers[Q.try]?.text && <p className="text-[13px] text-[#4a4566]">อยากลอง: {w.answers[Q.try]?.text}</p>}
          </div>
        </div>
      ))}
    </>
  );
}
