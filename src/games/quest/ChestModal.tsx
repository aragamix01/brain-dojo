"use client";

import { useState } from "react";
import { useProgress } from "@/lib/store";
import type { Island } from "./data";
import { claimCode } from "./progress";

export function ChestModal({ island, index, onClose }: { island: Island; index: number; onClose: () => void }) {
  const name = useProgress((s) => s.name);
  const setName = useProgress((s) => s.setName);
  const delivered = useProgress((s) => s.delivered);
  const [draft, setDraft] = useState(name);
  const [copied, setCopied] = useState(false);
  const code = name.trim() ? claimCode(name, index) : null;

  const share = async () => {
    if (!code) return;
    const text = `🎁 ${name} เปิดหีบสมบัติ "${island.name}" ใน Brain Dojo แล้ว!\n🔐 โค้ดลับ: ${code}`;
    try {
      if (navigator.share) await navigator.share({ text });
      else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
      }
    } catch {
      /* cancelled */
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="card speedlines animate-pop w-full max-w-sm p-6 text-center"
        style={{ borderColor: island.color }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="animate-bounce text-7xl">🎁</p>
        <p className="mt-2 font-display text-2xl text-gold">เปิดหีบสมบัติสำเร็จ!</p>
        <p className="text-sm text-muted">
          {island.emoji} {island.name} · {island.nameEn}
        </p>
        <p className="mt-4 font-display text-lg">หีบเผยโค้ดลับออกมา! 🔐</p>
        <p className="mt-1 text-sm font-bold text-gold">ในหีบมี 🪙 3 เหรียญคำใบ้ด้วย!</p>

        {code ? (
          <>
            <p className="mt-4 text-xs text-muted">โค้ดลับนี้มีรางวัลซ่อนอยู่… จงหาวิธีใช้ให้เจอ 🗝️</p>
            <p className="mt-1 rounded-xl bg-ink/5 py-3 font-mono text-3xl tracking-widest text-cyan">{code}</p>
            <p className="mt-1 text-[11px] text-muted">ผูกกับชื่อ &quot;{name}&quot;</p>
            {delivered[code] ? (
              <p className="mt-3 text-good">✔ รับรางวัลแล้ว</p>
            ) : (
              <button className="btn btn-primary mt-4 w-full" onClick={share}>
                {copied ? "คัดลอกแล้ว ✔" : "📤 เก็บโค้ดลับไว้"}
              </button>
            )}
          </>
        ) : (
          <div className="mt-4 text-left">
            <p className="text-sm text-muted">ใส่ชื่อก่อน โค้ดลับจะผูกกับชื่อนี้ (เปลี่ยนชื่อทีหลัง โค้ดจะเปลี่ยนด้วย)</p>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="ชื่อเล่น"
              className="mt-2 w-full rounded-lg bg-ink/5 px-3 py-2 outline-none focus:ring-2 focus:ring-pink"
            />
            <button className="btn btn-primary mt-2 w-full" disabled={!draft.trim()} onClick={() => setName(draft)}>
              เผยโค้ดลับ
            </button>
          </div>
        )}
        <button className="btn btn-ghost mt-2 w-full" onClick={onClose}>
          ปิด
        </button>
      </div>
    </div>
  );
}
