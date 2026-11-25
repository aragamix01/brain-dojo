// Weekly Life Quest question bank. The same 10 questions every week so answers compare over time;
// the parent can edit or switch them off later (stored copies replace these defaults).

export type QuestionType = "single" | "multi" | "rating" | "text";

export type Question = {
  id: string;
  topic: string;
  text: string;
  type: QuestionType;
  /** choices for single / multi */
  options?: string[];
  /** a free-text box under the choices or rating (optional to fill unless textRequired) */
  textLabel?: string;
  textRequired?: boolean;
  textHint?: string;
  /** what each rating 1–5 means */
  ratingNotes?: string[];
  help?: string;
  /** shows "ขอข้ามข้อนี้"; otherwise the question must be answered before sending */
  skippable?: boolean;
  /** choices that open a required box when picked: choice → what to write */
  followUps?: Record<string, string>;
  active: boolean;
};

/** Choices that are always fine to pick: "not sure" is an answer, not a failure. */
export const UNSURE = "ยังไม่แน่ใจ";

export const DEFAULT_QUESTIONS: Question[] = [
  {
    id: "mood",
    topic: "ความรู้สึก",
    text: "สัปดาห์นี้โดยรวมแล้วเรารู้สึกอย่างไร?",
    help: "เลือกอันที่ใกล้ที่สุด",
    type: "single",
    options: ["มีความสุข", "สนุก", "ปกติ", "เหนื่อย", "เครียด", "ไม่ค่อยรู้สึกอะไรเป็นพิเศษ", UNSURE],
    followUps: { เครียด: "เครียดเรื่องอะไร?" },
    active: true,
  },
  {
    id: "time-spent",
    topic: "เวลาของเรา",
    text: "สัปดาห์นี้เราใช้เวลาส่วนใหญ่ไปกับอะไร?",
    help: "เลือกได้หลายข้อ",
    type: "multi",
    options: ["เล่นเกม", "Social Media", "เรียน", "ทำการบ้าน", "เพื่อน", "ครอบครัว", "กีฬา", "พักผ่อน"],
    active: true,
  },
  {
    id: "proud",
    topic: "ภูมิใจ",
    text: "สัปดาห์นี้มีเรื่องอะไรที่ทำให้เรารู้สึกภูมิใจในตัวเองบ้าง?",
    help: "เรื่องเล็กๆ ก็นับนะ",
    type: "text",
    textLabel: "เรื่องที่ภูมิใจ",
    textHint: "เช่น ตื่นทันเองทุกวัน",
    active: true,
  },
  {
    id: "school",
    topic: "การเรียน",
    text: "สัปดาห์นี้การเรียนของเราเป็นอย่างไร?",
    type: "single",
    options: ["เข้าใจดี", "เข้าใจเป็นส่วนใหญ่", "มีบางวิชาไม่เข้าใจ", "ตามบทเรียนไม่ทัน", "ไม่ค่อยตั้งใจเรียน", "ไม่ได้เรียน", UNSURE],
    followUps: { มีบางวิชาไม่เข้าใจ: "วิชาไหน เรื่องอะไร?", ตามบทเรียนไม่ทัน: "วิชาไหน?" },
    active: true,
  },
  {
    id: "school-todo",
    topic: "งานเรียน",
    text: "สัปดาห์นี้มีเรื่องเกี่ยวกับการเรียนอะไรที่ต้องจัดการบ้าง?",
    help: "เลือกได้หลายข้อ",
    type: "multi",
    options: ["ทำการบ้าน", "อ่านหนังสือ", "ทบทวนบทเรียน", "ส่งงาน", "แก้ไขงาน", "ขอความช่วยเหลือ", "ไม่มีงานค้าง", "ยังไม่ได้เริ่มงาน"],
    followUps: { ขอความช่วยเหลือ: "อยากให้ช่วยเรื่องอะไร?" },
    textLabel: "วิชาที่อยากพัฒนา",
    textHint: "เช่น คณิต เรื่องลิมิต",
    active: true,
  },
  {
    id: "time-mgmt",
    topic: "จัดการเวลา",
    text: "สัปดาห์นี้เราจัดการเวลาได้ดีแค่ไหน?",
    help: "ให้คะแนนตัวเองแบบใจดีนะ",
    type: "rating",
    ratingNotes: [
      "ยังจัดการไม่ได้เลย งานค้างหลายอย่าง",
      "พอได้บ้าง แต่ทำงานแบบรีบตอนท้าย",
      "กลางๆ บางวันดี บางวันหลุด",
      "ดี ทำตามแผนได้เกือบทุกวัน",
      "ดีมาก มีเวลาเหลือพักด้วย",
    ],
    active: true,
  },
  {
    id: "duty",
    topic: "ความรับผิดชอบ",
    text: "สัปดาห์นี้เรารับผิดชอบหน้าที่ของตัวเองได้แค่ไหน?",
    type: "single",
    options: ["ทำได้เองทั้งหมด", "ทำได้เกือบหมด", "ต้องมีคนช่วย", "ยังละเลยหลายอย่าง", "ยังไม่ได้ลงมือทำ"],
    textLabel: "สิ่งที่อยากปรับปรุง",
    textHint: "เช่น ล้างจานเองโดยไม่ต้องให้ใครเตือน",
    active: true,
  },
  {
    id: "interests",
    topic: "ความสนใจ",
    text: "ตอนนี้มีเรื่องอะไรที่เราเริ่มสนใจหรืออยากเรียนรู้เพิ่มเติมไหม?",
    help: "เลือกได้หลายข้อ",
    type: "multi",
    options: ["Technology", "Business", "Art & Design", "Languages", "Science", "Sports", "Gaming", "Music", "Cooking", "ยังไม่มีสิ่งที่สนใจ", "อื่นๆ"],
    followUps: { อื่นๆ: "สนใจเรื่องอะไร?" },
    active: true,
  },
  {
    id: "try",
    topic: "อยากลอง",
    text: "ถ้ามีโอกาสทดลองทำอะไรใหม่ๆ อยากลองอะไร?",
    type: "text",
    textLabel: "สิ่งที่อยากลอง",
    textHint: "ตอบว่า ยังไม่รู้ ก็ได้",
    active: true,
  },
  {
    id: "next-goal",
    topic: "สัปดาห์หน้า",
    text: "สัปดาห์หน้าเราอยากพัฒนาตัวเองเรื่องอะไรมากที่สุด?",
    help: "เลือก 1 เรื่อง แล้วตั้งเป้าเล็กๆ 1 อย่าง",
    type: "single",
    options: ["ตั้งใจเรียน", "ทำการบ้าน", "จัดการเวลา", "ลดเวลาเล่นเกม", "สุขภาพ", "งานบ้าน", "เก็บเงิน", "ค้นหาตัวเอง", "ความสัมพันธ์", "อื่นๆ"],
    followUps: { อื่นๆ: "เรื่องอะไร?" },
    textLabel: "เป้าหมาย 1 อย่างที่อยากทำให้สำเร็จ",
    textHint: "เช่น อ่านชีวะวันละ 20 นาที",
    active: true,
  },
];

/** Question ids the app reads for goals, trends and interests. */
export const Q = {
  mood: "mood",
  timeMgmt: "time-mgmt",
  interests: "interests",
  try: "try",
  goal: "next-goal",
} as const;

export const TYPE_LABEL: Record<QuestionType, string> = {
  single: "เลือก 1 ข้อ",
  multi: "เลือกหลายข้อ",
  rating: "คะแนน 1–5",
  text: "เขียนเอง",
};
