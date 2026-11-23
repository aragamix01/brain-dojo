"use client";

import { useEffect } from "react";
import { useProgress } from "@/lib/store";
import { AppGate } from "./AppGate";
import { CoinToastHost } from "./CoinToast";
import { LifeSync } from "./LifeSync";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Award badges already earned by existing progress (e.g. right after an update adds new ones).
    const off = useProgress.persist.onFinishHydration(() => {
      useProgress.getState().migrateStreak();
      useProgress.getState().checkBadges();
    });
    useProgress.persist.rehydrate();
    return off;
  }, []);
  return (
    <>
      <AppGate>{children}</AppGate>
      <CoinToastHost />
      <LifeSync />
    </>
  );
}
