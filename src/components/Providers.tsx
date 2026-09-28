"use client";

import { useEffect } from "react";
import { useProgress } from "@/lib/store";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    useProgress.persist.rehydrate();
  }, []);
  return children;
}
