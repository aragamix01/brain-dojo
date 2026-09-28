import type { JugVariant } from "../jugs/logic";

export type QuestGame =
  | { kind: "robot"; level: string }
  | { kind: "lights"; size: number; minPar?: number; maxPar?: number }
  | { kind: "jugs"; variant: JugVariant; maxPar?: number }
  | { kind: "nonogram"; size: number }
  | { kind: "hanoi"; disks: number }
  | { kind: "situation"; theme: string }
  | { kind: "sprint"; goal: number; seconds: number };

/** Ids are stored in progress — never renumber or reuse them. */
export type QuestNode = QuestGame & { id: string; boss?: boolean };

export type Island = {
  id: string;
  emoji: string;
  name: string;
  nameEn: string;
  color: string;
  story: string;
  /** the robot chapter this island teaches */
  lesson: string;
  nodes: QuestNode[];
};

const robot = (id: string, level: string, boss?: boolean): QuestNode => ({ id, kind: "robot", level, boss });

export const ISLANDS: Island[] = [
  {
    id: "beach",
    emoji: "🏝️",
    name: "หาดเรือแตก",
    nameEn: "Shipwreck Beach",
    color: "#3ddc97",
    story: "เรือแตกกลางพายุ! เราติดอยู่บนเกาะพร้อมหุ่น Nova และแผนที่ขาดๆ — ต้องหาทางไปให้ถึงสมบัติของกัปตัน",
    lesson: "Sequence",
    nodes: [
      robot("b1", "seq-1"),
      { id: "b2", kind: "lights", size: 3, minPar: 2, maxPar: 3 },
      robot("b3", "seq-2"),
      { id: "b4", kind: "sprint", goal: 10, seconds: 45 },
      robot("b5", "seq-3"),
      { id: "b6", kind: "hanoi", disks: 3 },
      robot("b7", "seq-4"),
      { id: "b8", kind: "jugs", variant: "two", maxPar: 6 },
      robot("b9", "seq-5"),
      { id: "b10", kind: "nonogram", size: 5, boss: true },
    ],
  },
  {
    id: "jungle",
    emoji: "🌴",
    name: "ป่าฟังก์ชัน",
    nameEn: "Function Jungle",
    color: "#9be15d",
    story: "ป่าทึบที่ทางเดินซ้ำไปซ้ำมา — ใครจำท่าได้ก็ไม่ต้องคิดใหม่ทุกครั้ง",
    lesson: "Functions",
    nodes: [
      robot("j1", "func-1"),
      { id: "j2", kind: "lights", size: 4, minPar: 3, maxPar: 5 },
      robot("j3", "func-2"),
      { id: "j4", kind: "situation", theme: "lost-trail" },
      robot("j5", "func-3"),
      { id: "j6", kind: "hanoi", disks: 4 },
      robot("j7", "func-4"),
      { id: "j8", kind: "sprint", goal: 15, seconds: 60 },
      { id: "j9", kind: "situation", theme: "exam-morning", boss: true },
    ],
  },
  {
    id: "lagoon",
    emoji: "🌊",
    name: "อ่าวน้ำวน",
    nameEn: "Loop Lagoon",
    color: "#41e8ff",
    story: "กระแสน้ำวนพาเรือหมุนไม่หยุด — เรียนรู้การวนซ้ำ แล้วใช้มันให้เป็นประโยชน์",
    lesson: "Loops",
    nodes: [
      robot("l1", "loop-1"),
      { id: "l2", kind: "nonogram", size: 5 },
      robot("l3", "loop-2"),
      { id: "l4", kind: "jugs", variant: "two", maxPar: 9 },
      robot("l5", "loop-3"),
      { id: "l6", kind: "situation", theme: "party-prep" },
      robot("l7", "loop-4"),
      { id: "l8", kind: "lights", size: 5, minPar: 5, maxPar: 8 },
      { id: "l9", kind: "hanoi", disks: 5, boss: true },
    ],
  },
  {
    id: "volcano",
    emoji: "🌋",
    name: "ภูเขาไฟทางเลือก",
    nameEn: "Volcano of Choices",
    color: "#ff8a4d",
    story: "ลาวาไหลเปลี่ยนทางตลอด — ต้องดูสัญญาณแล้วตัดสินใจให้ถูกในทุกก้าว",
    lesson: "If",
    nodes: [
      robot("v1", "if-1"),
      { id: "v2", kind: "sprint", goal: 20, seconds: 60 },
      robot("v3", "if-2"),
      { id: "v4", kind: "jugs", variant: "three", maxPar: 8 },
      robot("v5", "if-3"),
      { id: "v6", kind: "situation", theme: "zombie" },
      robot("v7", "if-4"),
      { id: "v8", kind: "nonogram", size: 8 },
      robot("v9", "if-5", true),
    ],
  },
  {
    id: "dunes",
    emoji: "🏜️",
    name: "ทะเลทรายทางแยก",
    nameEn: "Branching Dunes",
    color: "#ffd84d",
    story: "เนินทรายแยกเป็นร้อยทาง ทางไหนพาไปโอเอซิส ทางไหนพาไปหลงทาง",
    lesson: "If/Else + Nested Loops",
    nodes: [
      robot("d1", "else-1"),
      { id: "d2", kind: "lights", size: 5, maxPar: 10 },
      robot("d3", "else-2"),
      { id: "d4", kind: "situation", theme: "anime-con" },
      robot("d5", "nest-1"),
      { id: "d6", kind: "hanoi", disks: 6 },
      robot("d7", "nest-2"),
      { id: "d8", kind: "situation", theme: "stream-setup" },
      robot("d9", "nest-3"),
      robot("d10", "else-3", true),
    ],
  },
  {
    id: "castle",
    emoji: "🏰",
    name: "ปราสาทบั๊ก",
    nameEn: "Castle of Bugs",
    color: "#ff5fcf",
    story: "สมบัติของกัปตันซ่อนอยู่ในปราสาทที่เต็มไปด้วยกับดักและบั๊ก — ด่านสุดท้ายแล้ว!",
    lesson: "Recursion + Debug",
    nodes: [
      robot("k1", "debug-1"),
      { id: "k2", kind: "jugs", variant: "three" },
      robot("k3", "debug-2"),
      { id: "k4", kind: "nonogram", size: 8 },
      robot("k5", "stack-1"),
      { id: "k6", kind: "situation", theme: "moving-day" },
      robot("k7", "debug-3"),
      { id: "k8", kind: "lights", size: 6 },
      robot("k9", "stack-2"),
      { id: "k10", kind: "sprint", goal: 30, seconds: 60 },
      robot("k11", "debug-4"),
      { id: "k12", kind: "nonogram", size: 10 },
      robot("k13", "stack-3", true),
    ],
  },
];

export const QUEST_NODES = ISLANDS.flatMap((isl) => isl.nodes.map((n) => ({ ...n, island: isl })));

export const questNode = (id: string) => QUEST_NODES.find((n) => n.id === id);

/** Share of an island's max stars needed to open its chest. */
export const CHEST_RATIO = 0.7;
