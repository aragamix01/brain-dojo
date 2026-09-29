"use client";

import { useEffect } from "react";
import { useProgress } from "@/lib/store";
import { CoinToastHost } from "./CoinToast";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    useProgress.persist.rehydrate();
  }, []);
  return (
    <>
      {children}
      <CoinToastHost />
    </>
  );
}
