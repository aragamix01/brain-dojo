import { notFound } from "next/navigation";
import { BackHeader, ClientOnly } from "@/components/ui";
import { SituationGame } from "@/games/situation/SituationGame";
import { SCENARIOS } from "@/games/situation/data";

export const dynamicParams = false;

export function generateStaticParams() {
  return SCENARIOS.map((s) => ({ id: s.id }));
}

export default async function SituationPage({ params }: PageProps<"/situation/[id]">) {
  const { id } = await params;
  const sc = SCENARIOS.find((s) => s.id === id);
  if (!sc) notFound();
  return (
    <>
      <BackHeader title={sc.title} sub={sc.titleEn} href="/situation" />
      <ClientOnly>
        <SituationGame key={sc.id} sc={sc} />
      </ClientOnly>
    </>
  );
}
