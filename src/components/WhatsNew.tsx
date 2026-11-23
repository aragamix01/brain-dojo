"use client";

import Link from "next/link";
import { GuideModal, type GuideStep } from "./GuideModal";

/** Bump when a new batch of features should be announced again. */
export const WHATS_NEW_ID = "whats-new-pc-time-v2";

function Chip({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-xl border-[2.5px] border-ink bg-white px-2.5 py-1 font-display text-sm font-bold shadow-[2px_2px_0_#1e2a3a] ${className}`}
    >
      {children}
    </span>
  );
}

const Big = ({ children }: { children: React.ReactNode }) => (
  <span className="flex h-14 w-14 items-center justify-center rounded-2xl border-[3px] border-ink bg-white text-3xl shadow-[0_4px_0_#1e2a3a]">
    {children}
  </span>
);

const STEPS: GuideStep[] = [
  {
    title: "เวลาคอมแบบใหม่ ⏰",
    nova: "เวลาคอมจาก Daily ปรับใหม่ให้พอดีกับเสาร์อาทิตย์ — และแบ่งเป็น 2 ส่วน ส่วนสุดท้ายต้องส่งเช็กอินประจำสัปดาห์ก่อนนะ",
    art: (
      <div className="flex flex-col items-center gap-2">
        <Chip className="bg-yellow">⚔️ Daily = 15 นาที + ดาวละ 5 นาที</Chip>
        <Chip className="bg-[#bdefd9]">70% ได้ทันที</Chip>
        <Chip className="bg-[#ffe3ee]">📓 เช็กอิน · ปลดล็อกอีก 30%</Chip>
      </div>
    ),
    points: [
      "เล่น Daily จบได้ 15 นาที + ดาวละ 5 นาที (วันละไม่เกิน 1 ชม. · ครบ 7 วัน = 7 ชม.)",
      "ได้ทันที 70%",
      "อีก 30% ของทั้งสัปดาห์ ปลดล็อกเมื่อส่งเช็กอินภายในวันเสาร์ ไม่ส่งส่วนนี้หายไป",
      "ไม่ต้องส่ง QR แล้ว — พี่แตงพี่หยกเห็นยอดและแลกเป็นโค้ดให้จากโหมดพี่แตงพี่หยกเลย",
      "ร้านค้ายังขายเวลาคอมเหมือนเดิม",
    ],
  },
  {
    title: "Weekly Life Quest 📓",
    nova: "เรือมีสมุดบันทึกเล่มใหม่! สัปดาห์ละครั้ง คุยกับตัวเองแค่ 5 นาที — ไม่มีคำตอบผิด ไม่มีการหักคะแนน",
    art: (
      <div className="flex justify-center gap-3">
        <Big>📓</Big>
        <Big>📚</Big>
        <Big>🎯</Big>
      </div>
    ),
    points: [
      "📓 เช็กอินประจำสัปดาห์ 10 ข้อ ตอบทีละข้อ บันทึกร่างได้ ข้ามได้",
      "📚 Study Tracker จดงาน กำหนดส่ง และคะแนนแต่ละวิชา",
      "🎯 ตั้งเป้าเล็กๆ ทุกสัปดาห์ แล้วติ๊กเมื่อทำได้ · มี XP กับ Achievement แยกของตัวเอง",
      "🔒 ตั้ง PIN 4 หลักของเราเอง · พี่แตงพี่หยกอ่านได้เฉพาะคำตอบที่กดส่งแล้ว",
    ],
  },
];

export function WhatsNew({ onClose }: { onClose: () => void }) {
  return (
    <GuideModal
      heading="WHAT'S NEW"
      label="มีอะไรใหม่บนเรือ"
      steps={STEPS}
      finishLabel="เข้าใจแล้ว!"
      onClose={onClose}
      finalActions={
        <>
          <Link href="/life" className="btn btn-gold flex-1 text-sm" onClick={onClose}>
            📓 เปิด Life Quest
          </Link>
        </>
      }
    />
  );
}
