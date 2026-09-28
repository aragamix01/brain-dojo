# Brain Dojo 🧠

เว็บฝึกสมองสำหรับวัยรุ่น: แก้โจทย์ ฝึกคิดแบบ algorithm และแก้ปัญหาเฉพาะหน้า
ไม่มีเฉลย มีแต่คำใบ้ทีละขั้น (ปลดล็อกหลังคิดเองครบ 30 วินาที) ข้อมูลทั้งหมดเก็บใน `localStorage` ไม่ใช้ database และไม่มี backend

## โหมด

| โหมด | รายละเอียด |
| --- | --- |
| 🤖 Robot Code | เขียนโปรแกรมแบบ Robozzle: คำสั่ง เดิน/หมุน, ฟังก์ชัน F1–F3, recursion, เงื่อนไขสี — 10 ด่าน |
| 🧩 Logic Lab | Lights Out, Water Jugs, Nonogram, Tower of Hanoi — สุ่มโจทย์ใหม่ทุกครั้ง |
| 🎯 Situations | เลือกของภายใต้งบ (knapsack) และจัดลำดับงาน (scheduling) — ระบบคำนวณคำตอบที่ดีที่สุดไว้เทียบ แต่ไม่โชว์เฉลย |
| ⚡ Speed Math | คิดเลขในใจ 60 วินาที ความยากเพิ่มขึ้นตามจำนวนข้อที่ตอบถูก |
| 📅 Daily Quest | 3 ด่านต่อวัน ใช้วันที่เป็น seed ทุกคนเลยได้โจทย์เดียวกัน กดแชร์ผลไปแข่งกันได้ |

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

- ด่าน Robot: `src/games/robot/levels.ts` ต้องใส่ `solution` ด้วย แล้วรัน `npm run check` ให้ผ่าน
- สถานการณ์: `src/games/situation/data.ts` (ประเภท `budget` หรือ `schedule`)
