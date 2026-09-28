import { notFound } from "next/navigation";
import { QUEST_NODES } from "@/games/quest/data";
import { QuestNodeView } from "./QuestNodeView";

export const dynamicParams = false;

export function generateStaticParams() {
  return QUEST_NODES.map((n) => ({ node: n.id }));
}

export default async function QuestNodePage({ params }: PageProps<"/quest/[node]">) {
  const { node } = await params;
  if (!QUEST_NODES.some((n) => n.id === node)) notFound();
  return <QuestNodeView id={node} />;
}
