export type BudgetItem = {
  id: string;
  emoji: string;
  name: string;
  cost: number;
  value: number;
  tags?: string[];
  /** only scores when this other item is also picked */
  requires?: string;
};

export type BudgetScenario = {
  kind: "budget";
  id: string;
  title: string;
  titleEn: string;
  story: string;
  unit: string;
  valueLabel: string;
  limit: number;
  maxItems?: number;
  /** each listed tag must appear at least once */
  mustHave?: { tag: string; label: string }[];
  items: BudgetItem[];
};

export type Task = {
  id: string;
  emoji: string;
  name: string;
  /** minutes you are busy */
  active: number;
  /** minutes it keeps running by itself afterwards */
  wait?: number;
  deps?: string[];
};

export type ScheduleScenario = {
  kind: "schedule";
  id: string;
  title: string;
  titleEn: string;
  story: string;
  tasks: Task[];
};

export type Scenario = BudgetScenario | ScheduleScenario;

export const SCENARIOS: Scenario[] = [
  {
    kind: "budget",
    id: "lost-trail",
    title: "หลงป่า 2 คืน",
    titleEn: "Lost Trail",
    story:
      "ทริปเดินป่ากับเพื่อน แต่พายุพัดทางเดินหาย ต้องรอทีมกู้ภัย 2 คืน เป้แบกได้ไม่เกิน 12 kg เลือกของที่ช่วยให้รอดดีที่สุด",
    unit: "kg",
    valueLabel: "Survival",
    limit: 12,
    mustHave: [{ tag: "water", label: "ต้องมีน้ำอย่างน้อย 1 อย่าง" }],
    items: [
      { id: "water", emoji: "💧", name: "น้ำดื่ม 2 ลิตร", cost: 4, value: 10, tags: ["water"] },
      { id: "filter", emoji: "🧪", name: "เม็ดกรองน้ำ", cost: 1, value: 7, tags: ["water"] },
      { id: "tent", emoji: "⛺", name: "เต็นท์", cost: 5, value: 7 },
      { id: "tarp", emoji: "🟫", name: "ผ้าใบ + เชือก", cost: 2, value: 6 },
      { id: "bag", emoji: "🛏️", name: "ถุงนอน", cost: 3, value: 6 },
      { id: "torch", emoji: "🔦", name: "ไฟฉาย", cost: 1, value: 5, requires: "battery" },
      { id: "battery", emoji: "🔋", name: "ถ่านสำรอง", cost: 1, value: 1 },
      { id: "food", emoji: "🥫", name: "อาหารกระป๋อง 4 กระป๋อง", cost: 3, value: 7 },
      { id: "opener", emoji: "🔪", name: "มีดพับ", cost: 1, value: 4 },
      { id: "lighter", emoji: "🔥", name: "ไฟแช็ก", cost: 1, value: 6 },
      { id: "speaker", emoji: "🔊", name: "ลำโพงบลูทูธ", cost: 2, value: 1 },
      { id: "whistle", emoji: "📯", name: "นกหวีด", cost: 1, value: 5 },
    ],
  },
  {
    kind: "schedule",
    id: "exam-morning",
    title: "เช้าวันสอบ",
    titleEn: "Exam Morning",
    story:
      "ตื่นสายไปนิด! ต้องทำทุกอย่างให้เสร็จก่อนออกจากบ้าน บางงานเริ่มแล้วปล่อยให้มันทำงานเองได้ (แถบลาย) ระหว่างนั้นไปทำอย่างอื่นได้เลย",
    tasks: [
      { id: "rice", emoji: "🍚", name: "หุงข้าว", active: 3, wait: 25 },
      { id: "shower", emoji: "🚿", name: "อาบน้ำ", active: 10 },
      { id: "wash", emoji: "🧺", name: "กดเครื่องซักผ้า", active: 4, wait: 35 },
      { id: "hang", emoji: "👕", name: "ตากผ้า", active: 6, deps: ["wash"] },
      { id: "eat", emoji: "🍳", name: "ทอดไข่ + กินข้าว", active: 15, deps: ["rice"] },
      { id: "notes", emoji: "📒", name: "ทวนโน้ตรอบสุดท้าย", active: 15 },
      { id: "dress", emoji: "🎒", name: "แต่งตัว + จัดกระเป๋า", active: 7, deps: ["shower"] },
    ],
  },
  {
    kind: "budget",
    id: "anime-con",
    title: "งานอนิเมะ งบ 2,000",
    titleEn: "Anime Con",
    story:
      "งาน Anime Festival มาถึงแล้ว! มีงบ 2,000 บาท และถือของได้ไม่เกิน 6 อย่าง จะเลือกยังไงให้สนุกที่สุด",
    unit: "฿",
    valueLabel: "Fun",
    limit: 2000,
    maxItems: 6,
    mustHave: [{ tag: "ticket", label: "ต้องมีบัตรเข้างาน" }],
    items: [
      { id: "ticket", emoji: "🎫", name: "บัตรเข้างาน 1 วัน", cost: 350, value: 4, tags: ["ticket"] },
      { id: "vip", emoji: "🌟", name: "บัตร VIP (เข้าก่อน + โซนพิเศษ)", cost: 900, value: 12, tags: ["ticket"] },
      { id: "cos", emoji: "🥷", name: "ชุดคอสเพลย์มือสอง", cost: 600, value: 8 },
      { id: "wig", emoji: "💇", name: "วิกผม", cost: 250, value: 1, requires: "cos" },
      { id: "photo", emoji: "📸", name: "ถ่ายรูปกับคอสเพลเยอร์", cost: 150, value: 5 },
      { id: "fig", emoji: "🗿", name: "ฟิกเกอร์ลิมิเต็ด", cost: 1200, value: 11 },
      { id: "art", emoji: "🖼️", name: "อาร์ตบุ๊ก", cost: 450, value: 6 },
      { id: "food", emoji: "🍜", name: "ราเม็งในงาน", cost: 180, value: 4 },
      { id: "keychain", emoji: "🔑", name: "พวงกุญแจสุ่ม", cost: 120, value: 2 },
      { id: "workshop", emoji: "✏️", name: "เวิร์กชอปวาดมังงะ", cost: 300, value: 7, requires: "ticket" },
    ],
  },
  {
    kind: "schedule",
    id: "raid-prep",
    title: "เตรียมลงดันเจี้ยน",
    titleEn: "Raid Prep",
    story:
      "กิลด์นัดลง Raid แต่เราต้องเตรียมของให้ครบก่อน งานต้มยาและตีบวกอาวุธกดแล้วรอได้ ระหว่างรอไปทำอย่างอื่นก่อน",
    tasks: [
      { id: "herb", emoji: "🌿", name: "เก็บสมุนไพร", active: 8 },
      { id: "ore", emoji: "⛏️", name: "ขุดแร่", active: 10 },
      { id: "brew", emoji: "⚗️", name: "ต้มยาฟื้นพลัง", active: 3, wait: 20, deps: ["herb"] },
      { id: "forge", emoji: "🔨", name: "ตีบวกอาวุธ", active: 4, wait: 25, deps: ["ore"] },
      { id: "quest", emoji: "📜", name: "รับเควสต์ประจำวัน", active: 6 },
      { id: "party", emoji: "🧑‍🤝‍🧑", name: "จัดทีม + วางแผนบอส", active: 10, deps: ["quest"] },
      { id: "equip", emoji: "🛡️", name: "สวมอุปกรณ์ + ใส่ยา", active: 3, deps: ["brew", "forge"] },
    ],
  },
  {
    kind: "budget",
    id: "pc-upgrade",
    title: "อัปเกรดคอม 15,000",
    titleEn: "PC Upgrade",
    story:
      "คอมเครื่องเก่าเล่นเกมใหม่กระตุก มีงบ 15,000 บาท เลือกอัปเกรดให้ FPS เพิ่มมากที่สุด ระวัง: การ์ดจอแรงๆ ต้องใช้ PSU ใหม่ถึงจะเสียบได้",
    unit: "฿",
    valueLabel: "FPS+",
    limit: 15000,
    items: [
      { id: "gpu-hi", emoji: "🟩", name: "การ์ดจอรุ่นแรง", cost: 11000, value: 45, requires: "psu" },
      { id: "gpu-mid", emoji: "🟦", name: "การ์ดจอรุ่นกลาง", cost: 7500, value: 30 },
      { id: "psu", emoji: "🔌", name: "PSU 750W", cost: 2500, value: 0 },
      { id: "ram", emoji: "🧠", name: "RAM เพิ่ม 16GB", cost: 1500, value: 8 },
      { id: "ssd", emoji: "💾", name: "SSD NVMe", cost: 1800, value: 6 },
      { id: "cpu", emoji: "⚙️", name: "CPU รุ่นใหม่", cost: 5500, value: 15 },
      { id: "cooler", emoji: "❄️", name: "ฮีทซิงก์ใหม่", cost: 900, value: 3 },
      { id: "rgb", emoji: "🌈", name: "ไฟ RGB", cost: 700, value: 0 },
      { id: "paste", emoji: "🧴", name: "เปลี่ยนซิลิโคน CPU", cost: 150, value: 2 },
    ],
  },
  {
    kind: "schedule",
    id: "party-prep",
    title: "ปาร์ตี้วันเกิด",
    titleEn: "Party Prep",
    story: "เพื่อนจะมาถึงเร็วๆ นี้! พ่อแม่ไม่อยู่ ต้องเตรียมทุกอย่างคนเดียว ทำให้เสร็จเร็วที่สุด",
    tasks: [
      { id: "pizza", emoji: "🍕", name: "สั่งพิซซ่า (รอส่ง)", active: 3, wait: 40 },
      { id: "cake", emoji: "🎂", name: "อบเค้ก", active: 12, wait: 30 },
      { id: "frost", emoji: "🧁", name: "แต่งหน้าเค้ก", active: 10, deps: ["cake"] },
      { id: "clean", emoji: "🧹", name: "ทำความสะอาดห้อง", active: 15 },
      { id: "decor", emoji: "🎈", name: "ติดลูกโป่ง", active: 10, deps: ["clean"] },
      { id: "ice", emoji: "🧊", name: "ทำน้ำแข็ง", active: 2, wait: 45 },
      { id: "drinks", emoji: "🥤", name: "ชงน้ำใส่เหยือก", active: 5, deps: ["ice"] },
      { id: "table", emoji: "🍽️", name: "จัดโต๊ะอาหาร", active: 6, deps: ["pizza", "clean"] },
    ],
  },
  {
    kind: "budget",
    id: "zombie",
    title: "ซอมบี้บุกเมือง",
    titleEn: "Zombie Outbreak",
    story:
      "ข่าวด่วน! ต้องอพยพไปจุดปลอดภัยที่ห่างไป 20 km เป้แบกได้ 15 kg ต้องมีทั้งของป้องกันตัวและอาหาร",
    unit: "kg",
    valueLabel: "Survival",
    limit: 15,
    mustHave: [
      { tag: "defense", label: "ต้องมีของป้องกันตัว" },
      { tag: "food", label: "ต้องมีอาหาร" },
    ],
    items: [
      { id: "bat", emoji: "🏏", name: "ไม้เบสบอล", cost: 2, value: 6, tags: ["defense"] },
      { id: "helmet", emoji: "⛑️", name: "หมวกกันน็อก", cost: 2, value: 6, tags: ["defense"] },
      { id: "shield", emoji: "🛡️", name: "โล่ปราบจลาจล", cost: 6, value: 9, tags: ["defense"] },
      { id: "bars", emoji: "🍫", name: "ช็อกโกแลตบาร์ 10 แท่ง", cost: 1, value: 5, tags: ["food"] },
      { id: "rice", emoji: "🍚", name: "ข้าวสาร 5 kg", cost: 5, value: 6, tags: ["food"] },
      { id: "water", emoji: "💧", name: "น้ำ 3 ลิตร", cost: 3, value: 9 },
      { id: "med", emoji: "🩹", name: "ชุดปฐมพยาบาล", cost: 2, value: 8 },
      { id: "radio", emoji: "📻", name: "วิทยุมือหมุน", cost: 2, value: 6 },
      { id: "map", emoji: "🗺️", name: "แผนที่กระดาษ", cost: 1, value: 5 },
      { id: "bike-kit", emoji: "🔧", name: "ชุดซ่อมจักรยาน", cost: 3, value: 7 },
      { id: "console", emoji: "🎮", name: "เครื่องเกมพกพา", cost: 1, value: 1 },
    ],
  },
  {
    kind: "schedule",
    id: "moving-day",
    title: "วันย้ายหอ",
    titleEn: "Moving Day",
    story:
      "ต้องย้ายออกจากหอเก่าภายในวันนี้ รถขนของจองได้ต้องรอมารับ งานไหนต้องทำก่อน งานไหนต้องรอ วางแผนให้เสร็จเร็วสุด",
    tasks: [
      { id: "truck", emoji: "🚚", name: "โทรเรียกรถ (รอรถมา)", active: 5, wait: 50 },
      { id: "pack", emoji: "📦", name: "แพ็กของใส่กล่อง", active: 25 },
      { id: "laundry", emoji: "🧺", name: "ซักผ้าชุดสุดท้าย", active: 3, wait: 40 },
      { id: "fold", emoji: "👔", name: "พับผ้าใส่กล่อง", active: 8, deps: ["laundry", "pack"] },
      { id: "clean", emoji: "🧽", name: "ทำความสะอาดห้อง", active: 15, deps: ["pack"] },
      { id: "load", emoji: "🏋️", name: "ขนของขึ้นรถ", active: 15, deps: ["truck", "fold"] },
      { id: "key", emoji: "🔑", name: "คืนกุญแจ + เช็กห้อง", active: 5, deps: ["clean", "load"] },
    ],
  },
];

export const scenario = (id: string) => SCENARIOS.find((s) => s.id === id);
