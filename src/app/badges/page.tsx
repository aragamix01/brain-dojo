"use client";

import { CoinChip } from "@/components/game";
import { NovaTip } from "@/components/NovaTip";
import { BackHeader, ClientOnly } from "@/components/ui";
import { ACHIEVEMENTS, BADGE_COINS } from "@/lib/achievements";
import { snapshot, useProgress } from "@/lib/store";

function Badges() {
  // Re-render whenever progress changes; badges themselves are computed from it.
  useProgress((s) => s.games);
  const earnedAt = useProgress((s) => s.badges);
  const data = snapshot();
  const earned = ACHIEVEMENTS.filter((a) => earnedAt[a.id]).length;

  return (
    <>
      <NovaTip id="badges">
        ตราได้เองอัตโนมัติเมื่อทำถึงเป้า ไม่ต้องกดรับ — ได้ตราใหม่รับ 🪙 เพิ่มด้วย ดูแถบใต้แต่ละตราว่าเหลืออีกเท่าไหร่ แล้วไปลุยกัน!
      </NovaTip>
      <div className="card mb-5 flex items-center gap-3 p-4">
        <span className="text-4xl">🏅</span>
        <div className="flex-1">
          <p className="font-display text-lg font-extrabold">
            {earned} / {ACHIEVEMENTS.length} ตรา
          </p>
          <p className="text-xs text-muted">ได้ตราใหม่แต่ละอันรับ 🪙 {BADGE_COINS} เหรียญ</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {ACHIEVEMENTS.map((a) => {
          const got = !!earnedAt[a.id];
          const { cur, max } = a.progress(data);
          return (
            <div key={a.id} className={`card flex flex-col items-center gap-1.5 p-3 text-center ${got ? "" : "opacity-80"}`}>
              <span
                className={`flex h-16 w-16 items-center justify-center rounded-full border-[3px] text-3xl ${
                  got ? "border-ink bg-yellow shadow-[0_4px_0_#1e2a3a]" : "border-dashed border-ink/30 bg-ink/5 grayscale"
                }`}
              >
                {a.emoji}
              </span>
              <p className="font-display text-sm font-extrabold leading-tight">{a.name}</p>
              <p className="text-[11px] leading-snug text-muted">{a.desc}</p>
              {got ? (
                <p className="font-display text-xs font-bold text-good">
                  ✔ {new Date(earnedAt[a.id]).toLocaleDateString("th-TH")}
                </p>
              ) : (
                <div className="w-full">
                  <div className="h-2.5 overflow-hidden rounded-full border-2 border-ink bg-white">
                    <div className="h-full bg-ocean" style={{ width: `${(cur / max) * 100}%` }} />
                  </div>
                  <p className="mt-0.5 font-display text-[11px] font-bold">
                    {cur} / {max}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

export default function BadgesPage() {
  return (
    <>
      <BackHeader title="BADGES" sub="สมุดตราสัญลักษณ์ของลูกเรือ" comic right={<CoinChip />} />
      <ClientOnly>
        <Badges />
      </ClientOnly>
    </>
  );
}
