"use client";

import { useState } from "react";
import { NovaFace } from "./Nova";

export type GuideStep = { title: string; nova: string; art: React.ReactNode; points: React.ReactNode[] };

/** Paged, Nova-narrated guide in the pirate style (used by the quest guide and "what's new"). */
export function GuideModal({
  heading,
  label,
  steps,
  finishLabel,
  finalActions,
  onClose,
}: {
  heading: string;
  label: string;
  steps: GuideStep[];
  finishLabel: string;
  /** extra buttons on the last page, e.g. links to the new features */
  finalActions?: React.ReactNode;
  onClose: () => void;
}) {
  const [step, setStep] = useState(0);
  const s = steps[step];
  const last = step === steps.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 p-3 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      <div className="panel animate-pop max-h-[94dvh] w-full max-w-md overflow-y-auto bg-white">
        <div className="sea relative px-4 pb-5 pt-4">
          <div className="flex items-center justify-between">
            <p className="comic-title text-2xl text-yellow">{heading}</p>
            <button className="font-display text-sm font-bold text-ink underline" onClick={onClose}>
              ข้าม
            </button>
          </div>
          <div className="mt-3 min-h-24">{s.art}</div>
        </div>
        <div className="wave-edge -mt-3.5" />

        <div className="px-5 pb-5 pt-2">
          <p className="font-display text-2xl font-extrabold">{s.title}</p>
          <div className="mt-3 flex items-end gap-2">
            <NovaFace className="h-14 w-[50px] shrink-0" />
            <p className="mb-1 flex-1 rounded-[16px] rounded-bl-[4px] border-[2.5px] border-ink bg-sand px-3 py-2 text-sm leading-relaxed shadow-[2px_2px_0_#1e2a3a]">
              {s.nova}
            </p>
          </div>
          <ul className="mt-4 space-y-2 text-sm leading-relaxed">
            {s.points.map((p, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-coral" />
                <span>{p}</span>
              </li>
            ))}
          </ul>

          {last && finalActions && <div className="mt-4 flex gap-2">{finalActions}</div>}

          <div className="mt-5 flex items-center gap-3">
            <div className="flex flex-1 gap-1.5" aria-label={`หน้า ${step + 1} จาก ${steps.length}`}>
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  aria-label={`ไปหน้า ${i + 1}`}
                  className={`h-2.5 rounded-full border-2 border-ink transition-all ${i === step ? "w-7 bg-coral" : "w-2.5 bg-white"}`}
                />
              ))}
            </div>
            {step > 0 && (
              <button className="btn btn-ghost !min-h-10 whitespace-nowrap text-sm" onClick={() => setStep(step - 1)}>
                ย้อน
              </button>
            )}
            <button
              className="btn btn-primary !min-h-10 whitespace-nowrap text-sm"
              onClick={() => (last ? onClose() : setStep(step + 1))}
            >
              {last ? finishLabel : "ถัดไป →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
