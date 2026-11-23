"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PlayerLogin, type PublicPlayer } from "@/app/life/login";
import { LockIcon } from "@/app/life/shared";
import { adoptAccount, pullProgress } from "./LifeSync";

/** Remembers that this phone has signed in, so Brain Dojo still opens offline. */
const OPEN_KEY = "lq-open";

type State = "checking" | "open" | "locked" | "no-players" | "offline";

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
  const router = useRouter();
  const [state, setState] = useState<State>("checking");
  const [players, setPlayers] = useState<PublicPlayer[]>([]);
  const free = exempt(path);

  useEffect(() => {
    if (free || state === "open") return;
    let live = true;
    // A phone that has signed in before opens straight away; the check below can still lock it.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading this phone's remembered sign-in
    if (remembered()) setState("open");
    fetch("/api/lq/player?part=session", { cache: "no-store" })
      .then((r) => r.json())
      .then((r: { signedIn?: boolean; id?: string; name?: string; players?: PublicPlayer[]; error?: string }) => {
        if (!live) return;
        if (r.error) return setState("open"); // no database yet: never lock the game
        remember(!!r.signedIn);
        if (r.signedIn && r.id && adoptAccount(r.id, r.name)) void pullProgress();
        setPlayers(r.players ?? []);
        setState(r.signedIn ? "open" : r.players?.length ? "locked" : "no-players");
      })
      .catch(() => live && setState(remembered() ? "open" : "offline"));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-check on navigation until open
  }, [path, free]);

  if (free || state === "open") return <>{children}</>;
  if (state === "checking") return null;
  if (state === "locked")
    return (
      <div className="lq">
        <PlayerLogin
          players={players}
          title="Brain Dojo"
          onNew={() => router.push("/life?new=1")}
          onDone={() => (remember(true), setState("open"))}
        />
      </div>
    );
  return <Locked state={state} />;
}

function Locked({ state }: { state: State }) {
  return (
    <div className="lq flex flex-col items-center gap-2 pt-12">
      <span className="flex h-16 w-16 items-center justify-center rounded-[22px] border-[2.5px] border-[#2e2a4a] bg-[#cdbeff] shadow-[3px_3px_0_#2e2a4a]">
        <LockIcon />
      </span>
      <h1 className="mt-2 font-display text-2xl font-extrabold">Brain Dojo</h1>
      {state === "no-players" && (
        <>
          <p className="mb-4 max-w-xs text-center text-sm leading-relaxed">
            สร้างบัญชีก่อนเล่น · ตั้งชื่อกับ PIN 4 หลักของเราเอง ใช้ทั้ง Brain Dojo และ Weekly Life Quest และผลงานจะผูกกับบัญชีนี้
          </p>
          <Link href="/life" className="btn btn-primary">
            สร้างบัญชี
          </Link>
        </>
      )}
      {state === "offline" && <p className="max-w-xs text-center text-sm">ต่อเน็ตก่อน เพื่อเข้าเล่นครั้งแรกบนเครื่องนี้</p>}
    </div>
  );
}
