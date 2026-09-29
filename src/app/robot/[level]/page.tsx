import { notFound } from "next/navigation";
import { CoinChip } from "@/components/game";
import { BackHeader, ClientOnly } from "@/components/ui";
import { ConceptCard } from "@/games/robot/ConceptCard";
import { RobotGame } from "@/games/robot/RobotGame";
import { ROBOT_LEVELS, chapterOf } from "@/games/robot/levels";

export const dynamicParams = false;

export function generateStaticParams() {
  return ROBOT_LEVELS.map((l) => ({ level: l.id }));
}

export default async function RobotLevelPage({ params }: PageProps<"/robot/[level]">) {
  const { level: id } = await params;
  const i = ROBOT_LEVELS.findIndex((l) => l.id === id);
  if (i === -1) notFound();
  const level = ROBOT_LEVELS[i];
  const chapter = chapterOf(id)!;
  const n = chapter.levels.indexOf(level) + 1;
  return (
    <>
      <BackHeader
        title={`${chapter.emoji} ${level.title}`}
        sub={`${chapter.titleEn} ${n}/${chapter.levels.length} · ${level.titleEn}`}
        href="/robot"
        right={<CoinChip />}
      />
      {/* Open the concept on each chapter's first level */}
      <ConceptCard chapter={chapter} open={n === 1} />
      <ClientOnly>
        <RobotGame key={level.id} level={level} nextId={ROBOT_LEVELS[i + 1]?.id} />
      </ClientOnly>
    </>
  );
}
