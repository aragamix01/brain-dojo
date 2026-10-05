"use client";

import Link from "next/link";
import { RobotSprite } from "@/games/robot/RobotSprite";
import { HUNT } from "@/games/daily/hunt";
import { ACHIEVEMENTS, BADGE_COINS } from "@/lib/achievements";
import { COINS } from "@/lib/coins";
import { SHOP_TIME } from "@/lib/kidtimer/reward";
import { FREEZE } from "@/lib/shop";
import { GuideModal, type GuideStep } from "./GuideModal";

/** Bump when a new batch of features should be announced again. */
export const WHATS_NEW_ID = "whats-new-pc-time";

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
    title: "มีของใหม่บนเรือ!",
    nova: "ลูกเรือเก่งขึ้นเยอะเลย กัปตันเลยเพิ่มของใหม่ให้ — มาดูกันว่ามีอะไรบ้าง",
    art: (
      <div className="flex justify-center gap-3">
        <Big>🎮</Big>
        <Big>⭐</Big>
        <Big>🪙</Big>
        <Big>🏪</Big>
        <Big>🧊</Big>
        <Big>🏅</Big>
      </div>
    ),
    points: [
      "⏰ เล่น Daily จบได้โค้ดเวลาคอม — ร้านค้าก็ขายด้วย",
      `🪙 กระเป๋าเหรียญใหญ่ขึ้น เก็บได้ ${COINS.cap} เหรียญ`,
      "🎮 เกมใหม่ 4 เกมในลานฝึกดาบ — สุ่มเข้า Daily ด้วย",
      "⭐ วันล่าดาว — อาทิตย์กับพุธ Daily เปลี่ยนเป็นภารกิจเก็บดาว",
      "🪙 เหรียญคำใบ้ — คำใบ้ไม่ได้ฟรีไม่จำกัดแล้ว",
      "🏪 ร้านค้าบนเรือ — เอาเหรียญไปแลกสกินหุ่นกับฉายา",
      "🧊 น้ำแข็งกันไฟดับ — พลาด Daily ไปวันหนึ่ง วันติดไม่ขาด",
      "🏅 สมุดตรา — สะสมตราจากความสำเร็จ",
    ],
  },
  {
    title: "เวลาคอม ⏰",
    nova: "ฝึกสมองเสร็จ ได้เวลาพักเล่นคอม! เอาโค้ดไปพิมพ์ที่คอม แล้วเครื่องจะปลดล็อกให้",
    art: (
      <div className="flex flex-col items-center gap-2">
        <Chip className="bg-yellow">⚔️ Daily จบ = 1 ชม.+</Chip>
        <Chip>⭐ ดาวละ +10 นาที</Chip>
        <Chip>🏪 ร้านค้า 🪙{SHOP_TIME.price} = 1 ชม.</Chip>
      </div>
    ),
    points: [
      "เล่น Daily จบได้ 1 ชม. บวกดาวละ 10 นาที (สูงสุด 2.5 ชม.)",
      `ร้านค้าขายเวลาคอม 1 ชม. ราคา ${SHOP_TIME.price} เหรียญ ซื้อได้วันละ ${SHOP_TIME.perDay} ครั้ง`,
      `กระเป๋าเหรียญใหญ่ขึ้น เก็บได้ ${COINS.cap} เหรียญ — เก็บไว้แลกเวลาคอมได้`,
      "โค้ดย้อนดูได้ในหน้าแชร์ผลงาน · แต่ละโค้ดใช้ได้ครั้งเดียว",
    ],
  },
  {
    title: "เกมใหม่ 4 เกม 🎮",
    nova: "ลานฝึกดาบมีของเล่นใหม่! ทุกเกมสุ่มโจทย์ใหม่ทุกครั้ง และอาจโผล่มาใน Daily วันไหนก็ได้",
    art: (
      <div className="flex justify-center gap-3">
        <Big>🔐</Big>
        <Big>⛵</Big>
        <Big>🗺️</Big>
        <Big>🔢</Big>
      </div>
    ),
    points: [
      "🔐 ไขกุญแจหีบ — เดารหัสอัญมณี ดู ● ○ แล้วตัดตัวเลือกทิ้ง",
      "⛵ พาเรือออกจากท่า — เลื่อนเรือลำอื่นหลบทาง ให้เรือแดงแล่นออกไป",
      "🗺️ ซูโดกุแผนที่ — เลขห้ามซ้ำในแถว คอลัมน์ และกล่อง",
      "🔢 อนุกรมปริศนา — หาแพทเทิร์น แล้วเติมเลขถัดไป",
    ],
  },
  {
    title: "วันล่าดาว ⭐",
    nova: "ทุกวันอาทิตย์กับวันพุธ Daily ไม่สุ่มเกมแล้ว — ออกไปล่าดาวบนแผนที่หรือลานฝึกดาบแทน!",
    art: (
      <div className="flex flex-col items-center gap-2">
        <div className="flex gap-1.5">
          <Chip className="bg-yellow">อา</Chip>
          <Chip>จ</Chip>
          <Chip>อ</Chip>
          <Chip className="bg-yellow">พ</Chip>
          <Chip>พฤ</Chip>
          <Chip>ศ</Chip>
          <Chip>ส</Chip>
        </div>
        <Chip>⭐ เก็บดาว 0 / {HUNT.target}</Chip>
      </div>
    ),
    points: [
      `ชนะด่านบนแผนที่ล่าสมบัติหรือลานฝึกดาบ เก็บดาวให้ครบ ${HUNT.target} ดวง`,
      "เกมสุ่มนับดาวทุกวัน (เกมละครั้งต่อวัน) · ด่านบนแผนที่กับ Robot ตามบท นับเฉพาะด่านที่ผ่านครั้งแรก",
      "ครบเมื่อไหร่ Daily เคลียร์ทันที ได้เหรียญ Daily และ ⚔️ วันติด +1",
    ],
  },
  {
    title: "เหรียญคำใบ้ 🪙",
    nova: "คำใบ้ยังใช้ได้ แต่ต้องคิดก่อนใช้นะ — เหรียญมีจำกัด!",
    art: (
      <div className="flex flex-col items-center gap-2">
        <Chip>💡 Hint · ฟรี 2</Chip>
        <Chip className="bg-yellow">💡 Hint · 🪙1</Chip>
        <Chip className="opacity-60">🔒 เหรียญหมด</Chip>
      </div>
    ),
    points: [
      `ทุกด่านใช้คำใบ้ฟรีได้ ${COINS.freePerPuzzle} ครั้ง ครั้งต่อไปใช้ 1 เหรียญ (ทุกคำใบ้ยังหักดาว)`,
      `เก็บได้สูงสุด ${COINS.cap} เหรียญ — ที่เกินจะแปลงเป็น XP ให้ ไม่หายฟรี`,
      "แตะช่อง 🪙 มุมขวาบน ดูว่าวันนี้ยังเก็บได้อีกกี่เหรียญ",
    ],
  },
  {
    title: "หาเหรียญได้จากไหน",
    nova: "ยิ่งคิดเองเก่ง ยิ่งได้เหรียญเยอะ — ป้าย +1🪙 บนแผนที่คือเหรียญที่รอเก็บอยู่",
    art: (
      <div className="flex flex-wrap justify-center gap-1.5">
        <Chip>🗺️ 3★ แผนที่ +1</Chip>
        <Chip>👹 บอส +2</Chip>
        <Chip>🎁 หีบ +3</Chip>
        <Chip>⚔️ ลานฝึก 3★ +1</Chip>
        <Chip>📅 Daily +1/+1</Chip>
        <Chip>⚔️ 7 วันติด +2</Chip>
        <Chip>🏅 ตรา +{BADGE_COINS}</Chip>
      </div>
    ),
    points: [
      "3★ ครั้งแรกของแต่ละด่านบนแผนที่ ชนะบอส และเปิดหีบ",
      `ลานฝึกดาบ: ชนะ 3★ ได้ 1 เหรียญ (วันละไม่เกิน ${COINS.freePlayPerDay})`,
      "Daily: เล่นจบ +1 และได้ 3★ ทุกด่านอีก +1 · เล่น Daily ติดกันทุก 7 วัน +2",
    ],
  },
  {
    title: "ร้านค้า + น้ำแข็ง 🏪🧊",
    nova: "ของในร้านใส่ให้เท่อย่างเดียว ไม่ช่วยให้ผ่านด่านนะ — ด่านยังต้องใช้สมองเหมือนเดิม!",
    art: (
      <div className="flex items-end justify-center gap-3">
        {["gold", "pirate", "cat"].map((id) => (
          <span key={id} className="flex h-14 w-14 items-center justify-center rounded-2xl border-[2.5px] border-ink bg-[#4d8dff]/80">
            <RobotSprite skinId={id} angle={45} className="h-10 w-10" />
          </span>
        ))}
        <Big>🧊</Big>
      </div>
    ),
    points: [
      "🤖 สกินหุ่น Robot — หุ่นในทุกด่านจะใส่ชุดที่เลือก",
      "🏷️ ฉายา — โชว์บนใบประกาศจับหน้าแรก เช่น 「นักล่าบั๊ก」",
      `🧊 น้ำแข็งกันไฟดับ ${FREEZE.price} เหรียญ ถือได้ ${FREEZE.max} อัน — พลาด Daily วันไหน ระบบใช้ให้เอง วันติด ⚔️ ไม่รีเซ็ต`,
    ],
  },
  {
    title: "สมุดตรา 🏅",
    nova: `มีตราให้สะสม ${ACHIEVEMENTS.length} แบบ บางอันอาจได้ไปแล้วก็ได้ ไปเปิดดูเลย!`,
    art: (
      <div className="flex justify-center gap-2">
        {ACHIEVEMENTS.slice(0, 5).map((a) => (
          <span
            key={a.id}
            className="flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-ink bg-yellow text-2xl shadow-[0_3px_0_#1e2a3a]"
          >
            {a.emoji}
          </span>
        ))}
      </div>
    ),
    points: [
      "ตราได้จากการผ่านแผนที่ เรียน Robot ครบหมวด เล่น Daily ติดกัน และทำคะแนนสูง",
      `ได้ตราใหม่แต่ละอันรับ 🪙 ${BADGE_COINS} เหรียญ`,
      "ตราที่ยังไม่ได้มีแถบบอกว่าเหลืออีกเท่าไหร่",
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
          <Link href="/logic" className="btn btn-gold flex-1 text-sm" onClick={onClose}>
            🎮 ลองเกมใหม่
          </Link>
          <Link href="/badges" className="btn btn-cyan flex-1 text-sm" onClick={onClose}>
            🏅 ดูสมุดตรา
          </Link>
        </>
      }
    />
  );
}
