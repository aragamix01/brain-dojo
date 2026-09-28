import { notFound } from "next/navigation";
import { BackHeader, ClientOnly } from "@/components/ui";
import { RobotGame } from "@/games/robot/RobotGame";
import { ROBOT_LEVELS } from "@/games/robot/levels";

export const dynamicParams = false;

export function generateStaticParams() {
  return ROBOT_LEVELS.map((l) => ({ level: l.id }));
}

export default async function RobotLevelPage({ params }: PageProps<"/robot/[level]">) {
  const { level: id } = await params;
  const i = ROBOT_LEVELS.findIndex((l) => l.id === id);
  if (i === -1) notFound();
  const level = ROBOT_LEVELS[i];
  return (
    <>
      <BackHeader
        title={`${String(i + 1).padStart(2, "0")} · ${level.title}`}
        sub={level.titleEn}
        href="/robot"
      />
      <ClientOnly>
        <RobotGame key={level.id} level={level} nextId={ROBOT_LEVELS[i + 1]?.id} />
      </ClientOnly>
    </>
  );
}
