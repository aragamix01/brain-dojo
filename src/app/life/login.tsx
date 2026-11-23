"use client";

import { useState } from "react";
import { afterSignIn } from "@/components/LifeSync";
import { errorText, LockIcon, PinPad, post } from "./shared";

export type PublicPlayer = { id: string; name: string; hasPin: boolean };

const API = "/api/lq/player";

/**
 * "Who's playing?": pick your name, then your 4-digit PIN (or set a new one after the parent
 * reset it). Used by Weekly Life Quest and by Brain Dojo's own lock; both share the account.
 */
export function PlayerLogin({
  players,
  title,
  onNew,
  onDone,
}: {
  players: PublicPlayer[];
  title: string;
  onNew: () => void;
  onDone: () => void;
}) {
  const [who, setWho] = useState<PublicPlayer | null>(players.length === 1 ? players[0] : null);
  const [first, setFirst] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const done = async (pin: string) => {
    if (!who) return;
    // After a reset there's no PIN: set a new one, entered twice.
    if (!who.hasPin && first === null) {
      setFirst(pin);
      return setMsg(null);
    }
    if (!who.hasPin && pin !== first) {
      setFirst(null);
      return setMsg("PIN ไม่ตรงกัน ลองตั้งใหม่อีกครั้งนะ");
    }
    setBusy(true);
    const r = await post<{ left?: number; id?: string }>(API, { action: who.hasPin ? "login" : "setPin", id: who.id, pin });
    if (r.error) {
      setBusy(false);
      setFirst(null);
      return setMsg(
        r.error === "locked"
          ? "ใส่ผิดหลายครั้ง รอ 5 นาทีแล้วลองใหม่"
          : r.error === "wrong-pin"
            ? `PIN ไม่ถูก${r.left ? ` (ลองได้อีก ${r.left} ครั้ง)` : ""}`
            : errorText(r.error),
      );
    }
    await afterSignIn(who.id, who.name);
    onDone();
  };

  if (!who)
    return (
      <div className="flex flex-col items-center gap-3 pt-10">
        <span className="flex h-16 w-16 items-center justify-center rounded-[22px] border-[2.5px] border-[#2e2a4a] bg-[#cdbeff] shadow-[3px_3px_0_#2e2a4a]">
          <LockIcon />
        </span>
        <h1 className="font-lq text-2xl font-bold">{title}</h1>
        <p className="text-sm text-[#5e5878]">ใครกำลังเล่น?</p>
        <div className="flex w-full max-w-xs flex-col gap-2.5">
          {players.map((p) => (
            <button key={p.id} className="lq-btn w-full text-lg" onClick={() => (setWho(p), setMsg(null), setFirst(null))}>
              {p.name}
            </button>
          ))}
          <button className="lq-btn lq-btn-pink w-full" onClick={onNew}>
            + ฉันเป็นคนใหม่
          </button>
        </div>
      </div>
    );

  const settingNew = !who.hasPin;
  return (
    <div className="flex flex-col items-center gap-2 pt-10">
      <span className="flex h-16 w-16 items-center justify-center rounded-[22px] border-[2.5px] border-[#2e2a4a] bg-[#cdbeff] shadow-[3px_3px_0_#2e2a4a]">
        <LockIcon />
      </span>
      <h1 className="mt-2 font-lq text-2xl font-bold">{who.name}</h1>
      <p className="mb-4 text-center text-sm text-[#5e5878]">
        {settingNew ? (first === null ? "พี่แตงพี่หยกรีเซ็ต PIN แล้ว · ตั้ง PIN 4 หลักใหม่" : "ใส่ PIN ใหม่อีกครั้ง") : "ใส่ PIN 4 หลักของเรา"}
      </p>
      {msg && <p className="mb-2 text-sm font-semibold text-[#b42357]">{msg}</p>}
      <PinPad key={`${who.id}-${first ?? ""}`} len={4} onDone={done} busy={busy} />
      <button className="mt-6 min-h-11 px-3 text-sm text-[#5b47d6] underline" onClick={() => (setWho(null), setMsg(null))}>
        ไม่ใช่ {who.name}? เปลี่ยนคน
      </button>
    </div>
  );
}
