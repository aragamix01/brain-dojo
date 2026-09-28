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

/** A concrete, playable puzzle (what the solver works on). */
export type BudgetScenario = {
  kind: "budget";
  id: string;
  story: string;
  unit: string;
  valueLabel: string;
  limit: number;
  maxItems?: number;
  /** each listed tag must appear at least once */
  mustHave?: { tag: string; label: string }[];
  items: BudgetItem[];
};

export type ScheduleScenario = {
  kind: "schedule";
  id: string;
  story: string;
  tasks: Task[];
};

export type Scenario = BudgetScenario | ScheduleScenario;

/** A theme is a pool; each seed draws a different puzzle from it. */
export type BudgetTheme = Omit<BudgetScenario, "limit" | "story"> & {
  title: string;
  titleEn: string;
  /** `{limit}` is replaced with the rolled limit */
  story: string;
  /** costs and the limit are rounded to this step */
  step: number;
  /** limit as a fraction of the drawn items' total cost */
  limitRatio: [number, number];
  /** how many items to draw from the pool */
  pick: [number, number];
};

export type ScheduleTheme = ScheduleScenario & {
  title: string;
  titleEn: string;
  pick: [number, number];
};

export type Theme = BudgetTheme | ScheduleTheme;

export const THEMES: Theme[] = [
  {
    kind: "budget",
    id: "lost-trail",
    title: "หลงป่า 2 คืน",
    titleEn: "Lost Trail",
    story:
      "ทริปเดินป่ากับเพื่อน แต่พายุพัดทางเดินหาย ต้องรอทีมกู้ภัย 2 คืน เป้แบกได้ไม่เกิน {limit} kg เลือกของที่ช่วยให้รอดดีที่สุด",
    unit: "kg",
    valueLabel: "Survival",
    step: 1,
    limitRatio: [0.35, 0.5],
    pick: [10, 13],
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
      { id: "noodle", emoji: "🍜", name: "บะหมี่กึ่งสำเร็จรูป", cost: 1, value: 5, requires: "pot" },
      { id: "pot", emoji: "🍲", name: "หม้อสนาม", cost: 2, value: 2 },
      { id: "knife", emoji: "🔪", name: "มีดพับ", cost: 1, value: 4 },
      { id: "lighter", emoji: "🔥", name: "ไฟแช็ก", cost: 1, value: 6 },
      { id: "speaker", emoji: "🔊", name: "ลำโพงบลูทูธ", cost: 2, value: 1 },
      { id: "whistle", emoji: "📯", name: "นกหวีด", cost: 1, value: 5 },
      { id: "raincoat", emoji: "🧥", name: "เสื้อกันฝน", cost: 1, value: 5 },
      { id: "firstaid", emoji: "🩹", name: "ชุดปฐมพยาบาล", cost: 2, value: 7 },
      { id: "compass", emoji: "🧭", name: "เข็มทิศ", cost: 1, value: 3, requires: "map" },
      { id: "map", emoji: "🗺️", name: "แผนที่", cost: 1, value: 3 },
    ],
  },
  {
    kind: "budget",
    id: "anime-con",
    title: "งานอนิเมะ",
    titleEn: "Anime Con",
    story:
      "งาน Anime Festival มาถึงแล้ว! มีงบ {limit} บาท และถือของได้ไม่เกิน 6 อย่าง จะเลือกยังไงให้สนุกที่สุด",
    unit: "฿",
    valueLabel: "Fun",
    step: 50,
    limitRatio: [0.35, 0.5],
    pick: [9, 12],
    maxItems: 6,
    mustHave: [{ tag: "ticket", label: "ต้องมีบัตรเข้างาน" }],
    items: [
      { id: "ticket", emoji: "🎫", name: "บัตรเข้างาน 1 วัน", cost: 350, value: 4, tags: ["ticket"] },
      { id: "vip", emoji: "🌟", name: "บัตร VIP (เข้าก่อน + โซนพิเศษ)", cost: 900, value: 12, tags: ["ticket"] },
      { id: "cos", emoji: "🥷", name: "ชุดคอสเพลย์มือสอง", cost: 600, value: 8 },
      { id: "wig", emoji: "💇", name: "วิกผม", cost: 250, value: 3, requires: "cos" },
      { id: "photo", emoji: "📸", name: "ถ่ายรูปกับคอสเพลเยอร์", cost: 150, value: 5 },
      { id: "fig", emoji: "🗿", name: "ฟิกเกอร์ลิมิเต็ด", cost: 1200, value: 11 },
      { id: "art", emoji: "🖼️", name: "อาร์ตบุ๊ก", cost: 450, value: 6 },
      { id: "food", emoji: "🍜", name: "ราเม็งในงาน", cost: 180, value: 4 },
      { id: "keychain", emoji: "🔑", name: "พวงกุญแจสุ่ม", cost: 120, value: 2 },
      { id: "workshop", emoji: "✏️", name: "เวิร์กชอปวาดมังงะ", cost: 300, value: 7 },
      { id: "sign", emoji: "✍️", name: "คิวแจกลายเซ็นนักพากย์", cost: 400, value: 9, requires: "vip" },
      { id: "gacha", emoji: "🎰", name: "ตู้กาชาปอง 3 รอบ", cost: 150, value: 3 },
      { id: "tee", emoji: "👕", name: "เสื้อยืดลายเมะ", cost: 390, value: 5 },
      { id: "concert", emoji: "🎤", name: "มินิคอนเสิร์ตอนิซอง", cost: 700, value: 10 },
    ],
  },
  {
    kind: "budget",
    id: "pc-upgrade",
    title: "อัปเกรดคอม",
    titleEn: "PC Upgrade",
    story:
      "คอมเครื่องเก่าเล่นเกมใหม่กระตุก มีงบ {limit} บาท เลือกอัปเกรดให้ FPS เพิ่มมากที่สุด ระวัง: บางชิ้นต้องมีอีกชิ้นก่อนถึงจะใช้ได้",
    unit: "฿",
    valueLabel: "FPS+",
    step: 100,
    limitRatio: [0.4, 0.55],
    pick: [8, 11],
    items: [
      { id: "gpu-hi", emoji: "🟩", name: "การ์ดจอรุ่นแรง", cost: 11000, value: 45, requires: "psu" },
      { id: "gpu-mid", emoji: "🟦", name: "การ์ดจอรุ่นกลาง", cost: 7500, value: 30 },
      { id: "gpu-lo", emoji: "⬜", name: "การ์ดจอมือสอง", cost: 4200, value: 17 },
      { id: "psu", emoji: "🔌", name: "PSU 750W", cost: 2500, value: 0 },
      { id: "ram", emoji: "🧠", name: "RAM เพิ่ม 16GB", cost: 1500, value: 8 },
      { id: "ssd", emoji: "💾", name: "SSD NVMe", cost: 1800, value: 6 },
      { id: "cpu", emoji: "⚙️", name: "CPU รุ่นใหม่", cost: 5500, value: 15, requires: "board" },
      { id: "board", emoji: "🟫", name: "เมนบอร์ดใหม่", cost: 3200, value: 2 },
      { id: "cooler", emoji: "❄️", name: "ฮีทซิงก์ใหม่", cost: 900, value: 3 },
      { id: "rgb", emoji: "🌈", name: "ไฟ RGB", cost: 700, value: 0 },
      { id: "paste", emoji: "🧴", name: "เปลี่ยนซิลิโคน CPU", cost: 150, value: 2 },
      { id: "fans", emoji: "🌀", name: "พัดลมเคส 3 ตัว", cost: 600, value: 2 },
      { id: "monitor", emoji: "🖥️", name: "จอ 144Hz", cost: 4500, value: 12 },
    ],
  },
  {
    kind: "budget",
    id: "zombie",
    title: "ซอมบี้บุกเมือง",
    titleEn: "Zombie Outbreak",
    story:
      "ข่าวด่วน! ต้องอพยพไปจุดปลอดภัยที่ห่างไป 20 km เป้แบกได้ {limit} kg ต้องมีทั้งของป้องกันตัวและอาหาร",
    unit: "kg",
    valueLabel: "Survival",
    step: 1,
    limitRatio: [0.35, 0.5],
    pick: [10, 13],
    mustHave: [
      { tag: "defense", label: "ต้องมีของป้องกันตัว" },
      { tag: "food", label: "ต้องมีอาหาร" },
    ],
    items: [
      { id: "bat", emoji: "🏏", name: "ไม้เบสบอล", cost: 2, value: 6, tags: ["defense"] },
      { id: "helmet", emoji: "⛑️", name: "หมวกกันน็อก", cost: 2, value: 6, tags: ["defense"] },
      { id: "shield", emoji: "🛡️", name: "โล่ปราบจลาจล", cost: 6, value: 9, tags: ["defense"] },
      { id: "spray", emoji: "🧯", name: "สเปรย์พริกไทย", cost: 1, value: 4, tags: ["defense"] },
      { id: "bars", emoji: "🍫", name: "ช็อกโกแลตบาร์ 10 แท่ง", cost: 1, value: 5, tags: ["food"] },
      { id: "rice", emoji: "🍚", name: "ข้าวสาร 5 kg", cost: 5, value: 6, tags: ["food"], requires: "stove" },
      { id: "stove", emoji: "🔥", name: "เตาแก๊สพกพา", cost: 2, value: 1 },
      { id: "cans", emoji: "🥫", name: "ปลากระป๋อง 6 กระป๋อง", cost: 3, value: 7, tags: ["food"] },
      { id: "water", emoji: "💧", name: "น้ำ 3 ลิตร", cost: 3, value: 9 },
      { id: "med", emoji: "🩹", name: "ชุดปฐมพยาบาล", cost: 2, value: 8 },
      { id: "radio", emoji: "📻", name: "วิทยุมือหมุน", cost: 2, value: 6 },
      { id: "map", emoji: "🗺️", name: "แผนที่กระดาษ", cost: 1, value: 5 },
      { id: "bike-kit", emoji: "🔧", name: "ชุดซ่อมจักรยาน", cost: 3, value: 7 },
      { id: "console", emoji: "🎮", name: "เครื่องเกมพกพา", cost: 1, value: 1 },
      { id: "rope", emoji: "🪢", name: "เชือกปีนเขา", cost: 2, value: 5 },
    ],
  },
  {
    kind: "budget",
    id: "beach-trip",
    title: "ทริปทะเลกับเพื่อน",
    titleEn: "Beach Trip",
    story:
      "ปิดเทอมนี้ไปเที่ยวทะเลกับเพื่อน 2 วัน 1 คืน งบคนละ {limit} บาท (รวมที่พักแล้ว) เลือกกิจกรรมให้คุ้มที่สุด",
    unit: "฿",
    valueLabel: "Fun",
    step: 50,
    limitRatio: [0.35, 0.5],
    pick: [9, 12],
    mustHave: [{ tag: "stay", label: "ต้องมีที่พัก" }],
    items: [
      { id: "hostel", emoji: "🛏️", name: "โฮสเทลห้องรวม", cost: 350, value: 2, tags: ["stay"] },
      { id: "resort", emoji: "🏝️", name: "รีสอร์ตติดหาด", cost: 1200, value: 9, tags: ["stay"] },
      { id: "tent", emoji: "⛺", name: "กางเต็นท์ริมหาด", cost: 200, value: 4, tags: ["stay"] },
      { id: "snorkel", emoji: "🤿", name: "ทริปดำน้ำตื้น", cost: 700, value: 9 },
      { id: "banana", emoji: "🍌", name: "บานาน่าโบ๊ท", cost: 300, value: 6 },
      { id: "kayak", emoji: "🛶", name: "เช่าคายัค", cost: 250, value: 5 },
      { id: "seafood", emoji: "🦐", name: "ซีฟู้ดมื้อใหญ่", cost: 600, value: 7 },
      { id: "bbq", emoji: "🍢", name: "ปิ้งย่างริมหาด", cost: 250, value: 6, requires: "tent" },
      { id: "cam", emoji: "📷", name: "เช่ากล้องกันน้ำ", cost: 300, value: 3, requires: "snorkel" },
      { id: "scooter", emoji: "🛵", name: "เช่ามอเตอร์ไซค์ 1 วัน", cost: 250, value: 5 },
      { id: "viewpoint", emoji: "🌅", name: "จุดชมวิวพระอาทิตย์ตก", cost: 50, value: 4, requires: "scooter" },
      { id: "fire", emoji: "🔥", name: "โชว์ควงไฟ", cost: 100, value: 4 },
      { id: "souvenir", emoji: "🐚", name: "ของฝาก", cost: 300, value: 2 },
      { id: "spa", emoji: "💆", name: "นวดริมหาด", cost: 350, value: 3 },
    ],
  },
  {
    kind: "budget",
    id: "fair-stall",
    title: "เปิดร้านงานโรงเรียน",
    titleEn: "School Fair Stall",
    story:
      "ชมรมได้บูธในงานโรงเรียน มีทุน {limit} บาท เลือกลงทุนของให้ได้กำไรมากที่สุด (ตัวเลข = กำไรโดยประมาณหลังขายหมด หน่วยร้อยบาท)",
    unit: "฿",
    valueLabel: "กำไร",
    step: 50,
    limitRatio: [0.4, 0.55],
    pick: [9, 12],
    maxItems: 7,
    items: [
      { id: "ice", emoji: "🧊", name: "น้ำแข็ง 3 กระสอบ", cost: 150, value: 1 },
      { id: "tea", emoji: "🧋", name: "วัตถุดิบชานมไข่มุก", cost: 800, value: 9, requires: "ice" },
      { id: "soda", emoji: "🥤", name: "น้ำอัดลมอิตาเลียน", cost: 500, value: 6, requires: "ice" },
      { id: "cooler", emoji: "🧺", name: "ถังแช่ (เช่า)", cost: 200, value: 2 },
      { id: "hotdog", emoji: "🌭", name: "ไส้กรอกทอด", cost: 600, value: 7, requires: "fryer" },
      { id: "fryer", emoji: "🍳", name: "หม้อทอดไฟฟ้า (เช่า)", cost: 400, value: 0 },
      { id: "fries", emoji: "🍟", name: "เฟรนช์ฟรายส์", cost: 450, value: 6, requires: "fryer" },
      { id: "sign", emoji: "🪧", name: "ป้ายไฟหน้าร้าน", cost: 300, value: 3 },
      { id: "game", emoji: "🎯", name: "เกมปาเป้าชิงรางวัล", cost: 350, value: 5 },
      { id: "prize", emoji: "🧸", name: "ตุ๊กตาเป็นรางวัล", cost: 400, value: 4, requires: "game" },
      { id: "cookie", emoji: "🍪", name: "คุกกี้โฮมเมด", cost: 250, value: 4 },
      { id: "sticker", emoji: "🏷️", name: "สติกเกอร์ออกแบบเอง", cost: 200, value: 3 },
      { id: "speaker", emoji: "🔊", name: "ลำโพงเปิดเพลงเรียกลูกค้า", cost: 250, value: 2 },
    ],
  },
  {
    kind: "schedule",
    id: "exam-morning",
    title: "เช้าวันสอบ",
    titleEn: "Exam Morning",
    story:
      "ตื่นสายไปนิด! ต้องทำทุกอย่างให้เสร็จก่อนออกจากบ้าน บางงานเริ่มแล้วปล่อยให้มันทำงานเองได้ (แถบลาย) ระหว่างนั้นไปทำอย่างอื่นได้เลย",
    pick: [6, 8],
    tasks: [
      { id: "rice", emoji: "🍚", name: "หุงข้าว", active: 3, wait: 25 },
      { id: "shower", emoji: "🚿", name: "อาบน้ำ", active: 10 },
      { id: "wash", emoji: "🧺", name: "กดเครื่องซักผ้า", active: 4, wait: 35 },
      { id: "hang", emoji: "👕", name: "ตากผ้า", active: 6, deps: ["wash"] },
      { id: "eat", emoji: "🍳", name: "ทอดไข่ + กินข้าว", active: 15, deps: ["rice"] },
      { id: "notes", emoji: "📒", name: "ทวนโน้ตรอบสุดท้าย", active: 15 },
      { id: "dress", emoji: "🎒", name: "แต่งตัว + จัดกระเป๋า", active: 7, deps: ["shower"] },
      { id: "charge", emoji: "🔋", name: "ชาร์จเครื่องคิดเลข", active: 1, wait: 30 },
      { id: "pack-calc", emoji: "🧮", name: "เก็บเครื่องคิดเลขใส่กระเป๋า", active: 1, deps: ["charge", "dress"] },
      { id: "iron", emoji: "👔", name: "รีดเสื้อ", active: 8 },
    ],
  },
  {
    kind: "schedule",
    id: "raid-prep",
    title: "เตรียมลงดันเจี้ยน",
    titleEn: "Raid Prep",
    story:
      "กิลด์นัดลง Raid แต่เราต้องเตรียมของให้ครบก่อน งานต้มยาและตีบวกอาวุธกดแล้วรอได้ ระหว่างรอไปทำอย่างอื่นก่อน",
    pick: [6, 8],
    tasks: [
      { id: "herb", emoji: "🌿", name: "เก็บสมุนไพร", active: 8 },
      { id: "ore", emoji: "⛏️", name: "ขุดแร่", active: 10 },
      { id: "brew", emoji: "⚗️", name: "ต้มยาฟื้นพลัง", active: 3, wait: 20, deps: ["herb"] },
      { id: "forge", emoji: "🔨", name: "ตีบวกอาวุธ", active: 4, wait: 25, deps: ["ore"] },
      { id: "quest", emoji: "📜", name: "รับเควสต์ประจำวัน", active: 6 },
      { id: "party", emoji: "🧑‍🤝‍🧑", name: "จัดทีม + วางแผนบอส", active: 10, deps: ["quest"] },
      { id: "equip", emoji: "🛡️", name: "สวมอุปกรณ์ + ใส่ยา", active: 3, deps: ["brew", "forge"] },
      { id: "pet", emoji: "🐉", name: "ส่งสัตว์เลี้ยงไปฝึก", active: 2, wait: 30 },
      { id: "scroll", emoji: "📖", name: "เขียนม้วนคาถา", active: 12 },
      { id: "enchant", emoji: "✨", name: "ร่ายเอนชานต์เกราะ", active: 5, wait: 15, deps: ["scroll"] },
    ],
  },
  {
    kind: "schedule",
    id: "party-prep",
    title: "ปาร์ตี้วันเกิด",
    titleEn: "Party Prep",
    story: "เพื่อนจะมาถึงเร็วๆ นี้! พ่อแม่ไม่อยู่ ต้องเตรียมทุกอย่างคนเดียว ทำให้เสร็จเร็วที่สุด",
    pick: [6, 8],
    tasks: [
      { id: "pizza", emoji: "🍕", name: "สั่งพิซซ่า (รอส่ง)", active: 3, wait: 40 },
      { id: "cake", emoji: "🎂", name: "อบเค้ก", active: 12, wait: 30 },
      { id: "frost", emoji: "🧁", name: "แต่งหน้าเค้ก", active: 10, deps: ["cake"] },
      { id: "clean", emoji: "🧹", name: "ทำความสะอาดห้อง", active: 15 },
      { id: "decor", emoji: "🎈", name: "ติดลูกโป่ง", active: 10, deps: ["clean"] },
      { id: "ice", emoji: "🧊", name: "ทำน้ำแข็ง", active: 2, wait: 45 },
      { id: "drinks", emoji: "🥤", name: "ชงน้ำใส่เหยือก", active: 5, deps: ["ice"] },
      { id: "table", emoji: "🍽️", name: "จัดโต๊ะอาหาร", active: 6, deps: ["pizza", "clean"] },
      { id: "playlist", emoji: "🎶", name: "ทำเพลย์ลิสต์", active: 8 },
      { id: "games", emoji: "🎲", name: "เตรียมบอร์ดเกม", active: 5, deps: ["clean"] },
    ],
  },
  {
    kind: "schedule",
    id: "moving-day",
    title: "วันย้ายหอ",
    titleEn: "Moving Day",
    story:
      "ต้องย้ายออกจากหอเก่าภายในวันนี้ รถขนของจองได้ต้องรอมารับ งานไหนต้องทำก่อน งานไหนต้องรอ วางแผนให้เสร็จเร็วสุด",
    pick: [6, 8],
    tasks: [
      { id: "truck", emoji: "🚚", name: "โทรเรียกรถ (รอรถมา)", active: 5, wait: 50 },
      { id: "pack", emoji: "📦", name: "แพ็กของใส่กล่อง", active: 25 },
      { id: "laundry", emoji: "🧺", name: "ซักผ้าชุดสุดท้าย", active: 3, wait: 40 },
      { id: "fold", emoji: "👔", name: "พับผ้าใส่กล่อง", active: 8, deps: ["laundry", "pack"] },
      { id: "clean", emoji: "🧽", name: "ทำความสะอาดห้อง", active: 15, deps: ["pack"] },
      { id: "load", emoji: "🏋️", name: "ขนของขึ้นรถ", active: 15, deps: ["truck", "fold"] },
      { id: "key", emoji: "🔑", name: "คืนกุญแจ + เช็กห้อง", active: 5, deps: ["clean", "load"] },
      { id: "fridge", emoji: "🧊", name: "ละลายน้ำแข็งตู้เย็น", active: 2, wait: 45 },
      { id: "wipe", emoji: "🧻", name: "เช็ดตู้เย็นให้แห้ง", active: 5, deps: ["fridge"] },
      { id: "address", emoji: "📮", name: "แจ้งเปลี่ยนที่อยู่ออนไลน์", active: 10 },
    ],
  },
  {
    kind: "schedule",
    id: "stream-setup",
    title: "เตรียมไลฟ์สตรีม",
    titleEn: "Stream Setup",
    story:
      "นัดคนดูไว้ว่าจะไลฟ์เกมใหม่คืนนี้! แต่ยังไม่ได้เตรียมอะไรเลย บางอย่างกดแล้วรอโหลดได้ ไลฟ์ให้เร็วที่สุด",
    pick: [6, 8],
    tasks: [
      { id: "download", emoji: "⬇️", name: "โหลดอัปเดตเกม", active: 2, wait: 40 },
      { id: "mic", emoji: "🎙️", name: "ชาร์จไมค์ไร้สาย", active: 1, wait: 30 },
      { id: "thumb", emoji: "🖼️", name: "ทำภาพปก thumbnail", active: 15 },
      { id: "post", emoji: "📣", name: "โพสต์ประกาศไลฟ์", active: 3, deps: ["thumb"] },
      { id: "scene", emoji: "🎛️", name: "ตั้งค่า OBS + ฉาก", active: 12 },
      { id: "test", emoji: "🧪", name: "ทดสอบเสียงไมค์", active: 4, deps: ["mic", "scene"] },
      { id: "settings", emoji: "⚙️", name: "ปรับกราฟิกเกม", active: 5, deps: ["download"] },
      { id: "snack", emoji: "🍿", name: "ทำขนม + น้ำ", active: 8 },
      { id: "room", emoji: "🧹", name: "เก็บห้องหลังกล้อง", active: 10 },
      { id: "backup", emoji: "💾", name: "แบ็กอัปเซฟเกม (อัปโหลด)", active: 2, wait: 20 },
    ],
  },
  {
    kind: "schedule",
    id: "family-dinner",
    title: "ทำกับข้าวเย็นให้ที่บ้าน",
    titleEn: "Family Dinner",
    story:
      "วันนี้รับหน้าที่ทำอาหารเย็นให้ทั้งบ้าน! ต้องจัดลำดับให้ทุกอย่างเสร็จเร็วที่สุด งานต้ม/หุง/หมักตั้งทิ้งไว้แล้วไปทำอย่างอื่นได้",
    pick: [6, 8],
    tasks: [
      { id: "rice", emoji: "🍚", name: "หุงข้าว", active: 3, wait: 30 },
      { id: "soak", emoji: "🥣", name: "หมักหมู", active: 5, wait: 20 },
      { id: "chop", emoji: "🔪", name: "หั่นผัก", active: 12 },
      { id: "stirfry", emoji: "🥘", name: "ผัดผัก + หมู", active: 10, deps: ["chop", "soak"] },
      { id: "broth", emoji: "🍲", name: "ต้มน้ำซุป", active: 4, wait: 25 },
      { id: "soup", emoji: "🥣", name: "ใส่เครื่องแกงจืด", active: 6, deps: ["broth", "chop"] },
      { id: "egg", emoji: "🍳", name: "ทอดไข่เจียว", active: 7 },
      { id: "table", emoji: "🍽️", name: "จัดโต๊ะ", active: 5 },
      { id: "dessert", emoji: "🍮", name: "ทำขนมใส่ตู้เย็น", active: 8, wait: 40 },
      { id: "dishes", emoji: "🧽", name: "ล้างอุปกรณ์ที่ใช้แล้ว", active: 6, deps: ["chop"] },
    ],
  },
];

export const theme = (id: string) => THEMES.find((t) => t.id === id);
