"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LockIcon, PinPad, post } from "@/app/life/shared";
import { pullProgress, syncDailies, syncProgress } from "./LifeSync";

/** Remembers that this phone has signed in, so Brain Dojo still opens offline. */
const OPEN_KEY = "lq-open";

type State = "checking" | "open" | "locked" | "no-pin" | "offline";

/**
 * Brain Dojo and Weekly Life Quest share one PIN and one save. Life Quest pages run their own
 * sign-in, the parent pages use the parent PIN, and a friend's challenge link (?s=…) or a shared
 * report (#v=…) opens without one.
 */
function exempt(path: string): boolean {
  if (path.startsWith("/life") || path.startsWith("/parent")) return true;
  if (typeof window === "undefined") return false;
  return new URLSearchParams(location.search).has("s") || location.hash.startsWith("#v=");
}

const remember = (open: boolean) => {
  try {
    if (open) localStorage.setItem(OPEN_KEY, "1");
    else localStorage.removeItem(OPEN_KEY);
  } catch {
    /* fine */
  }
};
const remembered = () => {
  try {
    return localStorage.getItem(OPEN_KEY) === "1";
  } catch {
    return false;
  }
};

export function AppGate({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [state, setState] = useState<State>("checking");
  const free = exempt(path);

  useEffect(() => {
    if (free || state === "open") return;
    let live = true;
    // A phone that has signed in before opens straight away; the check below can still lock it.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading this phone's remembered sign-in
    if (remembered()) setState("open");
    fetch("/api/lq/player?part=session", { cache: "no-store" })
      .then((r) => r.json())
      .then((r: { hasPin?: boolean; signedIn?: boolean; error?: string }) => {
        if (!live) return;
        if (r.error) return setState("open"); // no database yet: never lock the game
        remember(!!r.signedIn);
        setState(r.signedIn ? "open" : r.hasPin ? "locked" : "no-pin");
      })
      .catch(() => live && setState(remembered() ? "open" : "offline"));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-check on navigation until open
  }, [path, free]);

  if (free || state === "open") return <>{children}</>;
  if (state === "checking") return null;
  return <Locked state={state} onOpen={() => (remember(true), setState("open"))} />;
}

function Locked({ state, onOpen }: { state: State; onOpen: () => void }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const login = async (pin: string) => {
    setBusy(true);
    const r = await post<{ left?: number }>("/api/lq/player", { action: "login", pin });
    if (r.error) {
      setBusy(false);
      return setMsg(
        r.error === "locked" ? "ใส่ผิดหลายครั้ง รอ 5 นาทีแล้วลองใหม่" : r.error === "wrong-pin" ? `PIN ไม่ถูก${r.left ? ` (ลองได้อีก ${r.left} ครั้ง)` : ""}` : "ต่อเน็ตไม่ได้ ลองใหม่อีกครั้ง",
      );
    }
    // This PIN's save first (it may come from another phone), then anything new from this one.
    await pullProgress();
    void syncProgress();
    void syncDailies(true);
    onOpen();
  };
  return (
    <div className="lq flex flex-col items-center gap-2 pt-12">
      <span className="flex h-16 w-16 items-center justify-center rounded-[22px] border-[2.5px] border-[#2e2a4a] bg-[#cdbeff] shadow-[3px_3px_0_#2e2a4a]">
        <LockIcon />
      </span>
      <h1 className="mt-2 font-display text-2xl font-extrabold">Brain Dojo</h1>
      {state === "locked" && (
        <>
          <p className="mb-4 text-center text-sm text-muted">ใส่ PIN 4 หลักของเรา (PIN เดียวกับ Weekly Life Quest)</p>
          {msg && <p className="mb-2 text-sm font-semibold text-bad">{msg}</p>}
          <PinPad len={4} onDone={login} busy={busy} />
          <p className="mt-6 text-center text-xs text-muted">ลืม PIN ให้น้ารีเซ็ตให้ได้</p>
        </>
      )}
      {state === "no-pin" && (
        <>
          <p className="mb-4 max-w-xs text-center text-sm leading-relaxed">ตั้ง PIN 4 หลักก่อนเล่น · ใช้ PIN เดียวกันทั้ง Brain Dojo และ Weekly Life Quest และผลงานจะผูกกับ PIN นี้</p>
          <Link href="/life" className="btn btn-primary">
            ตั้ง PIN
          </Link>
        </>
      )}
      {state === "offline" && <p className="max-w-xs text-center text-sm">ต่อเน็ตก่อน เพื่อใส่ PIN ครั้งแรกบนเครื่องนี้</p>}
    </div>
  );
}
