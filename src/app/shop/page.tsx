"use client";

import { CoinChip } from "@/components/game";
import { NovaTip } from "@/components/NovaTip";
import { BackHeader, ClientOnly } from "@/components/ui";
import { RobotSprite } from "@/games/robot/RobotSprite";
import { FREEZE, SKINS, TITLES } from "@/lib/shop";
import { liveStreak, useProgress, type ShopKind } from "@/lib/store";

function BuyButton({ kind, id, price }: { kind: ShopKind; id: string; price: number }) {
  const coins = useProgress((s) => s.coins);
  const owned = useProgress((s) => !!s.owned[`${kind}:${id}`] || price === 0);
  const equipped = useProgress((s) => (s.equipped[kind] ?? (kind === "skin" ? "classic" : undefined)) === id);
  const buyItem = useProgress((s) => s.buyItem);
  const equip = useProgress((s) => s.equip);

  if (equipped) return <span className="btn btn-ghost !min-h-9 w-full text-xs opacity-70">✔ ใช้อยู่</span>;
  if (owned)
    return (
      <button className="btn btn-cyan !min-h-9 w-full text-xs" onClick={() => equip(kind, id)}>
        ใช้อันนี้
      </button>
    );
  const short = price - coins;
  return (
    <button
      className="btn btn-gold !min-h-9 w-full text-xs"
      disabled={short > 0}
      onClick={() => buyItem(kind, id)}
    >
      {short > 0 ? `ขาดอีก 🪙${short}` : `ซื้อ 🪙${price}`}
    </button>
  );
}

function Freeze() {
  const freezes = useProgress((s) => s.freezes ?? 0);
  const coins = useProgress((s) => s.coins);
  const streak = useProgress((s) => liveStreak(s));
  const buyFreeze = useProgress((s) => s.buyFreeze);
  const full = freezes >= FREEZE.max;
  return (
    <section className="panel overflow-hidden bg-white">
      <div className="flex items-center gap-3 bg-[#dff4ff] p-4">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-[3px] border-ink bg-white text-4xl shadow-[0_4px_0_#1e2a3a]">
          🧊
        </span>
        <div className="flex-1">
          <p className="font-display text-lg font-extrabold">น้ำแข็งกันไฟดับ</p>
          <p className="text-xs leading-relaxed text-muted">
            พลาดไปวันไหน ระบบใช้ให้อัตโนมัติ วันติด ⚔️ {streak} วันจะไม่รีเซ็ต (1 อันกันได้ 1 วัน)
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 border-t-[3px] border-ink p-4">
        <div className="flex flex-1 gap-1.5" aria-label={`มี ${freezes} จาก ${FREEZE.max}`}>
          {Array.from({ length: FREEZE.max }, (_, i) => (
            <span
              key={i}
              className={`flex h-9 w-9 items-center justify-center rounded-xl border-[2.5px] text-lg ${
                i < freezes ? "border-ink bg-[#bfe8ff]" : "border-dashed border-ink/30 text-ink/20"
              }`}
            >
              🧊
            </span>
          ))}
        </div>
        <button
          className="btn btn-gold !min-h-10 text-sm"
          disabled={full || coins < FREEZE.price}
          onClick={buyFreeze}
        >
          {full ? "เต็มแล้ว" : coins < FREEZE.price ? `ขาดอีก 🪙${FREEZE.price - coins}` : `ซื้อ 🪙${FREEZE.price}`}
        </button>
      </div>
    </section>
  );
}

function Shop() {
  return (
    <div className="space-y-6">
      <NovaTip id="shop">
        เหรียญที่เก็บได้ เอามาแลกของสวยๆ ได้ที่นี่ แต่อย่าใช้หมดนะ — เก็บไว้ใช้เป็นคำใบ้ตอนติดหนักๆ ด้วย! แนะนำซื้อ
        🧊 น้ำแข็งติดตัวไว้สัก 1 อัน กันวันติดหาย
      </NovaTip>
      <Freeze />

      <section>
        <h2 className="mb-1 font-display text-lg font-extrabold">🤖 สกินหุ่น Robot</h2>
        <p className="mb-3 text-xs text-muted">ใส่ตอนเล่น Robot Code ทุกด่าน — แต่งให้เท่ ไม่ช่วยให้ผ่านด่านนะ 😉</p>
        <div className="grid grid-cols-2 gap-3">
          {SKINS.map((s) => (
            <div key={s.id} className="card flex flex-col items-center gap-2 p-3">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-[2.5px] border-ink bg-[#4d8dff]/80">
                <RobotSprite skinId={s.id} angle={45} className="h-14 w-14" />
              </div>
              <p className="font-display text-sm font-bold">{s.name}</p>
              <BuyButton kind="skin" id={s.id} price={s.price} />
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-1 font-display text-lg font-extrabold">🏷️ ฉายาบนใบประกาศจับ</h2>
        <p className="mb-3 text-xs text-muted">โชว์ใต้ชื่อบนหน้าแรก และตอนแชร์ผลให้น้าดู</p>
        <div className="space-y-2">
          {TITLES.map((t) => (
            <div key={t.id} className="card flex items-center gap-3 p-3">
              <span className="flex-1 font-display font-bold">「{t.name}」</span>
              <div className="w-28">
                <BuyButton kind="title" id={t.id} price={t.price} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function ShopPage() {
  return (
    <>
      <BackHeader title="SHIP SHOP" sub="ร้านค้าบนเรือ · ใช้เหรียญแลกของ" comic right={<CoinChip />} />
      <ClientOnly>
        <Shop />
      </ClientOnly>
    </>
  );
}
