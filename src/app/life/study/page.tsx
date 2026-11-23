"use client";

import Link from "next/link";
import { useState } from "react";
import { shiftDay } from "@/lib/date";
import { bangkokToday, dayLabel, TASK_STATUS, UNDERSTANDING, weekLabel, weekStart, type Study, type Subject, type Task, type TaskStatus, type Understanding } from "@/lib/life/model";
import { errorText, Header, Loading, post, useApi, type PlayerData } from "../shared";

const API = "/api/lq/player";
const STATUS_BG = ["#ffe3ee", "#fff1c9", "#e2f7ee", "#bdefd9"];
const LEVEL_BG: Record<Understanding, string> = { good: "#e2f7ee", ok: "#fff1c9", weak: "#ffe3ee" };

/** A task belongs to the week it's due (or, with no due date, the week it was added). */
const taskWeek = (t: Task) => weekStart(t.due || bangkokToday(t.createdAt));

export default function StudyPage() {
  const { data, err } = useApi<PlayerData>(API);
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
  return <StudyView initial={data.study!} week={data.week!} />;
}

function StudyView({ initial, week }: { initial: Study; week: string }) {
  const [st, setSt] = useState(initial);
  const [tab, setTab] = useState<"tasks" | "subjects">("tasks");
  const [shown, setShown] = useState(week);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const act = async (body: Record<string, unknown>) => {
    const r = await post<{ study?: Study; xp?: number }>(API, { action: "study", ...body });
    if (r.study) setSt(r.study);
    if (r.xp) setToast(`+${r.xp} XP · เก่งมาก!`);
    else if (r.error) setToast(errorText(r.error));
    if (r.xp || r.error) setTimeout(() => setToast(null), 2500);
    return !r.error;
  };

  const tasks = st.tasks.filter((t) => taskWeek(t) === shown);
  const counts = [0, 0, 0];
  tasks.forEach((t) => counts[Math.min(t.status, 2)]++);

  return (
    <div className="space-y-4">
      <Header
        title="Study Tracker"
        right={
          <button className="lq-btn lq-btn-primary !min-h-11 !px-3.5 text-sm" onClick={() => (tab === "tasks" ? setAdding(!adding) : setAdding(true))}>
            + เพิ่ม
          </button>
        }
      />
      <div className="grid grid-cols-2 gap-2">
        {(["tasks", "subjects"] as const).map((t) => (
          <button key={t} className="lq-chip justify-center !rounded-2xl font-lq font-bold" aria-pressed={tab === t} onClick={() => setTab(t)}>
            {t === "tasks" ? "งานที่ได้รับ" : "รายวิชา"}
          </button>
        ))}
      </div>

      {tab === "tasks" ? (
        <>
          <div className="flex items-center justify-between rounded-[18px] border-[2.5px] border-[#2e2a4a] bg-white p-1">
            <button aria-label="สัปดาห์ก่อน" className="h-11 w-11" onClick={() => setShown(shiftDay(shown, -7))}>
              ‹
            </button>
            <span className="font-lq text-[15px] font-semibold">
              {shown === week ? "สัปดาห์นี้" : "สัปดาห์"} · {weekLabel(shown)}
            </span>
            <button aria-label="สัปดาห์ถัดไป" className="h-11 w-11" onClick={() => setShown(shiftDay(shown, 7))}>
              ›
            </button>
          </div>
          {adding && <AddTask subjects={st.subjects} onAdd={async (t) => (await act({ op: "addTask", ...t })) && setAdding(false)} />}
          <div className="flex gap-2">
            {["ยังไม่เริ่ม", "กำลังทำ", "เสร็จ/ส่งแล้ว"].map((label, k) => (
              <span key={label} className="flex flex-1 flex-col items-center rounded-[14px] border-2 border-[#2e2a4a] py-2" style={{ background: STATUS_BG[k === 2 ? 2 : k] }}>
                <span className="font-lq text-xl font-bold">{counts[k]}</span>
                <span className="text-xs">{label}</span>
              </span>
            ))}
          </div>
          {tasks.length === 0 && <p className="py-6 text-center text-sm text-[#5e5878]">ยังไม่มีงานในสัปดาห์นี้ · กด + เพิ่ม เพื่อจดงานที่ได้รับ</p>}
          {tasks.map((t) => (
            <div key={t.id} className="lq-card space-y-2 p-3.5 !shadow-[3px_3px_0_#2e2a4a]">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  {t.subject && <p className="font-lq text-xs font-semibold text-[#5b47d6]">{t.subject}</p>}
                  <p className="text-[15px] font-semibold leading-snug">{t.title}</p>
                </div>
                {t.due && <span className="shrink-0 rounded-[10px] border-2 border-[#2e2a4a] bg-[#fff6ec] px-2 text-xs font-semibold">ส่ง {dayLabel(t.due)}</span>}
              </div>
              {t.help && <p className="rounded-xl bg-[#ffe3ee] px-2.5 py-1.5 text-[13px]">อยากให้ช่วย: {t.help}</p>}
              <div className="flex items-center justify-between gap-2">
                <button
                  className="flex min-h-9 items-center gap-1.5 rounded-full border-2 border-[#2e2a4a] px-3 font-lq text-[13px] font-semibold"
                  style={{ background: STATUS_BG[t.status] }}
                  onClick={() => act({ op: "updateTask", id: t.id, status: ((t.status + 1) % 4) as TaskStatus })}
                  aria-label={`สถานะ ${TASK_STATUS[t.status]} แตะเพื่อเปลี่ยน`}
                >
                  {TASK_STATUS[t.status]} ›
                </button>
                <button className="min-h-9 px-2 text-xs text-[#5e5878] underline" onClick={() => confirm("ลบงานนี้?") && act({ op: "deleteTask", id: t.id })}>
                  ลบ
                </button>
              </div>
            </div>
          ))}
          {tasks.length > 0 && <p className="text-center text-xs text-[#5e5878]">แตะป้ายสถานะเพื่อเลื่อน: ยังไม่เริ่ม → กำลังทำ → เสร็จแล้ว → ส่งแล้ว</p>}
        </>
      ) : (
        <>
          {adding && <AddSubject onAdd={async (name) => (await act({ op: "addSubject", name })) && setAdding(false)} />}
          {st.subjects.length === 0 && !adding && <p className="py-6 text-center text-sm text-[#5e5878]">ยังไม่มีวิชา · กด + เพิ่ม</p>}
          {st.subjects.map((s) => (
            <SubjectCard key={s.id} s={s} act={act} />
          ))}
        </>
      )}
      {toast && (
        <p role="status" className="fixed inset-x-4 bottom-6 mx-auto max-w-md rounded-2xl border-[2.5px] border-[#2e2a4a] bg-[#ffd66b] px-4 py-3 text-center font-lq font-bold shadow-[4px_4px_0_#2e2a4a]">
          {toast}
        </p>
      )}
    </div>
  );
}

