"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { adoptAccount, afterHydration, afterSignIn, nameIfBlank, pullProgress, syncDailies, syncProgress } from "@/components/LifeSync";
import { PlayerLogin } from "./login";
import { ACHIEVEMENTS, goalOf, weekEnd } from "@/lib/life/model";
import { shiftDay } from "@/lib/date";
import { Bar, errorText, hm, Loading, LockIcon, PinPad, post, useApi, type PlayerData } from "./shared";

const API = "/api/lq/player";
const DAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

export default function LifeHome() {
  return (
    <Suspense fallback={<Loading />}>
      <LifeQuest />
    </Suspense>
  );
}

function LifeQuest() {
  const { data, err, reload } = useApi<PlayerData>(API);
  // Brain Dojo's lock sends "I'm new" here with ?new=1.
  const isNew = useSearchParams().has("new");
  const [creating, setCreating] = useState(isNew);
  if (err && err !== "signed-out") return <p className="lq-card mt-10 p-5 text-center">{errorText(err)}</p>;
  if (!data) return <Loading />;
  if (!data.signedIn) {
    const players = data.players ?? [];
    if (creating || !players.length)
      return <Welcome taken={players.map((p) => p.name)} onBack={players.length ? () => setCreating(false) : undefined} onDone={reload} />;
    return <PlayerLogin players={players} title="Weekly Life Quest" onNew={() => setCreating(true)} onDone={reload} />;
  }
  return <Home d={data} reload={reload} />;
}

