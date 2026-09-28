"use client";

import { dayKey } from "@/lib/date";
import { useHydrated, useProgress } from "@/lib/store";

/**
 * A "come look" dot that appears once per day on a button and clears when it is tapped.
 * `force` keeps it on regardless (e.g. an unopened chest or today's daily not played yet).
 */
export function useDailyDot(id: string, force = false) {
  const hydrated = useHydrated();
  const last = useProgress((s) => s.seen[`dot:${id}`]);
  const markSeen = useProgress((s) => s.markSeen);
  const fresh = !last || dayKey(new Date(last)) !== dayKey();
  return {
    show: hydrated && (force || fresh),
    clear: () => markSeen(`dot:${id}`),
  };
}

export function RedDot({ show, className = "-right-1.5 -top-1.5" }: { show: boolean; className?: string }) {
  if (!show) return null;
  return (
    <span className={`pointer-events-none absolute z-20 flex h-5 w-5 ${className}`} aria-hidden="true">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ff3b30] opacity-60" />
      <span className="relative inline-flex h-5 w-5 rounded-full border-[2.5px] border-ink bg-[#ff3b30]" />
    </span>
  );
}