function AddTask({ subjects, onAdd }: { subjects: Subject[]; onAdd: (t: { subject: string; title: string; due: string; help: string }) => void }) {
  const [t, setT] = useState({ subject: subjects[0]?.name ?? "", title: "", due: "", help: "" });
  return (
    <form
      className="lq-card space-y-2.5 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (t.title.trim()) onAdd(t);
      }}
    >
      <p className="font-lq font-bold">จดงานใหม่</p>
      <label className="block text-sm font-semibold">
        วิชา
        <input className="lq-input mt-1" list="lq-subjects" value={t.subject} onChange={(e) => setT({ ...t, subject: e.target.value })} placeholder="เช่น คณิตศาสตร์" />
        <datalist id="lq-subjects">
          {subjects.map((s) => (
            <option key={s.id} value={s.name} />
          ))}
        </datalist>
      </label>
      <label className="block text-sm font-semibold">
        งานที่ได้รับ
        <input className="lq-input mt-1" value={t.title} onChange={(e) => setT({ ...t, title: e.target.value })} placeholder="เช่น แบบฝึกหัดข้อ 1–20" required />
      </label>
      <label className="block text-sm font-semibold">
        กำหนดส่ง
        <input className="lq-input mt-1" type="date" value={t.due} onChange={(e) => setT({ ...t, due: e.target.value })} />
      </label>
      <label className="block text-sm font-semibold">
        อยากให้ช่วยอะไรไหม <span className="font-normal text-[#5e5878]">(ไม่บังคับ)</span>
        <input className="lq-input mt-1" value={t.help} onChange={(e) => setT({ ...t, help: e.target.value })} />
      </label>
      <button className="lq-btn lq-btn-primary w-full">บันทึกงาน</button>
    </form>
  );
}

