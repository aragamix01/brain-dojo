// The ship's shop: cosmetics and streak freezes. Nothing here makes a puzzle easier.

export type Skin = { id: string; name: string; price: number; fill: string; badge?: string };
export type Title = { id: string; name: string; price: number };

export const SKINS: Skin[] = [
  { id: "classic", name: "หุ่นคลาสสิก", price: 0, fill: "#ffffff" },
  { id: "gold", name: "หุ่นทองคำ", price: 6, fill: "#ffc93c" },
  { id: "coral", name: "หุ่นปะการัง", price: 6, fill: "#ff7a9a" },
  { id: "pirate", name: "กัปตันโจรสลัด", price: 10, fill: "#3b4a5e", badge: "🏴‍☠️" },
  { id: "ninja", name: "นินจาเงา", price: 10, fill: "#1e2a3a", badge: "🥷" },
  { id: "kraken", name: "คราเคน", price: 12, fill: "#8e7cff", badge: "🐙" },
  { id: "cat", name: "แมวเหมียว", price: 12, fill: "#ffb45c", badge: "🐱" },
  { id: "rocket", name: "จรวดทะยาน", price: 15, fill: "#5cc8f5", badge: "🚀" },
];

export const TITLES: Title[] = [
  { id: "planner", name: "จอมวางแผน", price: 5 },
  { id: "bughunter", name: "นักล่าบั๊ก", price: 5 },
  { id: "loopking", name: "เจ้าแห่งลูป", price: 8 },
  { id: "lightsout", name: "ราชาไฟดับ", price: 8 },
  { id: "noai", name: "สมองล้วน ไม่ง้อ AI", price: 12 },
  { id: "captain", name: "กัปตันสมองเหล็ก", price: 15 },
];

export const FREEZE = { price: 4, max: 2 } as const;

export const skin = (id?: string) => SKINS.find((s) => s.id === id) ?? SKINS[0];
export const title = (id?: string) => TITLES.find((t) => t.id === id);
