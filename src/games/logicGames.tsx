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
import { HarborGame } from "./harbor/HarborGame";
import type { HarborLevel } from "./harbor/logic";
import { harborFromSeed } from "./harbor/puzzles";
import { LockGame } from "./lock/LockGame";
import { generateLock, type LockLevel } from "./lock/logic";
import { NonogramGame } from "./nonogram/NonogramGame";
import { SeriesGame } from "./series/SeriesGame";
import { generateSeries, type SeriesLevel } from "./series/logic";
import { SudokuGame } from "./sudoku/SudokuGame";
import { generateSudoku, type SudokuLevel } from "./sudoku/logic";
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

function Lock({ level, seed, session, onSolved }: PuzzleRenderArgs<LockLevel>) {
  const puzzle = useMemo(() => generateLock(rngFrom(seed), level), [seed, level]);
  return <LockGame puzzle={puzzle} session={session} onSolved={onSolved} />;
}

function Harbor({ level, seed, session, onSolved }: PuzzleRenderArgs<HarborLevel>) {
  const puzzle = useMemo(() => harborFromSeed(seed, level), [seed, level]);
  return <HarborGame puzzle={puzzle} session={session} onSolved={onSolved} />;
}

function Sudoku({ level, seed, session, onSolved }: PuzzleRenderArgs<SudokuLevel>) {
  const puzzle = useMemo(() => generateSudoku(rngFrom(seed), level), [seed, level]);
  return <SudokuGame puzzle={puzzle} session={session} onSolved={onSolved} />;
}

function Series({ level, seed, session, onSolved }: PuzzleRenderArgs<SeriesLevel>) {
  const puzzle = useMemo(() => generateSeries(rngFrom(seed), level), [seed, level]);
  return <SeriesGame puzzle={puzzle} session={session} onSolved={onSolved} />;
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
                🧭 <b className="text-fg">ท่าไล่ไฟ</b>: ดับไฟทีละแถวจากบนลงล่าง โดยห้ามแตะแถวที่เคลียร์แล้ว —
                เปิดโหมดนี้แล้วจะมีกรอบบอกว่าตอนนี้ควรกดในแถวไหน ส่วนช่องไหนต้องคิดเอง
                (ท่านี้ช่วยให้ผ่านได้ แต่มักใช้หลายครั้งกว่า par)
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
    case "lock":
      return (
        <PuzzleShell<LockLevel>
          gameKey="lock"
          title="🔐 Treasure Lock"
          sub="ไขรหัสอัญมณีของหีบสมบัติ"
          levels={[
            { value: "easy", label: "3 ช่อง" },
            { value: "normal", label: "4 ช่อง" },
            { value: "hard", label: "4 ช่อง ซ้ำได้" },
          ]}
          rules={
            <>
              <p>หีบล็อกด้วยรหัสอัญมณี เลือกอัญมณีใส่ทุกช่อง แล้วกด 🔑 ลองไข</p>
              <p>● ดำ = อัญมณีถูก และอยู่ถูกที่ · ○ ขาว = มีอัญมณีนี้ในรหัส แต่อยู่ผิดที่</p>
              <p>ไขได้ภายในจำนวนครั้ง (par) ได้ 3 ดาว</p>
              <p className="text-cyan">Tip: แต่ละครั้งที่ลอง ตัดรหัสที่เป็นไปไม่ได้ทิ้ง — อย่าเดามั่ว ให้ทุกครั้งได้ข้อมูลใหม่</p>
            </>
          }
          render={(a) => <Lock {...a} />}
        />
      );
    case "harbor":
      return (
        <PuzzleShell<HarborLevel>
          gameKey="harbor"
          title="⛵ Harbor Escape"
          sub="พาเรือโจรสลัดออกจากท่า"
          levels={[
            { value: "easy", label: "Easy" },
            { value: "normal", label: "Normal" },
            { value: "hard", label: "Hard" },
          ]}
          rules={
            <>
              <p>ลากเรือไปตามแนวยาวของมัน — แนวนอนเลื่อนซ้าย/ขวา แนวตั้งเลื่อนขึ้น/ลง ห้ามชนกัน</p>
              <p>เป้าหมาย: พาเรือแดง 🏴‍☠️ ออกทางช่องด้านขวา</p>
              <p>เลื่อนเรือ 1 ลำ ไกลแค่ไหนก็นับ 1 ครั้ง · ภายใน par ได้ 3 ดาว</p>
              <p className="text-cyan">Tip: ถามตัวเองว่า &quot;ลำไหนขวางอยู่ แล้วอะไรขวางลำนั้นอีกที?&quot;</p>
            </>
          }
          render={(a) => <Harbor {...a} />}
        />
      );
    case "sudoku":
      return (
        <PuzzleShell<SudokuLevel>
          gameKey="sudoku"
          title="🗺️ Map Sudoku"
          sub="เติมเลขให้ครบแผนที่"
          xpBase={15}
          levels={[
            { value: "mini", label: "4×4" },
            { value: "normal", label: "6×6" },
            { value: "hard", label: "6×6 Hard" },
          ]}
          rules={
            <>
              <p>แตะช่อง แล้วเลือกเลข — ทุกแถว ทุกคอลัมน์ และทุกกล่องที่ขีดเส้นหนา ต้องมีเลขไม่ซ้ำกัน</p>
              <p>เลขที่ชนกันจะเป็นสีแดง · ทุกโจทย์มีคำตอบเดียว</p>
              <p>ไม่ใช้คำใบ้เลย ได้ 3 ดาว</p>
              <p className="text-cyan">Tip: หาช่องที่ใส่ได้แค่เลขเดียวก่อน แล้วค่อยขยายต่อ</p>
            </>
          }
          render={(a) => <Sudoku {...a} />}
        />
      );
    case "series":
      return (
        <PuzzleShell<SeriesLevel>
          gameKey="series"
          title="🔢 Number Series"
          sub="หาแพทเทิร์น เติมเลขถัดไป"
          levels={[
            { value: "easy", label: "Easy" },
            { value: "normal", label: "Normal" },
            { value: "hard", label: "Hard" },
          ]}
          rules={
            <>
              <p>มีอนุกรม 5 ข้อ ดูตัวเลขที่เรียงมา แล้วเติมตัวถัดไปใน ?</p>
              <p>ตอบถูกทุกข้อในครั้งแรก (5 ครั้ง) ได้ 3 ดาว · ตอบผิดนับเพิ่ม</p>
              <p className="text-cyan">Tip: ลองหาผลต่างระหว่างตัวที่ติดกัน ถ้ายังไม่เห็น ลองหาผลต่างของผลต่างอีกชั้น</p>
            </>
          }
          render={(a) => <Series {...a} />}
        />
      );
  }
}
