"use client";

import Link from "next/link";
import { useState } from "react";
import { CodeDisplay } from "@/components/TimeCode";
import { shiftDay } from "@/lib/date";
import { dayLabel, goalOf, levelFor, UNDERSTANDING, weekLabel, type Message, type WeekEntry } from "@/lib/life/model";
import { Q, TYPE_LABEL, type Question, type QuestionType } from "@/lib/life/questions";
import type { parentState, Redeem } from "@/lib/life/server";
import { answerText, Bar, errorText, hm, Loading, LockIcon, PinPad, post, useApi } from "../shared";

const API = "/api/lq/parent";
type Data = { signedIn: boolean; error?: string } & Partial<Awaited<ReturnType<typeof parentState>>>;
type Tab = "home" | "answers" | "growth" | "questions";

export default function ParentPage() {
  const { data, err, reload, setData } = useApi<Data>(API);
  if (err && err !== "signed-out") return <p className="lq-card mt-10 p-5 text-center">{errorText(err)}</p>;
  if (!data) return <Loading />;
  if (!data.signedIn) return <Login onDone={reload} />;
  return <Dashboard d={data} reload={reload} patch={(p) => setData({ ...data, ...p })} />;
}

function Login({ onDone }: { onDone: () => void }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex flex-col items-center gap-2 pt-10">
      <span className="flex h-16 w-16 items-center justify-center rounded-[22px] border-[2.5px] border-[#2e2a4a] bg-[#6a55e0] shadow-[3px_3px_0_#2e2a4a]">
        <LockIcon />
      </span>
      <h1 className="mt-2 font-lq text-2xl font-bold">โหมดน้า · Parent</h1>
      <p className="mb-4 text-sm text-[#5e5878]">ใส่ PIN ผู้ปกครอง 6 หลัก (PIN เดียวกับหน้าสร้างโค้ดเวลาคอม)</p>
      {msg && <p className="mb-2 text-sm font-semibold text-[#b42357]">{msg}</p>}
      <PinPad
        len={6}
        busy={busy}
        onDone={async (pin) => {
          setBusy(true);
          const r = await post(API, { action: "login", pin });
          setBusy(false);
          if (r.error) setMsg(r.error === "wrong-pin" ? "PIN ไม่ถูก" : errorText(r.error));
          else onDone();
        }}
      />
      <Link href="/life" className="mt-8 text-sm text-[#5b47d6] underline">
        กลับหน้าหลาน
      </Link>
    </div>
  );
}

/** Weeks in a row with a check-in, counting back from this week (or last, if this one isn't sent yet). */
function streakWeeks(weeks: WeekEntry[], week: string) {
  const sent = new Set(weeks.map((w) => w.week));
  let w = sent.has(week) ? week : shiftDay(week, -7);
  let n = 0;
  while (sent.has(w)) {
    n++;
    w = shiftDay(w, -7);
  }
  return n;
}

