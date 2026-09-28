"use client";

import { useState } from "react";
import { BackHeader, ClientOnly } from "@/components/ui";
import { verifyClaim } from "@/games/quest/progress";
import { useProgress } from "@/lib/store";

function Verify() {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [checked, setChecked] = useState<ReturnType<typeof verifyClaim> | null>(null);
  const delivered = useProgress((s) => s.delivered);
  const markDelivered = useProgress((s) => s.markDelivered);
  const normCode = code.trim().toUpperCase();

  return (
    <div className="space-y-4">
      <div className="card space-y-3 p-4">
        <p className="text-sm text-muted">
          หลานเปิดหีบสมบัติแล้วจะได้โค้ดแบบ <span className="font-mono text-cyan">C1-AB12</span> ใส่ชื่อ (ตามที่หลานตั้งในแอป)
          กับโค้ดเพื่อตรวจว่าของจริง
        </p>
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setChecked(null);
          }}
          placeholder="ชื่อหลาน"
          className="w-full rounded-lg bg-ink/5 px-3 py-2 outline-none focus:ring-2 focus:ring-pink"
        />
        <input
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setChecked(null);
          }}
          placeholder="โค้ด เช่น C1-AB12"
          className="w-full rounded-lg bg-ink/5 px-3 py-2 font-mono uppercase outline-none focus:ring-2 focus:ring-pink"
        />
        <button className="btn btn-primary w-full" disabled={!name.trim() || !code.trim()} onClick={() => setChecked(verifyClaim(name, code))}>
          ตรวจโค้ด
        </button>
      </div>

      {checked &&
        (checked.ok ? (
          <div className="card animate-pop p-5 text-center">
            <p className="text-5xl">✅</p>
            <p className="mt-2 font-display text-xl text-good">โค้ดถูกต้อง!</p>
            <p className="text-sm">
              {name} เปิดหีบ {checked.island.emoji} {checked.island.name} ได้จริง
            </p>
            {delivered[normCode] ? (
              <p className="mt-3 text-sm text-gold">
                ⚠️ มอบรางวัลหีบนี้ไปแล้วเมื่อ {new Date(delivered[normCode]).toLocaleString("th-TH")}
              </p>
            ) : (
              <button className="btn btn-cyan mt-4 w-full" onClick={() => markDelivered(normCode)}>
                🎁 บันทึกว่ามอบรางวัลแล้ว
              </button>
            )}
          </div>
        ) : (
          <div className="card animate-shake p-5 text-center">
            <p className="text-5xl">❌</p>
            <p className="mt-2 font-display text-xl text-bad">โค้ดไม่ถูกต้อง</p>
            <p className="text-sm text-muted">เช็กชื่อให้ตรงกับที่หลานตั้งในแอป (ตัวพิมพ์เล็ก/ใหญ่ไม่มีผล)</p>
          </div>
        ))}
      <p className="text-center text-xs text-muted">
        การบันทึกว่ามอบแล้วเก็บในเครื่องที่ใช้ตรวจ ถ้าตรวจบนมือถือของหลาน หน้าหีบจะขึ้นว่ารับรางวัลแล้วด้วย
      </p>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <>
      <BackHeader title="👨 ตรวจโค้ดรางวัล" sub="สำหรับน้า" href="/quest" />
      <ClientOnly>
        <Verify />
      </ClientOnly>
    </>
  );
}
