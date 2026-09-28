import { notFound } from "next/navigation";
import { ClientOnly } from "@/components/ui";
import { LOGIC_GAMES, type LogicGameId } from "@/games/catalog";
import { LogicGame } from "@/games/logicGames";

export const dynamicParams = false;

export function generateStaticParams() {
  return LOGIC_GAMES.map((g) => ({ game: g.id }));
}

export default async function LogicGamePage({ params }: PageProps<"/logic/[game]">) {
  const { game } = await params;
  if (!LOGIC_GAMES.some((g) => g.id === game)) notFound();
  return (
    <ClientOnly>
      <LogicGame id={game as LogicGameId} />
    </ClientOnly>
  );
}
