export const LOGIC_GAMES = [
  { id: "lights", emoji: "💡", title: "Lights Out", th: "ปิดไฟให้หมด", desc: "กดหนึ่งช่อง ไฟรอบๆ สลับหมด" },
  { id: "jugs", emoji: "🫙", title: "Water Jugs", th: "ตวงน้ำ", desc: "ไม่มีถ้วยตวง มีแต่เหยือกกับสมอง" },
  { id: "nonogram", emoji: "🧩", title: "Nonogram", th: "ภาพปริศนา", desc: "ใช้ตัวเลขเดาว่าช่องไหนต้องระบาย" },
  { id: "hanoi", emoji: "🗼", title: "Tower of Hanoi", th: "หอคอยฮานอย", desc: "ย้ายหอคอยทั้งหลัง ห้ามแผ่นใหญ่ทับแผ่นเล็ก" },
  { id: "lock", emoji: "🔐", title: "Treasure Lock", th: "ไขกุญแจหีบ", desc: "เดารหัสอัญมณี แล้วใช้คำใบ้ ●○ ตัดตัวเลือก" },
  { id: "harbor", emoji: "⛵", title: "Harbor Escape", th: "พาเรือออกจากท่า", desc: "เลื่อนเรือลำอื่นหลบทาง ให้เรือเราแล่นออกไปได้" },
  { id: "sudoku", emoji: "🗺️", title: "Map Sudoku", th: "ซูโดกุแผนที่", desc: "เลขห้ามซ้ำในแถว คอลัมน์ และกล่อง" },
  { id: "series", emoji: "🔢", title: "Number Series", th: "อนุกรมปริศนา", desc: "หาแพทเทิร์นของตัวเลข แล้วเติมตัวถัดไป" },
] as const;

export type LogicGameId = (typeof LOGIC_GAMES)[number]["id"];
