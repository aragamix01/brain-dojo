# Brain Dojo 🧠

เว็บฝึกสมองสำหรับวัยรุ่น: แก้โจทย์ ฝึกคิดแบบ algorithm และแก้ปัญหาเฉพาะหน้า
ไม่มีเฉลย มีแต่คำใบ้ทีละขั้น (ปลดล็อกหลังคิดเองครบ 30 วินาที) ข้อมูลทั้งหมดเก็บใน `localStorage` ไม่ใช้ database และไม่มี backend

## โหมด

| โหมด | รายละเอียด |
| --- | --- |
| 🤖 Robot Code | เรียนพื้นฐานการเขียนโปรแกรม 31 ด่าน 8 หมวด: Sequence → Function → Loop → If → If/Else → Nested Loop → Recursion/Stack → Debug (แก้บั๊กในโปรแกรมที่ให้มา) พร้อม Random Lab สุ่มด่านไม่รู้จบจาก seed |
| 🧩 Logic Lab | Lights Out, Water Jugs, Nonogram, Tower of Hanoi — สุ่มโจทย์ใหม่ทุกครั้ง |
| 🎯 Situations | 12 ธีม: เลือกของภายใต้งบ (knapsack) และจัดลำดับงาน (scheduling) — ทุก seed สุ่มของ/ราคา/งบ/เวลาใหม่ ระบบคำนวณคำตอบที่ดีที่สุดไว้เทียบ แต่ไม่โชว์เฉลย |
| ⚡ Speed Math | คิดเลขในใจ 60 วินาที ความยากเพิ่มขึ้นตามจำนวนข้อที่ตอบถูก |
| 📅 Daily Quest | 3 ด่านต่อวัน ใช้วันที่เป็น seed ทุกคนเลยได้โจทย์เดียวกัน กดแชร์ผลไปแข่งกันได้ |

โจทย์ Logic Lab และ Situations เก็บ seed ไว้ใน URL (`?s=…`) กด "ท้าเพื่อน" แล้วส่งลิงก์ อีกฝั่งจะได้โจทย์เดียวกันทุกอย่าง

หน้า Progress ใช้สร้างโค้ด `BD1.…` สำหรับส่งผลให้คนอื่นดู หรือย้ายข้อมูลไปเครื่องใหม่

## Dev

```bash
npm install
npm run dev      # http://localhost:3000
npm run check    # ตรวจว่าทุกด่าน Robot แก้ได้จริง + ทดสอบ generator/solver
npm run build
```

## Deploy (Vercel)

push ขึ้น GitHub แล้ว import repo ใน Vercel ได้เลย ไม่ต้องตั้ง env var

## เพิ่มเนื้อหา

- ด่าน Robot: `src/games/robot/levels.ts` (จัดเป็นหมวด) ต้องใส่ `solution` ด้วย ด่าน Debug ใส่ `preset` เป็นโปรแกรมที่มีบั๊ก แล้วรัน `npm run check` ให้ผ่าน
- Random Lab (`src/games/robot/generate.ts`): สุ่มโปรแกรมก่อน แล้วสร้างกระดานจากทางที่หุ่นเดินจริง จึงแก้ได้ทุกด่าน
- สถานการณ์: เพิ่มธีมใน `src/games/situation/data.ts` (ประเภท `budget` หรือ `schedule`) ใส่ของ/งานไว้เยอะกว่าที่สุ่มหยิบ (`pick`) generator จะสุ่มหยิบและปรับตัวเลขให้เอง แล้วรัน `npm run check`
