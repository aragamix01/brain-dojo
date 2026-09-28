"use client";

import { useMemo } from "react";
import { PuzzleShell, type PuzzleRenderArgs } from "@/components/PuzzleShell";
import { rngFrom } from "@/lib/rng";
import { HanoiGame } from "./hanoi/HanoiGame";
import { JugsGame } from "./jugs/JugsGame";
import { generateJugs, type JugVariant } from "./jugs/logic";
import { LightsGame } from "./lights/LightsGame";
import { generateLights } from "./lights/logic";
import type { LogicGameId } from "./catalog";
import { NonogramGame } from "./nonogram/NonogramGame";
import { generateNonogram } from "./nonogram/logic";

function Lights({ level, seed, session, onSolved }: PuzzleRenderArgs<number>) {
  const puzzle = useMemo(() => generateLights(rngFrom(seed), level), [seed, level]);
  return <LightsGame puzzle={puzzle} session={session} onSolved={onSolved} />;
}

function Jugs({ level, seed, session, onSolved }: PuzzleRenderArgs<JugVariant>) {
  const puzzle = useMemo(() => generateJugs(rngFrom(seed), level), [seed, level]);
  return <JugsGame puzzle={puzzle} session={session} onSolved={onSolved} />;
}

function Nonogram({ level, seed, session, onSolved }: PuzzleRenderArgs<number>) {
  const puzzle = useMemo(() => generateNonogram(rngFrom(seed), level), [seed, level]);
  return <NonogramGame puzzle={puzzle} session={session} onSolved={onSolved} />;
}

export function LogicGame({ id }: { id: LogicGameId }) {
  switch (id) {
    case "lights":
      return (
        <PuzzleShell
          gameKey="lights"
          title="💡 Lights Out"
          sub="ปิดไฟให้หมดทุกดวง"
          levels={[
            { value: 4, label: "Easy 4×4" },
            { value: 5, label: "Normal 5×5" },
            { value: 6, label: "Hard 6×6" },
          ]}
          rules={
            <>
              <p>แตะช่องไหน ช่องนั้นและช่องบน-ล่าง-ซ้าย-ขวาจะสลับ เปิด↔ปิด</p>
              <p>เป้าหมาย: ปิดไฟให้หมดทุกดวง ภายในจำนวนครั้ง (par) ให้ได้ 3 ดาว</p>
              <p className="text-cyan">Tip: ลำดับการกดไม่มีผล กดช่องเดิมสองครั้ง = ไม่ได้กด</p>
              <p>
                🧭 <b className="text-fg">ท่าไล่ไฟ</b>: ดับไฟทีละแถวจากบนลงล่าง โดยกดช่องที่อยู่
                &quot;ใต้&quot; ไฟที่เปิดอยู่ สุดท้ายจะเหลือแค่แถวล่างสุด — ส่วนที่ต้องคิดเองคือ ต้องกดแถวบนสุดช่องไหน
                แล้วไล่ใหม่อีกรอบถึงจะหมด (ท่านี้ผ่านได้ชัวร์ แต่มักใช้หลายครั้งกว่า par)
              </p>
              <p>ใช้ Undo กับท่าไล่ไฟได้ฟรี ส่วน 💡 Hint จะหักดาว</p>
            </>
          }
          render={(a) => <Lights {...a} />}
        />
      );
    case "jugs":
      return (
        <PuzzleShell<JugVariant>
          gameKey="jugs"
          title="🫙 Water Jugs"
          sub="ตวงน้ำให้ได้ปริมาณพอดี"
          levels={[
            { value: "two", label: "2 เหยือก + ก๊อก" },
            { value: "three", label: "3 เหยือก ไม่มีก๊อก" },
          ]}
          rules={
            <>
              <p>ไม่มีขีดบอกปริมาณ เติมได้แค่ &quot;เต็มเหยือก&quot; หรือ &quot;เทจนหมด / จนอีกใบเต็ม&quot;</p>
              <p>แตะเหยือกต้นทาง แล้วแตะปลายทางเพื่อเท</p>
              <p className="text-cyan">Tip: ลองคิดย้อนกลับจากเป้าหมาย</p>
            </>
          }
          render={(a) => <Jugs {...a} />}
        />
      );
    case "nonogram":
      return (
        <PuzzleShell
          gameKey="nonogram"
          title="🧩 Nonogram"
          sub="ระบายช่องตามตัวเลข"
          xpBase={15}
          levels={[
            { value: 5, label: "5×5" },
            { value: 8, label: "8×8" },
            { value: 10, label: "10×10" },
          ]}
          rules={
            <>
              <p>ตัวเลขบอกความยาวของกลุ่มช่องที่ระบายติดกันในแถว/คอลัมน์นั้น ตามลำดับ</p>
              <p>เช่น &quot;3 1&quot; = ระบายติดกัน 3 ช่อง เว้นอย่างน้อย 1 ช่อง แล้วระบายอีก 1 ช่อง</p>
              <p>ใช้โหมด ✕ กากบาทช่องที่มั่นใจว่าว่าง ลากนิ้วเพื่อระบายหลายช่องได้</p>
              <p className="text-cyan">Tip: เริ่มจากแถวที่ตัวเลขรวมกันเกือบเต็มแถว</p>
            </>
          }
          render={(a) => <Nonogram {...a} />}
        />
      );
    case "hanoi":
      return (
        <PuzzleShell
          gameKey="hanoi"
          title="🗼 Tower of Hanoi"
          sub="ย้ายหอคอยไปเสาขวาสุด"
          levels={[
            { value: 4, label: "4 แผ่น" },
            { value: 5, label: "5 แผ่น" },
            { value: 6, label: "6 แผ่น" },
            { value: 7, label: "7 แผ่น" },
          ]}
          rules={
            <>
              <p>ย้ายได้ทีละแผ่น (แผ่นบนสุด) และห้ามวางแผ่นใหญ่ทับแผ่นเล็ก</p>
              <p>แตะเสาต้นทาง แล้วแตะเสาปลายทาง</p>
              <p className="text-cyan">Tip: ถ้าย้าย n−1 แผ่นได้ ก็ย้าย n แผ่นได้...</p>
            </>
          }
          render={({ level, session, onSolved }) => <HanoiGame disks={level} session={session} onSolved={onSolved} />}
        />
      );
  }
}
