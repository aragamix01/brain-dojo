"use client";

import { useState } from "react";
import { NovaFace } from "@/components/Nova";
import { CHEST_RATIO, ISLANDS } from "./data";

export const QUEST_GUIDE_ID = "quest-guide";

function Chip({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-xl border-[2.5px] border-ink bg-white px-2.5 py-1 font-display text-sm font-bold shadow-[2px_2px_0_#1e2a3a] ${className}`}
    >
      {children}
    </span>
  );
}

const STEPS: { title: string; nova: string; art: React.ReactNode; points: React.ReactNode[] }[] = [
  {
    title: "ยินดีต้อนรับ ลูกเรือ!",
    nova: "เรือเราแตกกลางพายุ! สมบัติของกัปตันซ่อนอยู่ข้ามไป 6 เกาะ — ข้าจะเป็นต้นหนนำทางเอง",
    art: (
      <div className="flex justify-center gap-1.5">
        {ISLANDS.map((isl) => (
          <span
            key={isl.id}
            className="flex h-11 w-11 items-center justify-center rounded-[45%_55%_40%_60%] border-[2.5px] border-ink text-xl shadow-[0_3px_0_#1e2a3a]"
            style={{ background: isl.color }}
          >
            {isl.emoji}
          </span>
        ))}
      </div>
    ),
    points: [
      "แต่ละเกาะสอนการเขียนโปรแกรมทีละเรื่อง: ลำดับคำสั่ง → ฟังก์ชัน → ลูป → if → แยกทาง → recursion",
      "ระหว่างทางมีปริศนา เกมตรรกะ และสถานการณ์เฉพาะหน้าผสมกันไป",
    ],
  },
  {
    title: "เดินตามเส้นทาง",
    nova: "ด่านที่เรือ ⛵ จอดอยู่คือด่านปัจจุบัน แตะเพื่อเริ่มเล่นได้เลย",
    art: (
      <div className="flex flex-wrap justify-center gap-1.5">
        <Chip>🤖 Robot</Chip>
        <Chip>💡 Lights</Chip>
        <Chip>🫙 Jugs</Chip>
        <Chip>🧩 Nonogram</Chip>
        <Chip>🗼 Hanoi</Chip>
        <Chip>🎯 Situation</Chip>
        <Chip>⚡ Speed Math</Chip>
      </div>
    ),
    points: [
      "ผ่านด่าน (ได้อย่างน้อย 1 ★) แล้วด่านถัดไปจะปลดล็อก 🔓",
      "โจทย์แต่ละด่านเหมือนเดิมทุกครั้ง — แพ้ได้ ลองใหม่ได้ไม่จำกัด",
    ],
  },
  {
    title: "เก็บดาว ★★★",
    nova: "ดาวบอกว่าเราคิดได้ดีแค่ไหน — ไม่ใช่แค่ผ่านเฉยๆ",
    art: (
      <div className="flex justify-center gap-3 text-4xl [text-shadow:2px_2px_0_#1e2a3a]">
        <span className="text-yellow">★</span>
        <span className="text-yellow">★</span>
        <span className="text-yellow">★</span>
      </div>
    ),
    points: [
      "3 ดาว = ทำได้ภายในจำนวนครั้งที่กำหนด (par) และไม่ใช้คำใบ้",
      "💡 คำใบ้ล็อกไว้ 30 วินาทีแรกให้คิดเองก่อน ใช้ได้แต่จะหักดาว",
      "กลับมาเล่นด่านเดิมซ้ำเพื่อเก็บดาวเพิ่มได้ทุกเมื่อ",
    ],
  },
  {
    title: "บอสและหีบสมบัติ",
    nova: "ท้ายทุกเกาะมีบอสเฝ้าหีบสมบัติอยู่ ระวังให้ดี!",
    art: (
      <div className="flex items-end justify-center gap-4">
        <span className="flex h-16 w-20 items-center justify-center rounded-[50%_50%_45%_55%] border-[3px] border-ink bg-[#b9a6ff] text-4xl shadow-[0_4px_0_#1e2a3a]">
          👹
        </span>
        <span className="font-display text-2xl font-extrabold">→</span>
        <span className="flex h-20 w-20 items-center justify-center rounded-3xl border-[3px] border-ink bg-yellow text-5xl shadow-[0_5px_0_#1e2a3a]">
          🎁
        </span>
      </div>
    ),
    points: [
      "👹 ด่านบอสยากกว่าด่านปกติ",
      `🎁 หีบเปิดได้เมื่อผ่านครบทุกด่านในเกาะ และได้ดาวรวมอย่างน้อย ${Math.round(CHEST_RATIO * 100)}% ของดาวเต็ม`,
      "ดาวไม่พอ? ย้อนกลับไปเล่นด่านที่ได้ดาวน้อยอีกรอบ",
    ],
  },
  {
    title: "ได้รางวัลจริง!",
    nova: "เปิดหีบได้เมื่อไหร่ รีบไปทวงรางวัลจากน้าเลย!",
    art: (
      <div className="text-center">
        <p className="inline-block rounded-xl border-[2.5px] border-ink bg-white px-4 py-2 font-mono text-2xl font-bold tracking-widest text-cyan shadow-[3px_3px_0_#1e2a3a]">
          C1-AB12
        </p>
        <p className="mt-1.5 font-display text-xs font-bold text-ink">ตัวอย่างโค้ดทวงรางวัล</p>
      </div>
    ),
    points: [
      "เปิดหีบแล้วจะได้โค้ดลับที่ผูกกับชื่อเรา — ส่งให้น้า แล้วน้าจะตรวจว่าเปิดได้จริง",
      "ทุกด่านที่ผ่านได้ XP ด้วย สะสมไว้เลื่อนยศ Rank E → S",
    ],
  },
];

export function QuestGuide({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const s = STEPS[step];
  const last = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 p-3 sm:items-center" role="dialog" aria-modal="true" aria-label="วิธีเล่น Treasure Quest">
      <div className="panel animate-pop w-full max-w-md overflow-hidden bg-white">
        <div className="sea relative px-4 pb-5 pt-4">
          <div className="flex items-center justify-between">
            <p className="comic-title text-2xl text-yellow">HOW TO PLAY</p>
            <button className="font-display text-sm font-bold text-ink underline" onClick={onClose}>
              ข้าม
            </button>
          </div>
          <div className="mt-3 min-h-24">{s.art}</div>
        </div>
        <div className="wave-edge -mt-3.5" />

        <div className="px-5 pb-5 pt-2">
          <p className="font-display text-2xl font-extrabold">{s.title}</p>
          <div className="mt-3 flex items-end gap-2">
            <NovaFace className="h-14 w-[50px] shrink-0" />
            <p className="mb-1 flex-1 rounded-[16px] rounded-bl-[4px] border-[2.5px] border-ink bg-sand px-3 py-2 text-sm leading-relaxed shadow-[2px_2px_0_#1e2a3a]">
              {s.nova}
            </p>
          </div>
          <ul className="mt-4 space-y-2 text-sm leading-relaxed">
            {s.points.map((p, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-coral" />
                <span>{p}</span>
              </li>
            ))}
          </ul>

          <div className="mt-5 flex items-center gap-3">
            <div className="flex flex-1 gap-1.5" aria-label={`หน้า ${step + 1} จาก ${STEPS.length}`}>
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  aria-label={`ไปหน้า ${i + 1}`}
                  className={`h-2.5 rounded-full border-2 border-ink transition-all ${i === step ? "w-7 bg-coral" : "w-2.5 bg-white"}`}
                />
              ))}
            </div>
            {step > 0 && (
              <button className="btn btn-ghost !min-h-10 whitespace-nowrap text-sm" onClick={() => setStep(step - 1)}>
                ย้อน
              </button>
            )}
            <button
              className="btn btn-primary !min-h-10 whitespace-nowrap text-sm"
              onClick={() => (last ? onClose() : setStep(step + 1))}
            >
              {last ? "ออกเดินทาง ⛵" : "ถัดไป →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
