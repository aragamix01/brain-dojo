"use client";

import { useEffect, useMemo, useState } from "react";
import { CoinChip } from "@/components/game";
import { BackHeader, ClientOnly, SeedBar, Tabs } from "@/components/ui";
import { RobotGame } from "@/games/robot/RobotGame";
import { RANDOM_TIERS, generateRobotLevel, type RandomTier } from "@/games/robot/generate";
import { randomSeed } from "@/lib/rng";
import { codeToSeed, readParams, seedToCode, writeParams } from "@/lib/seedUrl";

function RandomRobot() {
  const [tier, setTier] = useState<RandomTier>(
    () => RANDOM_TIERS.find((t) => t.id === readParams().get("t"))?.id ?? "seq",
  );
  const [seed, setSeed] = useState(() => codeToSeed(readParams().get("s")) ?? randomSeed());
  const level = useMemo(() => generateRobotLevel(tier, seed), [tier, seed]);
  useEffect(() => writeParams({ t: tier, s: seedToCode(seed) }), [tier, seed]);

  const next = () => {
    setSeed(randomSeed());
    window.scrollTo({ top: 0 });
  };

  return (
    <>
      <div className="mb-3 space-y-2">
        <Tabs
          value={tier}
          options={RANDOM_TIERS.map((t) => ({ value: t.id, label: `${t.emoji} ${t.title}` }))}
          onChange={(t) => {
            setTier(t);
            setSeed(randomSeed());
          }}
        />
        <SeedBar code={seedToCode(seed)} title="Brain Dojo · Robot Random" onNew={next} />
      </div>
      <RobotGame key={`${tier}-${seed}`} level={level} onNext={next} recordKey={`robot:rand-${tier}`} />
    </>
  );
}

export default function RandomRobotPage() {
  return (
    <>
      <BackHeader title="🎲 Random Lab" sub="ด่านสุ่มจาก seed — ทุกด่านแก้ได้แน่นอน" href="/robot" right={<CoinChip />} />
      <ClientOnly>
        <RandomRobot />
      </ClientOnly>
    </>
  );
}
