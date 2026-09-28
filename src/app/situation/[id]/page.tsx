import { notFound } from "next/navigation";
import { BackHeader, ClientOnly } from "@/components/ui";
import { SituationGame } from "@/games/situation/SituationGame";
import { THEMES } from "@/games/situation/data";

export const dynamicParams = false;

export function generateStaticParams() {
  return THEMES.map((s) => ({ id: s.id }));
}

export default async function SituationPage({ params }: PageProps<"/situation/[id]">) {
  const { id } = await params;
  const th = THEMES.find((t) => t.id === id);
  if (!th) notFound();
  return (
    <>
      <BackHeader title={th.title} sub={th.titleEn} href="/situation" />
      <ClientOnly>
        <SituationGame key={th.id} th={th} />
      </ClientOnly>
    </>
  );
}