function Point({ bg, icon, children }: { bg: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-[#2e2a4a]" style={{ background: bg }}>
        {icon}
      </span>
      <p className="text-sm leading-relaxed">{children}</p>
    </div>
  );
}

const ico = (d: string) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2e2a4a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

/** A new account: what the parent can see, your own name, then a 4-digit PIN (twice). */
function Welcome({ taken, onBack, onDone }: { taken: string[]; onBack?: () => void; onDone: () => void }) {
  const [step, setStep] = useState<"intro" | "set" | "confirm">("intro");
  const [name, setName] = useState("");
  const [first, setFirst] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (step === "intro")
    return (
      <div className="flex min-h-[85dvh] flex-col gap-4 pt-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <svg width="110" height="100" viewBox="0 0 120 112" fill="none" stroke="#2e2a4a" strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
            <path d="M14 30c0-6 4-10 10-10h30c4 0 6 2 6 5 0-3 2-5 6-5h30c6 0 10 4 10 10v62c0 4-3 6-6 6H66c-3 0-6 2-6 5 0-3-3-5-6-5H20c-3 0-6-2-6-6z" fill="#fff" />
            <path d="M60 25v78" />
            <path d="M24 38h24M24 48h20M24 58h24M72 38h24M72 48h18" stroke="#cdbeff" strokeWidth="3" />
            <path d="M84 62l4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z" fill="#ffd66b" />
          </svg>
          <h1 className="font-lq text-3xl font-bold">Weekly Life Quest</h1>
          <p className="text-[15px] text-[#5e5878]">สมุดบันทึกการผจญภัยของเรา สัปดาห์ละครั้ง ใช้เวลาแค่ 5 นาที</p>
        </div>
        <div className="lq-card flex flex-col gap-3 p-4">
          <p className="font-lq text-lg font-bold">ก่อนเริ่ม อยากให้รู้ไว้</p>
          <Point bg="#ffe3ee" icon={ico("M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 100 6 3 3 0 000-6z")}>
            <b>พี่แตงพี่หยกอ่านคำตอบที่เรากดส่งแล้วได้</b> เพื่อจะได้รู้ว่าช่วยอะไรเราได้บ้าง
          </Point>
          <Point bg="#eee8ff" icon={ico("M4 20h4L19 9l-4-4L4 16z")}>
            <b>ร่างที่ยังไม่ส่ง พี่แตงพี่หยกไม่เห็น</b> ค่อยๆ คิด แก้กี่รอบก็ได้
          </Point>
          <Point bg="#e2f7ee" icon={ico("M12 21s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 11c0 5.5-7 10-7 10z")}>
            <b>ไม่มีคำตอบผิด ไม่มีการหักคะแนน</b> ตอบว่า &quot;ยังไม่แน่ใจ&quot; ก็ได้ XP
          </Point>
          <Point bg="#fff1c9" icon={ico("M4 5h16v11H4zM9 20h6M12 16v4")}>
            <b>เวลาคอมจาก Daily</b> ได้ทันที 70% อีก 30% ปลดล็อกเมื่อส่งเช็กอินของสัปดาห์
          </Point>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">ชื่อเล่นของเรา (ใช้เลือกตอนเข้าเล่น)</span>
          <input className="lq-input" value={name} onChange={(e) => setName(e.target.value)} maxLength={30} placeholder="เช่น เตตัส" />
        </label>
        <div className="flex-1" />
        {msg && <p className="text-center text-sm font-semibold text-[#b42357]">{msg}</p>}
        <button
          className="lq-btn lq-btn-primary w-full text-lg"
          disabled={!name.trim()}
          onClick={() => {
            if (taken.some((t) => t.trim().toLowerCase() === name.trim().toLowerCase())) return setMsg("ชื่อนี้มีคนใช้แล้ว ลองชื่ออื่นนะ");
            setMsg(null);
            setStep("set");
          }}
        >
          เข้าใจแล้ว · ตั้ง PIN
        </button>
        {onBack && (
          <button className="min-h-11 text-sm text-[#5b47d6] underline" onClick={onBack}>
            มีบัญชีแล้ว กลับไปเลือกชื่อ
          </button>
        )}
      </div>
    );

  const done = async (pin: string) => {
    if (step === "set") {
      setFirst(pin);
      setMsg(null);
      return setStep("confirm");
    }
    if (pin !== first) {
      setMsg("PIN ไม่ตรงกัน ลองตั้งใหม่อีกครั้งนะ");
      return setStep("set");
    }
    setBusy(true);
    const r = await post<{ id: string }>(API, { action: "signup", pin, name: name.trim() });
    setBusy(false);
    if (r.error) {
      setMsg(r.error === "name-taken" ? "ชื่อนี้มีคนใช้แล้ว ลองชื่ออื่นนะ" : r.error === "too-many" ? "มีบัญชีเต็มแล้ว ให้พี่แตงพี่หยกลบบัญชีที่ไม่ใช้ก่อน" : errorText(r.error));
      return setStep(r.error === "name-taken" ? "intro" : "set");
    }
    await afterSignIn(r.id, name.trim());
    onDone();
  };

  return (
    <div className="flex flex-col items-center gap-2 pt-10">
      <span className="flex h-16 w-16 items-center justify-center rounded-[22px] border-[2.5px] border-[#2e2a4a] bg-[#cdbeff] shadow-[3px_3px_0_#2e2a4a]">
        <LockIcon />
      </span>
      <h1 className="mt-2 font-lq text-2xl font-bold">{step === "confirm" ? "ใส่ PIN อีกครั้ง" : "ตั้ง PIN 4 หลัก"}</h1>
      <p className="mb-4 text-center text-sm text-[#5e5878]">
        {step === "confirm" ? "เพื่อยืนยันว่าจำได้" : "ใช้เข้าสมุดบันทึกของเรา พี่แตงพี่หยกใช้ PIN ของพี่แตงพี่หยกเองแยกกัน"}
      </p>
      {msg && <p className="mb-2 text-sm font-semibold text-[#b42357]">{msg}</p>}
      <PinPad key={step} len={4} onDone={done} busy={busy} />
      <p className="mt-6 text-center text-xs text-[#5e5878]">ต้องตั้ง PIN ก่อนใช้งาน · ลืม PIN ให้พี่แตงพี่หยกรีเซ็ตให้ได้</p>
    </div>
  );
}

function Avatar() {
  return (
    <svg width="80" height="80" viewBox="0 0 86 86" fill="none" stroke="#2e2a4a" strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" role="img" aria-label="Avatar" className="shrink-0">
      <rect x="3" y="3" width="80" height="80" rx="26" fill="#fff6ec" />
      <path d="M20 44c0-16 10-26 23-26s23 10 23 26" fill="#6a55e0" />
      <path d="M43 10l4 9h-8z" fill="#ffd66b" />
      <ellipse cx="43" cy="52" rx="20" ry="18" fill="#ffe3ee" />
      <circle cx="35" cy="51" r="3" fill="#2e2a4a" />
      <circle cx="51" cy="51" r="3" fill="#2e2a4a" />
      <ellipse cx="29" cy="59" rx="4" ry="2.4" fill="#ffb5cf" stroke="none" />
      <ellipse cx="57" cy="59" rx="4" ry="2.4" fill="#ffb5cf" stroke="none" />
      <path d="M39 60q4 3 8 0" />
      <path d="M24 74c4-4 10-6 19-6s15 2 19 6" fill="#bdefd9" />
    </svg>
  );
}

function Home({ d, reload }: { d: PlayerData; reload: () => void }) {
  const p = d.player!;
  const lv = d.level!;
  const week = d.week!;
  const today = d.today!;
  const qCount = d.questions?.length ?? 10;
  const answered = d.draft ? Object.keys(d.draft.answers).length : 0;
  const thisReward = d.rewards?.find((r) => r.week === week);
  const owedNow = (d.rewards ?? []).reduce((a, r) => a + r.owed, 0);
  const lastGoalWeek = (d.weeks ?? []).find((w) => w.week < week && goalOf(w));
  const goal = lastGoalWeek ? goalOf(lastGoalWeek) : null;
  const msg = d.messages?.[0];
  const tasks = d.study?.tasks ?? [];
  const days = Array.from({ length: 7 }, (_, i) => shiftDay(week, i));
  const played = new Set(d.dailyDays ?? []);

  // Dailies played before signing in on this phone go up now.
  const id = d.id!;
  const name = p.name;
  useEffect(
    () =>
      afterHydration(() => {
        adoptAccount(id, name);
        void syncDailies(true).then((n) => n && reload());
        // This PIN's save first (it may come from another phone), then anything new from this one.
        void pullProgress().then(() => (nameIfBlank(name), syncProgress()));
      }),
    [reload, id, name],
  );

  const logout = async () => {
    await syncProgress(); // this phone's latest goes up before someone else signs in
    await post(API, { action: "logout" });
    try {
      localStorage.removeItem("lq-open"); // Brain Dojo locks again too
    } catch {
      /* fine */
    }
    reload();
  };

  return (
    <div className="-mx-4 -mt-[max(1rem,env(safe-area-inset-top))]">
      <div className="border-b-[2.5px] border-[#2e2a4a] bg-[#cdbeff] px-4 pb-5 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex min-h-11 items-center gap-1.5 font-lq text-sm font-semibold">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2e2a4a" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" />
            </svg>
            Brain Dojo
          </Link>
          <span className="font-lq font-bold">Weekly Life Quest</span>
          <button onClick={logout} aria-label="ออกจากระบบ" className="flex h-11 w-11 items-center justify-center rounded-[14px] border-[2.5px] border-[#2e2a4a] bg-white">
            {ico("M15 4h3a2 2 0 012 2v12a2 2 0 01-2 2h-3M10 16l-4-4 4-4M6 12h10")}
          </button>
        </div>
        <div className="mt-4 flex items-center gap-3.5">
          <Avatar />
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="truncate font-lq text-2xl font-bold leading-tight">{p.name || "นักผจญภัย"}</p>
            <span className="inline-block rounded-full border-2 border-[#2e2a4a] bg-white px-2.5 font-lq text-[13px] font-semibold">
              Lv {lv.level} · {lv.title}
            </span>
            <div className="flex justify-between text-xs font-semibold">
              <span>
                {lv.into} / {lv.need} XP
              </span>
              <span>รวม {p.xp.toLocaleString()} XP</span>
            </div>
            <Bar pct={(lv.into / lv.need) * 100} />
          </div>
        </div>
      </div>

      <div className="space-y-5 px-4 pt-5">
        {/* weekly quest */}
        <section className="lq-card overflow-hidden !shadow-[5px_5px_0_#2e2a4a]">
          <div className="flex items-center justify-between border-b-[2.5px] border-[#2e2a4a] bg-[#ffe3ee] px-4 py-3">
            <div>
              <p className="font-lq text-[13px] font-semibold text-[#8a2d57]">WEEKLY QUEST · {d.weekLabel}</p>
              <h2 className="font-lq text-[22px] font-bold leading-tight">เช็กอินประจำสัปดาห์</h2>
            </div>
            {d.thisWeek && <span className="rounded-xl border-2 border-[#2e2a4a] bg-[#bdefd9] px-2.5 py-1 font-lq text-sm font-bold">ส่งแล้ว</span>}
          </div>
          <div className="space-y-3 p-4">
            {d.thisWeek ? (
              <p className="text-[15px]">ส่งแล้ว ได้ {d.thisWeek.xp} XP · แก้คำตอบได้ถึงวันเสาร์ {weekEnd(week).slice(8)}</p>
            ) : (
              <>
                <p className="text-[15px] font-semibold">{answered ? `มีร่างค้างอยู่ ตอบไปแล้ว ${answered}/${qCount} ข้อ` : "ยังไม่ได้เริ่ม · ใช้เวลาแค่ 5 นาที"}</p>
                <p className="text-[13px] text-[#5e5878]">ร่างนี้พี่แตงพี่หยกยังไม่เห็น จนกว่าเราจะกดส่ง</p>
                <div className="flex gap-1" aria-hidden="true">
                  {Array.from({ length: qCount }, (_, i) => (
                    <span key={i} className="h-2 flex-1 rounded-full" style={{ background: i < answered ? "#6a55e0" : "#e6e0f5" }} />
                  ))}
                </div>
              </>
            )}
            <Link href="/life/quest" className="lq-btn lq-btn-primary w-full text-lg">
              {d.thisWeek ? "ดู / แก้คำตอบ" : answered ? "ทำ Quest ต่อ" : "เริ่ม Quest"}
            </Link>
          </div>
        </section>

        {/* quest board: PC time from Brain Dojo Daily */}
        <section className="lq-card overflow-hidden !shadow-[5px_5px_0_#2e2a4a]">
          <div className="border-b-[2.5px] border-[#2e2a4a] bg-[#ffd66b] px-4 py-3">
            <p className="font-lq text-[13px] font-semibold text-[#6b4e00]">QUEST BOARD · เวลาคอมสัปดาห์นี้</p>
            <h2 className="font-lq text-[22px] font-bold leading-tight">Daily + เช็กอิน</h2>
          </div>
          <div className="space-y-3 p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-[15px] font-semibold">Daily Quest จาก Brain Dojo</span>
              <span className="font-lq text-sm font-bold">
                {thisReward ? `${thisReward.days.length} วัน · ${hm(thisReward.total)} ชม.` : "ยังไม่มี"}
              </span>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {days.map((day, i) => {
                const isToday = day === today;
                const done = played.has(day);
                return (
                  <div key={day} className="flex flex-col items-center gap-1">
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-xl border-2 ${
                        done ? "border-[#2e2a4a] bg-[#bdefd9]" : isToday ? "border-[#6a55e0] bg-white" : "border-dashed border-[#a9a2c6] bg-[#f2eff8]"
                      }`}
                    >
                      {done && ico("M5 12l5 5L19 7")}
                    </span>
                    <span className={`text-[11px] font-semibold ${day > today ? "text-[#5e5878]" : ""}`}>{isToday ? "วันนี้" : DAYS[i]}</span>
                  </div>
                );
              })}
            </div>
            {!played.has(today) && (
              <Link href="/daily" className="lq-btn w-full text-[15px]">
                เล่น Daily วันนี้ที่ Brain Dojo
              </Link>
            )}
            {thisReward && (
              <div className="space-y-2 border-t-[1.5px] border-dashed border-[#d8d0ee] pt-3">
                <div
                  className="flex h-[22px] overflow-hidden rounded-full border-[2.5px] border-[#2e2a4a]"
                  role="img"
                  aria-label={thisReward.unlocked ? "ปลดล็อกครบแล้ว" : "ได้แล้ว 70 เปอร์เซ็นต์ รอเช็กอิน 30 เปอร์เซ็นต์"}
                >
                  <div className="bg-[#bdefd9]" style={{ width: thisReward.unlocked ? "100%" : "70%" }} />
                  {!thisReward.unlocked && (
                    <div className="flex-1 border-l-[2.5px] border-[#2e2a4a] bg-[repeating-linear-gradient(135deg,#ffe3ee_0_6px,#fff_6px_12px)]" />
                  )}
                </div>
                {thisReward.unlocked ? (
                  <p className="text-[13px]">
                    <b>ปลดล็อกครบแล้ว</b> · Daily ที่เหลือของสัปดาห์นี้ได้เต็ม 100%
                  </p>
                ) : (
                  <>
                    <div className="flex justify-between text-[13px]">
                      <span>
                        <b>70% ได้แล้ว</b> · {hm(thisReward.available)}
                      </span>
                      <span>
                        <b>30% รอเช็กอิน</b> · {hm(thisReward.held)}
                      </span>
                    </div>
                    <p className="rounded-xl border-2 border-[#2e2a4a] bg-[#ffe3ee] px-3 py-2 text-[13px] leading-relaxed">
                      ส่งเช็กอินประจำสัปดาห์เพื่อปลดล็อก 30% ที่เหลือ · ไม่ส่งภายในวันเสาร์ ส่วนนี้จะหายไป
                    </p>
                  </>
                )}
              </div>
            )}
            <div className="flex items-center justify-between rounded-2xl bg-[#2e2a4a] px-3.5 py-2.5 text-white">
              <span className="text-[13px] leading-snug">
                แลกได้ตอนนี้
                <br />
                พี่แตงพี่หยกแลกโค้ดให้
              </span>
              <span className="font-lq text-xl font-bold text-[#ffd66b]">{hm(owedNow)} ชม.</span>
            </div>
          </div>
        </section>

        {msg && (
          <div className="flex items-end gap-2.5">
            <span className="flex h-[52px] w-[52px] shrink-0 flex-col items-center justify-center rounded-[18px] border-[2.5px] border-[#2e2a4a] bg-[#ffb5cf] font-lq text-[13px] font-bold leading-tight">
              <span>แตง</span>
              <span>หยก</span>
            </span>
            <div className="flex-1 rounded-[20px_20px_20px_6px] border-[2.5px] border-[#2e2a4a] bg-white px-3.5 py-2.5 shadow-[3px_3px_0_#2e2a4a]">
              <p className="font-lq text-xs font-semibold text-[#8a2d57]">ข้อความจากพี่แตงพี่หยก · {new Date(msg.at).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}</p>
              <p className="whitespace-pre-line text-[15px] leading-relaxed">{msg.text}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Link href="/life/study" className="lq-card flex flex-col gap-2 p-3.5">
            <span className="flex h-11 w-11 items-center justify-center rounded-[14px] border-2 border-[#2e2a4a] bg-[#bdefd9]">
              {ico("M4 5h6a2 2 0 012 2v13a2 2 0 00-2-2H4zM20 5h-6a2 2 0 00-2 2v13a2 2 0 012-2h6z")}
            </span>
            <span className="font-lq font-bold">Study Tracker</span>
            <span className="text-[13px] text-[#5e5878]">
              งานค้าง {tasks.filter((t) => t.status < 2).length} · เสร็จ {tasks.filter((t) => t.status >= 2).length}
            </span>
          </Link>
          <Link href="/life/journal" className="lq-card flex flex-col gap-2 p-3.5">
            <span className="flex h-11 w-11 items-center justify-center rounded-[14px] border-2 border-[#2e2a4a] bg-[#ffe3ee]">
              {ico("M5 3h14v18H5zM9 7h6M9 11h6M9 15h3")}
            </span>
            <span className="font-lq font-bold">My Journal</span>
            <span className="text-[13px] text-[#5e5878]">บันทึกแล้ว {d.weeks?.length ?? 0} สัปดาห์</span>
          </Link>
        </div>

        {goal && (
          <div className="flex items-center gap-3 rounded-[20px] border-[2.5px] border-dashed border-[#2e2a4a] bg-[#fff1c9] px-4 py-3.5">
            <div className="min-w-0 flex-1">
              <p className="font-lq text-xs font-semibold text-[#6b4e00]">เป้าหมายสัปดาห์นี้{goal.area ? ` · ${goal.area}` : ""}</p>
              <p className="text-[15px] font-semibold">{goal.text}</p>
            </div>
            <Link href="/life/journal?tab=goals" className="font-lq text-[13px] font-semibold text-[#5b47d6]">
              อัปเดต
            </Link>
          </div>
        )}

        <section>
          <div className="mb-2.5 flex items-baseline justify-between">
            <h2 className="font-lq text-lg font-bold">Achievement</h2>
            <span className="text-[13px] text-[#5e5878]">
              {Object.keys(p.achievements).length} / {ACHIEVEMENTS.length} ปลดล็อก
            </span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {ACHIEVEMENTS.map((a) => {
              const got = !!p.achievements[a.id];
              return (
                <div key={a.id} className="flex flex-col items-center gap-1 text-center" title={a.how}>
                  <span
                    className={`flex h-14 w-14 items-center justify-center rounded-[18px] border-[2.5px] ${
                      got ? "border-[#2e2a4a] bg-[#ffd66b] shadow-[0_3px_0_#2e2a4a]" : "border-dashed border-[#8e87a8] bg-[#f2eff8]"
                    }`}
                  >
                    {got ? ico("M12 2l3 6.5 7 .8-5.2 4.8 1.5 7L12 17.6 5.7 21l1.5-7L2 9.3l7-.8z") : <LockIcon size={22} />}
                  </span>
                  <span className={`text-[11px] font-semibold leading-tight ${got ? "" : "text-[#5e5878]"}`}>{a.name}</span>
                </div>
              );
            })}
          </div>
        </section>

        <div className="pb-4 pt-2 text-center">
          <p className="font-lq text-[15px] font-semibold leading-relaxed">
            ไม่ต้องรู้คำตอบของทุกอย่างวันนี้
            <br />
            แค่ก้าวเล็กๆ สัปดาห์ละก้าวก็พอ
          </p>
          <p className="text-xs text-[#5e5878]">You don&apos;t have to figure everything out today.</p>
        </div>
      </div>
    </div>
  );
}
