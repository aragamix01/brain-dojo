"use client";

import Link from "next/link";
import { BackHeader, ClientOnly } from "@/components/ui";
import { QuestNodeGame } from "@/games/quest/QuestNodeGame";
import { QUEST_NODES } from "@/games/quest/data";
import { isUnlocked, nodeInfo, questView } from "@/games/quest/progress";
import { ConceptCard } from "@/games/robot/ConceptCard";
import { chapterOf } from "@/games/robot/levels";
import { useHydrated, useProgress } from "@/lib/store";

function Body({ id }: { id: string }) {
  const games = useProgress((s) => s.games);
  const hydrated = useHydrated();
  const i = QUEST_NODES.findIndex((n) => n.id === id);
  const node = QUEST_NODES[i];
  if (!hydrated) return null;

  if (!isUnlocked(questView(games), id)) {
    return (
      <div className="card p-6 text-center">
        <p className="text-5xl">🔒</p>
        <p className="mt-3 font-display text-lg">ยังเดินทางมาไม่ถึงตรงนี้</p>
        <p className="text-sm text-muted">ผ่านด่านก่อนหน้าบนแผนที่ก่อนนะ</p>
        <Link href="/quest" className="btn btn-primary mt-4">
          🗺️ กลับแผนที่
        </Link>
      </div>
    );
  }

  const next = QUEST_NODES[i + 1];
  const nextHref = next && next.island.id === node.island.id ? `/quest/${next.id}` : undefined;
  const chapter = node.kind === "robot" ? chapterOf(node.level) : undefined;
  return (
    <>
      {chapter && <ConceptCard chapter={chapter} open={chapter.levels[0].id === (node.kind === "robot" && node.level)} />}
      <QuestNodeGame key={id} node={node} nextHref={nextHref} />
    </>
  );
}

export function QuestNodeView({ id }: { id: string }) {
  const node = QUEST_NODES.find((n) => n.id === id)!;
  const info = nodeInfo(node);
  const pos = node.island.nodes.findIndex((n) => n.id === id) + 1;
  return (
    <>
      <BackHeader
        title={`${node.boss ? "👹 " : info.emoji + " "}${info.title}`}
        sub={`${node.island.emoji} ${node.island.name} · ด่าน ${pos}/${node.island.nodes.length}${node.boss ? " · BOSS" : ""}`}
        href="/quest"
      />
      <ClientOnly>
        <Body id={id} />
      </ClientOnly>
    </>
  );
}