function AddSubject({ onAdd }: { onAdd: (name: string) => void }) {
  const [name, setName] = useState("");
  return (
    <form
      className="lq-card flex gap-2 p-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim()) onAdd(name);
      }}
    >
      <input className="lq-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="ชื่อวิชา" aria-label="ชื่อวิชา" />
      <button className="lq-btn lq-btn-primary shrink-0">เพิ่ม</button>
    </form>
  );
}

function SubjectCard({ s, act }: { s: Subject; act: (b: Record<string, unknown>) => Promise<boolean> }) {
  const [help, setHelp] = useState(s.help);
  const [score, setScore] = useState({ label: "", score: "", max: "20" });
  const last = s.scores.at(-1);
  const prev = s.scores.at(-2);
  return (
    <div className="lq-card space-y-2.5 p-3.5 !shadow-[3px_3px_0_#2e2a4a]">
      <div className="flex items-center justify-between">
        <p className="font-lq text-[17px] font-bold">{s.name}</p>
        <button className="text-xs text-[#5e5878] underline" onClick={() => confirm(`ลบวิชา ${s.name}?`) && act({ op: "deleteSubject", id: s.id })}>
          ลบ
        </button>
      </div>
      <div className="flex gap-1.5" role="group" aria-label="ระดับความเข้าใจ">
        {(Object.keys(UNDERSTANDING) as Understanding[]).map((lv) => (
          <button
            key={lv}
            aria-pressed={s.level === lv}
            onClick={() => act({ op: "updateSubject", id: s.id, level: lv })}
            className={`min-h-9 flex-1 rounded-full text-[13px] font-semibold ${s.level === lv ? "border-[2.5px] border-[#2e2a4a]" : "border-2 border-[#d8d0ee] bg-white"}`}
            style={s.level === lv ? { background: LEVEL_BG[lv] } : undefined}
          >
            {UNDERSTANDING[lv]}
          </button>
        ))}
      </div>
      {last && (
        <p className="text-[13px]">
          คะแนนล่าสุด{" "}
          <b>
            {last.score}/{last.max}
          </b>{" "}
          ({last.label})
          {prev && <span className="text-[#5e5878]"> · ครั้งก่อน {prev.score}/{prev.max}</span>}
        </p>
      )}
      <form
        className="flex gap-1.5"
        onSubmit={async (e) => {
          e.preventDefault();
          if (await act({ op: "updateSubject", id: s.id, label: score.label, score: Number(score.score), max: Number(score.max) }))
            setScore({ label: "", score: "", max: score.max });
        }}
      >
        <input className="lq-input !px-2 text-sm" placeholder="สอบ/งาน" aria-label="ชื่อการสอบหรืองาน" value={score.label} onChange={(e) => setScore({ ...score, label: e.target.value })} />
        <input className="lq-input w-16 shrink-0 !px-2 text-sm" inputMode="decimal" placeholder="ได้" aria-label="คะแนนที่ได้" value={score.score} onChange={(e) => setScore({ ...score, score: e.target.value })} />
        <input className="lq-input w-16 shrink-0 !px-2 text-sm" inputMode="decimal" placeholder="เต็ม" aria-label="คะแนนเต็ม" value={score.max} onChange={(e) => setScore({ ...score, max: e.target.value })} />
        <button className="lq-btn !min-h-11 shrink-0 !px-3 text-sm" disabled={!score.score}>
          +
        </button>
      </form>
      <label className="block text-[13px] font-semibold">
        อยากให้ช่วยเรื่อง
        <input
          className="lq-input mt-1 text-sm"
          value={help}
          placeholder="เช่น ยังงงเรื่องลิมิต"
          onChange={(e) => setHelp(e.target.value)}
          onBlur={() => help !== s.help && act({ op: "updateSubject", id: s.id, help })}
        />
      </label>
    </div>
  );
}
