"use client";

import { useHydrated, useProgress } from "@/lib/store";
import { NovaFace } from "./Nova";

/** One-time Nova speech bubble at the top of a page; dismissed for good with "เข้าใจแล้ว". */
export function NovaTip({ id, children }: { id: string; children: React.ReactNode }) {
  const hydrated = useHydrated();
  const seen = useProgress((s) => !!s.seen[`tip:${id}`]);
  const markSeen = useProgress((s) => s.markSeen);
  if (!hydrated || seen) return null;
  return (
    <div className="animate-pop mb-5 flex items-end gap-2">
      <NovaFace className="h-16 w-[58px] shrink-0" />
      <div className="mb-1 flex-1 rounded-[18px] rounded-bl-[4px] border-[2.5px] border-ink bg-white px-3.5 py-2.5 text-sm leading-relaxed shadow-[3px_3px_0_#1e2a3a]">
        <span className="font-display text-xs font-bold text-cyan">Nova · ต้นหนประจำเรือ</span>
        <div>{children}</div>
        <button className="mt-2 font-display text-xs font-bold underline" onClick={() => markSeen(`tip:${id}`)}>
          เข้าใจแล้ว ✔
        </button>
      </div>
    </div>
  );
}
