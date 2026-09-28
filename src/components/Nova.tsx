"use client";

import { dayKey } from "@/lib/date";
import { hashString } from "@/lib/rng";

const TIPS = [
  "AI เก่งก็จริง แต่สมองเราต้องเป็นคนขับนะ 🧠",
  "ติดอยู่? ลองอธิบายโจทย์ให้ตัวเองฟังออกเสียงดู",
  "ผิดไม่เป็นไร ผิดแล้วรู้ว่าทำไมผิด = เก่งขึ้นแล้ว",
  "ลองแบ่งปัญหาใหญ่เป็นชิ้นเล็กๆ แล้วแก้ทีละชิ้น",
  "ถ้าคิดไปข้างหน้าไม่ออก ลองคิดย้อนจากคำตอบ",
  "Level up ไม่ได้มาจากการดูเฉลย มาจากการ grind เอง ⚔️",
  "คำใบ้ล็อก 30 วิ เพราะ 30 วิแรกคือเวลาที่สมองทำงานหนักสุด",
  "หาแพทเทิร์นให้เจอ แล้วโจทย์ยากจะกลายเป็นโจทย์ง่าย",
  "พักสายตาแป๊บ แล้วกลับมาดูใหม่ บางทีคำตอบก็โผล่มาเอง",
];

export function Nova({ tip }: { tip?: string }) {
  const text = tip ?? TIPS[hashString(dayKey()) % TIPS.length];
  return (
    <div className="flex items-end gap-3">
      <svg viewBox="0 0 64 64" className="h-16 w-16 shrink-0" aria-label="Nova">
        <line x1="32" y1="6" x2="32" y2="14" stroke="#ff5fcf" strokeWidth="3" strokeLinecap="round" />
        <circle cx="32" cy="5" r="4" fill="#ff5fcf" />
        <rect x="8" y="14" width="48" height="40" rx="16" fill="#241d55" stroke="#41e8ff" strokeWidth="3" />
        <ellipse cx="23" cy="33" rx="6" ry="8" fill="#41e8ff" />
        <ellipse cx="41" cy="33" rx="6" ry="8" fill="#41e8ff" />
        <circle cx="25" cy="30" r="2.5" fill="#fff" />
        <circle cx="43" cy="30" r="2.5" fill="#fff" />
        <ellipse cx="15" cy="43" rx="4" ry="2.5" fill="#ff5fcf" opacity="0.6" />
        <ellipse cx="49" cy="43" rx="4" ry="2.5" fill="#ff5fcf" opacity="0.6" />
        <path d="M28 45 Q32 48 36 45" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
      <div className="relative mb-2 rounded-2xl rounded-bl-sm border border-white/10 bg-panel-2 px-3 py-2 text-sm">
        <span className="font-display text-xs text-cyan">Nova</span>
        <p>{text}</p>
      </div>
    </div>
  );
}