function Dashboard({ d, reload, patch }: { d: Data; reload: () => void; patch: (p: Partial<Data>) => void }) {
  const [tab, setTab] = useState<Tab>("home");
  const p = d.player;
  const lv = levelFor(p?.xp ?? 0);
  const weeks = d.weeks ?? [];
  const logout = async () => {
    await post(API, { action: "logout" });
    reload();
  };
  return (
    <div className="-mx-4 -mt-[max(1rem,env(safe-area-inset-top))] min-h-[100dvh] bg-[#f6f2ff]">
      <div aria-hidden="true" className="fixed inset-0 -z-10 bg-[#f6f2ff]" />
      <div className="space-y-3.5 border-b-[2.5px] border-[#2e2a4a] bg-[#6a55e0] px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))] text-white">
        <div className="flex items-center justify-between">
          <span className="rounded-full border-2 border-[#2e2a4a] bg-white px-3 py-0.5 font-lq text-[13px] font-bold text-[#2e2a4a]">โหมดน้า · Parent</span>
          <button onClick={logout} className="min-h-11 rounded-[14px] border-2 border-white px-3 font-lq text-[13px] font-semibold">
            ออกจากระบบ
          </button>
        </div>
        <div>
          <h1 className="font-lq text-[26px] font-bold">สวัสดีน้า</h1>
          <p className="text-sm text-[#ede9ff]">{p ? `ภาพรวมการผจญภัยของ${p.name || "หลาน"}` : "หลานยังไม่ได้เริ่มใช้ (ยังไม่ได้ตั้ง PIN)"}</p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-[#2e2a4a]">
          {[
            [String(weeks.length), "เช็กอินที่ส่งแล้ว"],
            [`Lv ${lv.level}`, `${(p?.xp ?? 0).toLocaleString()} XP`],
            [String(streakWeeks(weeks, d.week!)), "สัปดาห์ติดกัน"],
          ].map(([v, k]) => (
            <div key={k} className="flex flex-col items-center rounded-2xl border-[2.5px] border-[#2e2a4a] bg-white px-1 py-2.5">
              <span className="font-lq text-[22px] font-bold">{v}</span>
              <span className="text-center text-xs">{k}</span>
            </div>
          ))}
        </div>
        <nav className="grid grid-cols-4 gap-1.5" aria-label="เมนูน้า">
          {(
            [
              ["home", "ภาพรวม"],
              ["answers", "คำตอบ"],
              ["growth", "พัฒนาการ"],
              ["questions", "คำถาม"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              aria-pressed={tab === id}
              className={`min-h-11 rounded-xl border-2 font-lq text-[13px] font-bold ${tab === id ? "border-[#2e2a4a] bg-[#ffd66b] text-[#2e2a4a]" : "border-white/70 text-white"}`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>
      <div className="space-y-4 px-4 py-4">
        {tab === "home" && <Home d={d} reload={reload} goAnswers={() => setTab("answers")} />}
        {tab === "answers" && <Answers d={d} patch={patch} />}
        {tab === "growth" && <Growth d={d} />}
        {tab === "questions" && <Questions d={d} patch={patch} />}
      </div>
    </div>
  );
}

function Home({ d, reload, goAnswers }: { d: Data; reload: () => void; goAnswers: () => void }) {
  const [issued, setIssued] = useState<Redeem | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const rewards = (d.rewards ?? []).filter((r) => r.owed > 0 || r.week === d.week || r.week === shiftDay(d.week!, -7));
  const owed = (d.rewards ?? []).reduce((a, r) => a + r.owed, 0);
  const thisWeek = (d.weeks ?? []).find((w) => w.week === d.week);
  const lastGoalWeek = (d.weeks ?? []).find((w) => w.week < d.week! && goalOf(w));
  const tasks = d.study?.tasks ?? [];
  const help = [...(d.study?.subjects ?? []).filter((s) => s.help).map((s) => `${s.name} (${s.help})`), ...tasks.filter((t) => t.help && t.status < 2).map((t) => `${t.subject || t.title} (${t.help})`)];

  const redeem = async () => {
    setBusy(true);
    setErr(null);
    const r = await post<{ redeem: Redeem }>(API, { action: "redeem" });
    setBusy(false);
    if (r.error)
      setErr(
        r.error === "same-minute" ? "เพิ่งสร้างโค้ดไปในนาทีนี้ รอนาทีใหม่แล้วกดอีกครั้ง" : r.error === "nothing" ? "ยังไม่มีเวลาให้แลก" : r.error === "no-kidtimer" ? "ยังไม่ได้ตั้งค่า KIDTIMER_KEY" : errorText(r.error),
      );
    else {
      setIssued(r.redeem);
      reload();
    }
  };
  const download = () => {
    const blob = new Blob([JSON.stringify(d, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `life-quest-backup-${d.today}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const resetPin = async () => {
    if (!confirm("รีเซ็ต PIN ของหลาน? หลานจะต้องตั้ง PIN ใหม่ ข้อมูลอื่นอยู่ครบ")) return;
    await post(API, { action: "resetPin" });
    reload();
  };

  return (
    <>
      <section className="lq-card overflow-hidden">
        <div className="flex items-center justify-between border-b-[2.5px] border-[#2e2a4a] bg-[#ffd66b] px-4 py-3">
          <h2 className="font-lq text-[17px] font-bold">เวลาคอมรอแลก</h2>
          <span className="font-lq text-[22px] font-bold">{hm(owed)} ชม.</span>
        </div>
        <div className="space-y-2 px-4 py-3 text-sm">
          {rewards.length === 0 && <p className="text-[#5e5878]">ยังไม่มี Daily จาก Brain Dojo ที่ส่งเข้ามา</p>}
          {rewards.map((r) => (
            <div key={r.week} className="space-y-1">
              <p className="font-lq text-[13px] font-bold text-[#5b47d6]">
                {weekLabel(r.week)} · {r.unlocked ? "ส่งเช็กอินแล้ว" : r.expired ? "ไม่ได้ส่งเช็กอิน" : "ยังไม่ส่งเช็กอิน"}
              </p>
              <div className="flex justify-between">
                <span>Daily {r.days.length} วัน · ส่วน 70%</span>
                <span className="font-semibold">{hm(r.total - r.held)}</span>
              </div>
              <div className={`flex justify-between ${r.unlocked ? "" : "text-[#5e5878]"}`}>
                <span>{r.unlocked ? "ส่วน 30% ปลดล็อกจากเช็กอิน" : r.expired ? "ส่วน 30% หมดอายุ" : "ส่วน 30% รอเช็กอิน (ยังแลกไม่ได้)"}</span>
                <span className={r.expired ? "line-through" : "font-semibold"}>{hm(r.held)}</span>
              </div>
              {r.paid > 0 && (
                <div className="flex justify-between text-[#5e5878]">
                  <span>แลกไปแล้ว</span>
                  <span>−{hm(r.paid)}</span>
                </div>
              )}
            </div>
          ))}
          <p className="text-xs text-[#5e5878]">ยอดรวมเท่าสูตร Daily เดิม แค่ 30% ต้องส่งเช็กอินก่อน · ผล Daily ส่งมาจากมือถือหลานเอง</p>
          <button className="lq-btn lq-btn-primary mt-1 w-full" disabled={busy || owed < 15} onClick={redeem}>
            {busy ? "กำลังสร้าง…" : `สร้างโค้ดเวลาคอม ${hm(owed)} ชม.`}
          </button>
          {err && <p className="text-sm font-semibold text-[#b42357]">{err}</p>}
          {issued && (
            <div className="pt-2 text-center">
              <CodeDisplay code={issued.code} minutes={issued.minutes} />
              <p className="mt-2 text-xs text-[#5e5878]">ส่งโค้ดนี้ให้หลานพิมพ์ที่คอม · ใช้ได้ครั้งเดียว</p>
            </div>
          )}
          {!issued && d.redeems?.[0] && (
            <p className="text-xs text-[#5e5878]">
              โค้ดล่าสุด <span className="select-all font-mono font-bold text-[#2e2a4a]">{d.redeems[0].code}</span> ({hm(d.redeems[0].minutes)} ชม. ·{" "}
              {new Date(d.redeems[0].at).toLocaleDateString("th-TH", { day: "numeric", month: "short" })})
            </p>
          )}
        </div>
      </section>

      <section className="lq-card space-y-2.5 p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-lq text-[17px] font-bold">สัปดาห์นี้ · {d.weekLabel}</h2>
          <span className={`rounded-full border-2 border-[#2e2a4a] px-2.5 text-xs font-semibold ${thisWeek ? "bg-[#bdefd9]" : "bg-[#fff1c9]"}`}>
            {thisWeek ? "ส่งแล้ว" : d.draftAnswered ? "กำลังทำ" : "ยังไม่ส่ง"}
          </span>
        </div>
        <p className="text-sm leading-relaxed text-[#4a4566]">
          {thisWeek
            ? `ส่งเมื่อ ${new Date(thisWeek.submittedAt).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}`
            : d.draftAnswered
              ? `หลานตอบในร่างไปแล้ว ${d.draftAnswered} ข้อ (ร่างที่ยังไม่ส่ง น้าจะไม่เห็นเนื้อหา)`
              : "หลานยังไม่ได้เริ่มเช็กอินสัปดาห์นี้"}
        </p>
        {(d.weeks ?? []).length > 0 && (
          <button className="lq-btn lq-btn-lav w-full text-[15px]" onClick={goAnswers}>
            ดูคำตอบรายสัปดาห์
          </button>
        )}
      </section>

      {lastGoalWeek && (
        <div className="space-y-1 rounded-[20px] border-[2.5px] border-dashed border-[#2e2a4a] bg-[#fff1c9] px-3.5 py-3">
          <p className="font-lq text-xs font-semibold text-[#6b4e00]">เป้าหมายที่หลานตั้งไว้สำหรับสัปดาห์นี้</p>
          <p className="text-[15px] font-semibold">{goalOf(lastGoalWeek)!.text}</p>
          <p className="text-xs text-[#4a4566]">{lastGoalWeek.goalDone ? "หลานติ๊กว่าทำสำเร็จแล้ว" : "ยังไม่ได้ติ๊กว่าสำเร็จ"}</p>
        </div>
      )}

      <section className="lq-card space-y-2.5 p-4">
        <h2 className="font-lq text-[17px] font-bold">ภาพรวมการเรียน</h2>
        <div className="flex gap-2">
          {[
            ["งานค้าง", tasks.filter((t) => t.status === 0).length, "#ffe3ee"],
            ["กำลังทำ", tasks.filter((t) => t.status === 1).length, "#fff1c9"],
            ["เสร็จ/ส่งแล้ว", tasks.filter((t) => t.status >= 2).length, "#e2f7ee"],
          ].map(([k, v, bg]) => (
            <span key={k} className="flex flex-1 flex-col items-center rounded-[14px] border-2 border-[#2e2a4a] py-2" style={{ background: bg as string }}>
              <span className="font-lq text-xl font-bold">{v}</span>
              <span className="text-xs">{k}</span>
            </span>
          ))}
        </div>
        {tasks
          .filter((t) => t.status < 2 && t.due)
          .sort((a, b) => a.due.localeCompare(b.due))
          .slice(0, 4)
          .map((t) => (
            <p key={t.id} className="flex justify-between gap-2 text-sm">
              <span className="min-w-0 truncate">
                {t.subject ? `${t.subject}: ` : ""}
                {t.title}
              </span>
              <span className={`shrink-0 ${t.due < d.today! ? "font-bold text-[#b42357]" : "text-[#5e5878]"}`}>ส่ง {dayLabel(t.due)}</span>
            </p>
          ))}
        {help.length > 0 && (
          <p className="text-sm">
            <b>อยากให้ช่วย:</b> {help.join(" · ")}
          </p>
        )}
        {(d.study?.subjects ?? []).some((s) => s.level === "good") && (
          <p className="text-sm text-[#4a4566]">
            เข้าใจดี:{" "}
            {d
              .study!.subjects.filter((s) => s.level === "good")
              .map((s) => s.name)
              .join(", ")}
          </p>
        )}
      </section>

      <section className="lq-card space-y-2.5 p-4">
        <h2 className="font-lq text-[17px] font-bold">บันทึกล่าสุด</h2>
        {(d.log ?? []).length === 0 && <p className="text-sm text-[#5e5878]">ยังไม่มี</p>}
        {(d.log ?? []).slice(0, 8).map((l, i) => (
          <p key={i} className="flex gap-2.5 text-sm">
            <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#6a55e0]" />
            <span className="flex-1">{l.text}</span>
            <span className="shrink-0 text-xs text-[#5e5878]">{new Date(l.at).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}</span>
          </p>
        ))}
      </section>

      <div className="grid grid-cols-2 gap-3">
        <button className="lq-btn text-sm" onClick={download}>
          ดาวน์โหลดสำรองข้อมูล
        </button>
        <button className="lq-btn text-sm" onClick={resetPin} disabled={!d.hasPin}>
          รีเซ็ต PIN หลาน
        </button>
      </div>
      <Link href="/parent" className="block text-center text-sm text-[#5b47d6] underline">
        สร้างโค้ดเวลาคอมเอง (รางวัลพิเศษ)
      </Link>
    </>
  );
}

const TEMPLATES = ["น้าเห็นความพยายามของเรานะ", "ค่อยๆ พัฒนาไปทีละนิดก็ได้", "ไม่เป็นไร ลองใหม่สัปดาห์หน้า", "น้าพร้อมช่วยเสมอ"];

function Answers({ d, patch }: { d: Data; patch: (p: Partial<Data>) => void }) {
  const weeks = d.weeks ?? [];
  const [sel, setSel] = useState(weeks[0]?.week ?? "");
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState(false);
  const w = weeks.find((x) => x.week === sel);
  const send = async () => {
    if (!msg.trim()) return;
    const r = await post<{ messages: Message[] }>(API, { action: "message", text: msg });
    if (!r.error) {
      patch({ messages: r.messages });
      setSent(true);
      setMsg("");
    }
  };
  return (
    <>
      {weeks.length === 0 ? (
        <p className="lq-card p-4 text-center text-sm text-[#5e5878]">ยังไม่มีเช็กอินที่ส่งแล้ว</p>
      ) : (
        <>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
            {weeks.map((x) => (
              <button key={x.week} className="lq-chip shrink-0 !rounded-[14px] font-lq text-sm font-bold" aria-pressed={x.week === sel} onClick={() => setSel(x.week)}>
                {weekLabel(x.week)}
              </button>
            ))}
          </div>
          {w && (
            <>
              <div className="flex justify-between px-1 text-[13px] text-[#4a4566]">
                <span>ส่งเมื่อ {new Date(w.submittedAt).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}</span>
                <span className="font-semibold">{w.history.length ? `แก้ไข ${w.history.length} ครั้ง` : "ไม่มีการแก้ไข"}</span>
              </div>
              <div className="lq-card divide-y-[1.5px] divide-dashed divide-[#d8d0ee] px-3.5 py-1.5">
                {w.questions.map((q, i) => {
                  const a = w.answers[q.id];
                  const edited = w.history.some((h) => h.changed.includes(q.id));
                  return (
                    <div key={q.id} className="space-y-1 py-2.5">
                      <p className="text-xs text-[#5e5878]">
                        {i + 1}. {q.text}
                        {edited && <span className="ml-1 rounded bg-[#fff1c9] px-1 text-[10px] font-bold text-[#6b4e00]">แก้ไขแล้ว</span>}
                      </p>
                      <p className="text-[15px] font-semibold leading-snug">{answerText(a)}</p>
                      {a?.text && <p className="rounded-lg bg-[#fff6ec] px-2.5 py-1.5 text-sm leading-relaxed">&ldquo;{a.text}&rdquo;</p>}
                    </div>
                  );
                })}
              </div>
              {w.history.length > 0 && (
                <p className="px-1 text-xs text-[#5e5878]">
                  ประวัติการแก้ไข:{" "}
                  {w.history
                    .map((h) => `${new Date(h.at).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })} (${h.changed.length} ข้อ)`)
                    .join(" · ")}
                </p>
              )}
            </>
          )}
        </>
      )}

      <section className="space-y-2.5 rounded-[22px] border-[2.5px] border-[#2e2a4a] bg-[#ffe3ee] p-4 shadow-[4px_4px_0_#2e2a4a]">
        <h2 className="font-lq text-[17px] font-bold">ส่งกำลังใจให้หลาน</h2>
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map((t) => (
            <button key={t} className="min-h-10 rounded-full border-2 border-[#2e2a4a] bg-white px-3 text-[13px]" onClick={() => (setMsg(t), setSent(false))}>
              {t}
            </button>
          ))}
        </div>
        <label className="block text-[13px] font-semibold">
          หรือเขียนเอง
          <textarea className="lq-input mt-1 resize-none" rows={3} value={msg} maxLength={500} onChange={(e) => (setMsg(e.target.value), setSent(false))} placeholder="เช่น สัปดาห์นี้ส่งงานครบ น้าภูมิใจนะ" />
        </label>
        {sent ? (
          <p className="rounded-2xl border-[2.5px] border-[#2e2a4a] bg-[#bdefd9] py-3 text-center font-lq font-bold">ส่งแล้ว · จะขึ้นที่หน้าแรกของหลาน</p>
        ) : (
          <button className="lq-btn lq-btn-primary w-full" disabled={!msg.trim()} onClick={send}>
            ส่งข้อความ
          </button>
        )}
        {(d.messages ?? []).length > 0 && (
          <div className="space-y-1 pt-1 text-[13px] text-[#4a4566]">
            <p className="font-semibold">ที่เคยส่ง</p>
            {(d.messages ?? []).slice(0, 5).map((m) => (
              <p key={m.id}>
                {new Date(m.at).toLocaleDateString("th-TH", { day: "numeric", month: "short" })} · {m.text}
              </p>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

const RATE_BG = ["#ffe3ee", "#ffe3ee", "#fff1c9", "#bdefd9", "#bdefd9"];

function Growth({ d }: { d: Data }) {
  const weeks = [...(d.weeks ?? [])].reverse();
  const recent = weeks.slice(-8);
  const goals = (d.weeks ?? []).filter((w) => goalOf(w));
  if (!weeks.length) return <p className="lq-card p-4 text-center text-sm text-[#5e5878]">ยังไม่มีข้อมูล · ต้องมีเช็กอินอย่างน้อย 1 สัปดาห์</p>;
  return (
    <>
      <section className="lq-card space-y-2.5 p-4">
        <div className="flex items-baseline justify-between">
          <h2 className="font-lq font-bold">จัดการเวลา</h2>
          <span className="text-xs text-[#5e5878]">{recent.length} สัปดาห์ล่าสุด · เต็ม 5</span>
        </div>
        <div className="flex h-32 items-end gap-2 border-b-2 border-[#2e2a4a] px-1">
          {recent.map((w) => {
            const v = w.answers[Q.timeMgmt]?.rating;
            return (
              <div key={w.week} className="flex flex-1 flex-col items-center gap-1">
                <span className="font-lq text-xs font-bold">{v ?? "–"}</span>
                <span className="w-full rounded-t-lg border-2 border-b-0 border-[#2e2a4a]" style={{ height: (v ?? 0) * 18, background: v ? RATE_BG[v - 1] : "transparent" }} />
              </div>
            );
          })}
        </div>
        <div className="flex gap-2 px-1">
          {recent.map((w) => (
            <span key={w.week} className="flex-1 text-center text-[10px] text-[#5e5878]">
              {dayLabel(w.week)}
            </span>
          ))}
        </div>
      </section>

      <section className="lq-card space-y-2.5 p-4">
        <h2 className="font-lq font-bold">ความรู้สึกแต่ละสัปดาห์</h2>
        <div className="grid grid-cols-4 gap-1.5">
          {recent.map((w) => (
            <div key={w.week} className="flex flex-col items-center gap-1">
              <span className="flex min-h-10 w-full items-center justify-center rounded-xl border-2 border-[#2e2a4a] bg-[#eee8ff] px-1 text-center text-xs font-semibold">
                {w.answers[Q.mood]?.picks?.[0] ?? "ข้าม"}
              </span>
              <span className="text-[10px] text-[#5e5878]">{dayLabel(w.week)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="lq-card space-y-3 p-4">
        <h2 className="font-lq font-bold">Timeline ความสนใจ</h2>
        <div className="space-y-2.5 border-l-[3px] border-[#cdbeff] pl-3.5">
          {[...weeks].reverse().map((w) => (
            <div key={w.week}>
              <p className="font-lq text-[13px] font-semibold text-[#5b47d6]">{weekLabel(w.week)}</p>
              <p className="text-sm">
                {(w.answers[Q.interests]?.picks ?? []).join(", ") || "—"}
                {w.answers[Q.try]?.text ? ` · อยากลอง: "${w.answers[Q.try]?.text}"` : ""}
              </p>
            </div>
          ))}
        </div>
        <div className="space-y-1.5">
          <p className="text-[13px] font-semibold">คณะ / อาชีพที่เริ่มสนใจ</p>
          <div className="flex flex-wrap gap-1.5">
            {(d.player?.careers ?? []).map((c) => (
              <span key={c} className="rounded-full border-2 border-[#2e2a4a] bg-[#eee8ff] px-2.5 text-[13px] font-semibold">
                {c}
              </span>
            ))}
            {!(d.player?.careers ?? []).length && <span className="text-[13px] text-[#5e5878]">หลานยังไม่ได้เพิ่ม (เพิ่มได้ใน My Journal)</span>}
          </div>
        </div>
      </section>

      {goals.length > 0 && (
        <section className="lq-card space-y-2 p-4">
          <div className="flex items-baseline justify-between">
            <h2 className="font-lq font-bold">เป้าหมายที่เปลี่ยนไป</h2>
            <span className="text-xs font-semibold">
              สำเร็จ {goals.filter((w) => w.goalDone).length} / {goals.length}
            </span>
          </div>
          {goals.map((w) => (
            <p key={w.week} className="flex items-center gap-2.5 text-sm">
              <span className={`h-5 w-5 shrink-0 rounded-md border-2 border-[#2e2a4a] ${w.goalDone ? "bg-[#bdefd9]" : "bg-white"}`} />
              <span className="flex-1">{goalOf(w)!.text}</span>
              <span className="text-xs text-[#5e5878]">{dayLabel(w.week)}</span>
            </p>
          ))}
        </section>
      )}

      {(d.study?.subjects ?? []).length > 0 && (
        <section className="lq-card space-y-2.5 p-4">
          <h2 className="font-lq font-bold">คะแนนรายวิชา</h2>
          {d.study!.subjects.map((s) => {
            const last = s.scores.at(-1);
            const prev = s.scores.at(-2);
            return (
              <div key={s.id} className="space-y-1">
                <p className="flex justify-between text-sm">
                  <span className="font-semibold">
                    {s.name} <span className="font-normal text-[#5e5878]">· {UNDERSTANDING[s.level]}</span>
                  </span>
                  <span>
                    {last ? `${last.score}/${last.max}` : "—"}
                    {prev && <span className="text-[#5e5878]"> · จาก {prev.score}/{prev.max}</span>}
                  </span>
                </p>
                <Bar pct={last ? (last.score / last.max) * 100 : 0} color={s.level === "weak" ? "#ffb5cf" : s.level === "good" ? "#bdefd9" : "#ffd66b"} h="h-3" />
              </div>
            );
          })}
        </section>
      )}
    </>
  );
}

const TYPES: QuestionType[] = ["single", "multi", "rating", "text"];

function Questions({ d, patch }: { d: Data; patch: (p: Partial<Data>) => void }) {
  const [list, setList] = useState<Question[]>(d.questions ?? []);
  const [editing, setEditing] = useState<number | null>(null);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const dirty = JSON.stringify(list) !== JSON.stringify(d.questions);

  const save = async () => {
    setState("saving");
    const r = await post<{ questions: Question[] }>(API, { action: "questions", questions: list });
    if (r.error) return setState("error");
    patch({ questions: r.questions });
    setList(r.questions);
    setEditing(null);
    setState("saved");
  };
  const update = (i: number, q: Partial<Question>) => setList(list.map((x, k) => (k === i ? { ...x, ...q } : x)));
  const move = (i: number, by: number) => {
    const j = i + by;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    setList(next);
  };

  return (
    <>
      <section className="lq-card space-y-2 p-4 text-sm">
        <h2 className="font-lq text-[17px] font-bold">Weekly Quest</h2>
        <p className="flex justify-between">
          <span>สัปดาห์</span>
          <b>อาทิตย์ – เสาร์</b>
        </p>
        <p className="flex justify-between">
          <span>XP ต่อการส่ง</span>
          <b>100 + เขียนเพิ่ม ข้อละ 10</b>
        </p>
        <p className="flex justify-between">
          <span>เวลาคอมจาก Daily</span>
          <b>70% ทันที · 30% หลังเช็กอิน</b>
        </p>
      </section>
      <div className="flex items-baseline justify-between px-1">
        <h2 className="font-lq font-bold">คำถาม ({list.filter((q) => q.active).length} เปิดใช้)</h2>
        <span className="text-xs text-[#5e5878]">ปิดแล้วคำตอบเก่ายังอยู่ครบ</span>
      </div>
      {list.map((q, i) =>
        editing === i ? (
          <QuestionEditor key={q.id} q={q} onChange={(p) => update(i, p)} onDone={() => setEditing(null)} onDelete={() => (setList(list.filter((_, k) => k !== i)), setEditing(null))} />
        ) : (
          <div key={q.id} className="flex items-center gap-2 rounded-[18px] border-[2.5px] border-[#2e2a4a] bg-white px-3 py-2.5">
            <div className="flex flex-col">
              <button aria-label="เลื่อนขึ้น" className="h-6 w-7 text-xs" onClick={() => move(i, -1)}>
                ▲
              </button>
              <button aria-label="เลื่อนลง" className="h-6 w-7 text-xs" onClick={() => move(i, 1)}>
                ▼
              </button>
            </div>
            <div className={`min-w-0 flex-1 ${q.active ? "" : "opacity-50"}`}>
              <p className="text-sm leading-snug">{q.text}</p>
              <span className="mt-0.5 inline-block rounded-full border-[1.5px] border-[#2e2a4a] bg-[#eee8ff] px-2 text-[11px] font-semibold">{TYPE_LABEL[q.type]}</span>
            </div>
            <button aria-label={`แก้ไขคำถาม ${i + 1}`} className="h-10 w-10 shrink-0 rounded-xl border-2 border-[#2e2a4a]" onClick={() => setEditing(i)}>
              ✎
            </button>
            <button
              role="switch"
              aria-checked={q.active}
              aria-label={`${q.active ? "ปิด" : "เปิด"}คำถาม ${i + 1}`}
              onClick={() => update(i, { active: !q.active })}
              className={`flex h-8 w-[52px] shrink-0 rounded-full border-2 border-[#2e2a4a] p-0.5 ${q.active ? "justify-end bg-[#6a55e0]" : "justify-start bg-[#e6e0f5]"}`}
            >
              <span className="h-6 w-6 rounded-full border-2 border-[#2e2a4a] bg-white" />
            </button>
          </div>
        ),
      )}
      <button
        className="lq-btn w-full"
        onClick={() => {
          setList([...list, { id: `q-${Date.now().toString(36)}`, topic: "คำถามใหม่", text: "", type: "text", textLabel: "คำตอบ", active: true }]);
          setEditing(list.length);
        }}
      >
        + เพิ่มคำถาม
      </button>
      <div className="sticky bottom-3 flex gap-2">
        <button className="lq-btn lq-btn-primary flex-1" disabled={!dirty || state === "saving"} onClick={save}>
          {state === "saving" ? "กำลังบันทึก…" : dirty ? "บันทึกคำถาม" : state === "saved" ? "บันทึกแล้ว" : "ไม่มีอะไรเปลี่ยน"}
        </button>
        <button
          className="lq-btn text-sm"
          onClick={async () => {
            if (!confirm("กลับไปใช้ 10 คำถามตั้งต้น?")) return;
            const r = await post<{ questions: Question[] }>(API, { action: "resetQuestions" });
            if (r.error) return;
            patch({ questions: r.questions });
            setList(r.questions);
          }}
        >
          ตั้งต้น
        </button>
      </div>
      {state === "error" && <p className="text-center text-sm font-semibold text-[#b42357]">บันทึกไม่ได้ · คำถามแบบเลือกต้องมีตัวเลือกอย่างน้อย 2 ข้อ และต้องมีข้อความคำถาม</p>}
    </>
  );
}

function QuestionEditor({ q, onChange, onDone, onDelete }: { q: Question; onChange: (p: Partial<Question>) => void; onDone: () => void; onDelete: () => void }) {
  const choice = q.type === "single" || q.type === "multi";
  return (
    <div className="lq-card space-y-2.5 p-3.5">
      <label className="block text-[13px] font-semibold">
        คำถาม
        <textarea className="lq-input mt-1 resize-none text-sm" rows={2} value={q.text} onChange={(e) => onChange({ text: e.target.value })} />
      </label>
      <label className="block text-[13px] font-semibold">
        หัวข้อสั้นๆ
        <input className="lq-input mt-1 text-sm" value={q.topic} onChange={(e) => onChange({ topic: e.target.value })} />
      </label>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="ประเภทคำตอบ">
        {TYPES.map((t) => (
          <button key={t} className="lq-chip !min-h-9 !px-3 text-[13px]" aria-pressed={q.type === t} onClick={() => onChange({ type: t, ...(t === "single" || t === "multi" ? { options: q.options?.length ? q.options : ["ตัวเลือก 1", "ตัวเลือก 2"] } : {}) })}>
            {TYPE_LABEL[t]}
          </button>
        ))}
      </div>
      {choice && (
        <label className="block text-[13px] font-semibold">
          ตัวเลือก (บรรทัดละ 1 ข้อ)
          <textarea
            className="lq-input mt-1 resize-none text-sm"
            rows={5}
            value={(q.options ?? []).join("\n")}
            onChange={(e) => onChange({ options: e.target.value.split("\n") })}
          />
        </label>
      )}
      <label className="block text-[13px] font-semibold">
        ช่องเขียนเพิ่มเติม (เว้นว่าง = ไม่มี{q.type === "text" ? ", แต่แบบเขียนเองจะมีช่องเสมอ" : ""})
        <input className="lq-input mt-1 text-sm" value={q.textLabel ?? ""} onChange={(e) => onChange({ textLabel: e.target.value || undefined })} placeholder="เช่น สิ่งที่อยากปรับปรุง" />
      </label>
      <div className="flex gap-2">
        <button className="lq-btn flex-1 text-sm" onClick={onDone}>
          เสร็จ
        </button>
        <button className="lq-btn text-sm text-[#b42357]" onClick={() => confirm("ลบคำถามนี้? (คำตอบเก่ายังอยู่)") && onDelete()}>
          ลบ
        </button>
      </div>
    </div>
  );
}
