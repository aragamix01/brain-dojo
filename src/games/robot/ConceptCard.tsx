import type { Chapter } from "./levels";

export function ConceptCard({ chapter, open }: { chapter: Chapter; open?: boolean }) {
  return (
    <details className="card mb-3 px-4 py-3 text-sm" open={open}>
      <summary className="cursor-pointer font-display">
        {chapter.emoji} Concept: {chapter.title} <span className="text-muted">/ {chapter.titleEn}</span>
      </summary>
      <p className="mt-2 text-muted">{chapter.concept}</p>
      <pre className="mt-2 overflow-x-auto rounded-xl bg-black/40 p-3 font-mono text-xs leading-relaxed text-cyan">
        {chapter.code}
      </pre>
    </details>
  );
}
