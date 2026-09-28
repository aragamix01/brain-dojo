"use client";

import { dayKey } from "@/lib/date";
import { hashString } from "@/lib/rng";

const TIPS = [
  "AI เก่งก็จริง แต่สมองเราต้องเป็นคนถือพวงมาลัยเรือนะ 🧠",
  "ติดอยู่? ลองอธิบายโจทย์ให้ตัวเองฟังออกเสียงดู",
  "ผิดไม่เป็นไร ผิดแล้วรู้ว่าทำไมผิด = เก่งขึ้นแล้ว",
  "ลองแบ่งปัญหาใหญ่เป็นชิ้นเล็กๆ แล้วแก้ทีละชิ้น",
  "ถ้าคิดไปข้างหน้าไม่ออก ลองคิดย้อนจากสมบัติกลับมาที่เรือดู",
  "Level up ไม่ได้มาจากการดูเฉลย มาจากการ grind เอง ⚔️",
  "คำใบ้ล็อก 30 วิ เพราะ 30 วิแรกคือเวลาที่สมองทำงานหนักสุด",
  "หาแพทเทิร์นให้เจอ แล้วโจทย์ยากจะกลายเป็นโจทย์ง่าย",
  "พักสายตาแป๊บ แล้วกลับมาดูใหม่ บางทีคำตอบก็โผล่มาเอง",
];

/** Nova, the crew's robot navigator, in a pirate hat. */
export function NovaFace({ className = "h-20 w-[72px]" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 72 80"
      className={className}
      fill="none"
      stroke="#1e2a3a"
      strokeWidth="2.5"
      strokeLinejoin="round"
      aria-label="Nova"
    >
      <path d="M12 22c4-12 44-12 48 0l4 4H8z" fill="#1e2a3a" />
      <path d="M30 12l6 6 6-6" stroke="#fff" strokeWidth="2" />
      <rect x="10" y="26" width="52" height="44" rx="18" fill="#fff" />
      <ellipse cx="26" cy="46" rx="6" ry="8" fill="#1fa2e0" />
      <ellipse cx="46" cy="46" rx="6" ry="8" fill="#1fa2e0" />
      <circle cx="28" cy="43" r="2.2" fill="#fff" stroke="none" />
      <circle cx="48" cy="43" r="2.2" fill="#fff" stroke="none" />
      <ellipse cx="17" cy="57" rx="4" ry="2.5" fill="#ff9bb0" stroke="none" />
      <ellipse cx="55" cy="57" rx="4" ry="2.5" fill="#ff9bb0" stroke="none" />
      <path d="M31 59q5 4 10 0" strokeLinecap="round" />
    </svg>
  );
}

export function Nova({ tip }: { tip?: string }) {
  const text = tip ?? TIPS[hashString(dayKey()) % TIPS.length];
  return (
    <div className="flex items-end gap-2.5">
      <NovaFace className="h-20 w-[72px] shrink-0" />
      <div className="relative mb-2.5 flex-1 rounded-[18px] rounded-bl-[4px] border-[2.5px] border-ink bg-white px-3.5 py-2.5 text-sm shadow-[3px_3px_0_#1e2a3a]">
        <span className="font-display text-xs font-bold text-cyan">Nova · ต้นหนประจำเรือ</span>
        <p className="leading-relaxed">{text}</p>
      </div>
    </div>
  );
}
