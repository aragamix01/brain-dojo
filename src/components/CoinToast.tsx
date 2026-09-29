"use client";

import { useEffect, useState } from "react";
import { useProgress } from "@/lib/store";

/** Floating "+1 🪙 …" note whenever the wallet gets paid. */
export function CoinToastHost() {
  const toast = useProgress((s) => s.coinToast);
  const [hiddenId, setHiddenId] = useState<number | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setHiddenId(toast.id), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  if (!toast || toast.id === hiddenId) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex justify-center px-4" role="status">
      <p className="animate-pop rounded-full border-[2.5px] border-ink bg-yellow px-4 py-2 font-display text-sm font-extrabold shadow-[3px_3px_0_#1e2a3a]">
        {toast.text}
      </p>
    </div>
  );
}
