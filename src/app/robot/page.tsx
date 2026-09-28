"use client";

import Link from "next/link";
import { BackHeader, ClientOnly, Stars } from "@/components/ui";
import { ConceptCard } from "@/games/robot/ConceptCard";
import { RANDOM_TIERS } from "@/games/robot/generate";
import { CHAPTERS, ROBOT_LEVELS } from "@/games/robot/levels";
import { useProgress } from "@/lib/store";

function Chapters() {
  const games = useProgress((s) => s.games);
  const doneIdx = (id: string) => !!games[`robot:${id}`];
  return (
    <div className="space-y-6">
      {CHAPTERS.map((ch, ci) => {
        const done = ch.levels.filter((l) => doneIdx(l.id)).length;
        return (
          <section key={ch.id}>
            <div className="mb-2 flex items-baseline justify-between">
              <h2 className="font-display text-lg">
                <span className="text-pink">{ci + 1}.</span> {ch.emoji} {ch.title}{" "}
                <span className="text-sm text-muted">{ch.titleEn}</span>
              </h2>
              <span className="text-xs text-muted">
                {done}/{ch.levels.length}
              </span>
            </div>
            <ConceptCard chapter={ch} />
            <div className="grid grid-cols-3 gap-2">
              {ch.levels.map((lv) => {
                const i = ROBOT_LEVELS.indexOf(lv);
                const unlocked = i === 0 || doneIdx(ROBOT_LEVELS[i - 1].id);
                const body = (
                  <>
                    <p className="font-display text-[10px] text-pink">
                      {ch.titleEn.toUpperCase()} {ch.levels.indexOf(lv) + 1}
                    </p>
                    <p className="mt-0.5 font-display text-sm leading-tight">{lv.title}</p>
                    <div className="mt-1">
                      {unlocked ? <Stars n={games[`robot:${lv.id}`]?.bestStars ?? 0} size="text-xs" /> : "🔒"}
                    </div>
                  </>
                );
                return unlocked ? (
                  <Link key={lv.id} href={`/robot/${lv.id}`} className="card p-3 active:scale-[0.97]">
                    {body}
                  </Link>
                ) : (
                  <div key={lv.id} className="card p-3 opacity-40">
                    {body}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function RandomLab() {
  const games = useProgress((s) => s.games);
  return (
    <section className="mb-6">
      <h2 className="mb-2 font-display text-lg">🎲 Random Lab</h2>
      <p className="mb-3 text-xs text-muted">ด่านสุ่มไม่รู้จบ — ทุกด่านมีคำตอบแน่นอน ส่งลิงก์ท้าเพื่อนได้</p>
      <div className="grid grid-cols-3 gap-2">
        {RANDOM_TIERS.map((t) => (
          <Link key={t.id} href={`/robot/random?t=${t.id}`} className="card p-3 active:scale-[0.97]">
            <p className="text-2xl">{t.emoji}</p>
            <p className="font-display text-sm leading-tight">{t.title}</p>
            <p className="mt-0.5 text-[10px] leading-tight text-muted">{t.desc}</p>
            <p className="mt-1 text-[10px] text-cyan">ผ่าน {games[`robot:rand-${t.id}`]?.wins ?? 0}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function RobotList() {
  return (
    <>
      <BackHeader title="🤖 Robot Code" sub="เรียนพื้นฐานการเขียนโปรแกรม ทีละหมวด" href="/play" />
      <p className="mb-4 text-sm text-muted">
        {ROBOT_LEVELS.length} ด่าน {CHAPTERS.length} หมวด ไล่จากง่ายไปยาก ผ่านด่านก่อนหน้าเพื่อปลดล็อกด่านถัดไป
      </p>
      <ClientOnly>
        <RandomLab />
        <Chapters />
      </ClientOnly>
    </>
  );
}
