"use client";

import { useEffect, useMemo, useState } from "react";
import { HintButton, ResultModal, Toast, useSession } from "@/components/game";
import { SeedBar } from "@/components/ui";
import { randomSeed } from "@/lib/rng";
import { codeToSeed, readParams, seedToCode, writeParams } from "@/lib/seedUrl";
import { useProgress } from "@/lib/store";
import type { BudgetScenario, ScheduleScenario, Theme } from "./data";
import { generateScenario } from "./generate";
import { bestBudget, bestSchedule, evalBudget, simulate } from "./solver";

type Finish = { score: number; best: number; stars: number; xp: number; unit: string };

/** Where results are saved and where "back" goes — free play and Quest differ. */
type Cfg = { recordKey: string; backHref: string; onNew?: () => void };

function useFinish(key: string) {
  const recordWin = useProgress((s) => s.recordWin);
  const prevStars = useProgress((s) => s.games[key]?.bestStars ?? 0);
  return (stars: number) =>
    // XP only when the result beats your previous best, so resubmitting doesn't farm points.
    stars > prevStars ? recordWin(key, { stars, xpBase: 25 }) : 0;
}

function HintList({ hints, shown, onMore, startedAt }: { hints: string[]; shown: number; onMore: () => void; startedAt: number }) {
  return (
    <div className="mt-4 space-y-2">
      {hints.slice(0, shown).map((h, i) => (
        <p key={i} className="rounded-xl border border-cyan/40 bg-cyan/5 px-3 py-2 text-sm text-cyan">
          💡 {h}
        </p>
      ))}
      {shown < hints.length && (
        <div className="flex justify-center">
          <HintButton startedAt={startedAt} onHint={onMore} />
        </div>
      )}
    </div>
  );
}

function Budget({ sc, cfg }: { sc: BudgetScenario; cfg: Cfg }) {
  const best = useMemo(() => bestBudget(sc), [sc]);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [msg, setMsg] = useState<string | null>(null);
  const [hints, setHints] = useState(0);
  const [done, setDone] = useState<Finish | null>(null);
  const session = useSession();
  const finish = useFinish(cfg.recordKey);
  const e = evalBudget(sc, picked);
  const over = e.cost > sc.limit;
  const byId = new Map(sc.items.map((i) => [i.id, i]));

  const toggle = (id: string) => {
    const next = new Set(picked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setPicked(next);
    setMsg(null);
  };

  const submit = () => {
    if (e.problems.length) return setMsg(e.problems.join(" · "));
    const ratio = e.value / best;
    const stars = Math.max(1, (ratio >= 1 ? 3 : ratio >= 0.85 ? 2 : 1) - Math.max(0, hints - 1));
    const xp = finish(stars);
    setDone({ score: e.value, best, stars, xp, unit: sc.valueLabel });
  };

  const hintText = [
    `ลองคิด "ความคุ้ม" = ${sc.valueLabel} ÷ ${sc.unit} ของแต่ละอย่าง อันไหนคุ้มสุด?`,
    "ของบางอย่างจะไม่มีประโยชน์เลยถ้าไม่มีของคู่กัน และของที่คุ้มสุดไม่จำเป็นต้องได้คะแนนรวมสูงสุดเสมอ",
    `คำตอบที่ดีที่สุดได้ ${best} ${sc.valueLabel} — ไปหาให้เจอ!`,
  ];

  return (
    <>
      <div className="sticky top-0 z-20 -mx-4 mb-3 bg-ink/90 px-4 py-2 backdrop-blur">
        <div className="flex justify-between text-sm">
          <span className={over ? "text-bad" : ""}>
            {e.cost.toLocaleString()} / {sc.limit.toLocaleString()} {sc.unit}
            {sc.maxItems ? ` · ${picked.size}/${sc.maxItems} ชิ้น` : ""}
          </span>
          <span>
            {sc.valueLabel} <b className="font-display text-yellow">{e.value}</b>
          </span>
        </div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full transition-all ${over ? "bg-bad" : "bg-cyan"}`}
            style={{ width: `${Math.min(100, (e.cost / sc.limit) * 100)}%` }}
          />
        </div>
      </div>

      <ul className="mb-3 space-y-0.5 text-xs text-muted">
        <li>• รวมไม่เกิน {sc.limit.toLocaleString()} {sc.unit}</li>
        {sc.maxItems && <li>• เลือกได้ไม่เกิน {sc.maxItems} อย่าง</li>}
        {sc.mustHave?.map((m) => <li key={m.tag}>• {m.label}</li>)}
        <li>• เป้าหมาย: {sc.valueLabel} รวมสูงที่สุด</li>
      </ul>

      <div className="grid grid-cols-2 gap-2">
        {sc.items.map((it) => {
          const on = picked.has(it.id);
          const dead = e.dead.includes(it.id);
          return (
            <button
              key={it.id}
              onClick={() => toggle(it.id)}
              className={`rounded-2xl border p-3 text-left transition active:scale-95 ${
                on ? "border-pink bg-pink/15" : "border-white/10 bg-white/5"
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="text-2xl">{it.emoji}</span>
                <span className="text-xs text-muted">
                  {it.cost.toLocaleString()} {sc.unit}
                </span>
              </div>
              <p className="mt-1 text-sm leading-tight">{it.name}</p>
              <p className={`mt-1 text-xs ${dead ? "text-bad line-through" : "text-yellow"}`}>
                +{it.value} {sc.valueLabel}
              </p>
              {it.requires && (
                <p className="mt-0.5 text-[11px] text-muted">
                  ใช้ได้เมื่อมี {byId.get(it.requires)?.emoji} {byId.get(it.requires)?.name}
                </p>
              )}
            </button>
          );
        })}
      </div>

      <Toast msg={msg} />
      <button className="btn btn-primary mt-4 w-full" onClick={submit} disabled={!picked.size}>
        ✅ ตัดสินใจแล้ว!
      </button>
      <HintList hints={hintText} shown={hints} startedAt={session.startedAt} onMore={() => { setHints(hints + 1); session.takeHint(); }} />
      <FinishModal done={done} onRetry={() => setDone(null)} cfg={cfg} />
    </>
  );
}

function Schedule({ sc, cfg }: { sc: ScheduleScenario; cfg: Cfg }) {
  const best = useMemo(() => bestSchedule(sc), [sc]);
  const [order, setOrder] = useState<string[]>([]);
  const [hints, setHints] = useState(0);
  const [done, setDone] = useState<Finish | null>(null);
  const session = useSession();
  const finish = useFinish(cfg.recordKey);
  const byId = new Map(sc.tasks.map((t) => [t.id, t]));
  const sim = simulate(sc.tasks, order);
  const pool = sc.tasks.filter((t) => !order.includes(t.id));
  const scale = Math.max(sim.total, best, 1);

  const moveBy = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= order.length) return;
    const next = order.slice();
    [next[i], next[j]] = [next[j], next[i]];
    setOrder(next);
  };

  const submit = () => {
    const ratio = best / sim.total;
    const stars = Math.max(1, (ratio >= 1 ? 3 : ratio >= 0.87 ? 2 : 1) - Math.max(0, hints - 1));
    setDone({ score: sim.total, best, stars, xp: finish(stars), unit: "นาที" });
  };

  const hintText = [
    "งานที่มีแถบลาย (ปล่อยให้ทำงานเอง) ควรเริ่มเร็วหรือช้า?",
    "ระหว่างรองานอัตโนมัติ เอางานที่ต้องลงมือทำยาวๆ มาทำตอนนั้น",
    `เวลาที่ดีที่สุดคือ ${best} นาที`,
  ];

  return (
    <>
      <p className="mb-2 font-display text-sm text-muted">งานทั้งหมด — แตะเพื่อเพิ่มลงแผน</p>
      <div className="flex flex-wrap gap-2">
        {pool.map((t) => (
          <button
            key={t.id}
            onClick={() => setOrder([...order, t.id])}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-sm active:scale-95"
          >
            <span className="mr-1">{t.emoji}</span>
            {t.name}
            <span className="block text-[11px] text-muted">
              ทำ {t.active}m{t.wait ? ` + รอ ${t.wait}m` : ""}
              {t.deps?.length ? ` · หลัง ${t.deps.map((d) => byId.get(d)!.emoji).join("")}` : ""}
            </span>
          </button>
        ))}
        {!pool.length && <p className="text-sm text-good">ใส่ครบทุกงานแล้ว ✔</p>}
      </div>

      <p className="mb-2 mt-5 font-display text-sm text-muted">แผนของเรา / Timeline</p>
      <div className="card space-y-1.5 p-3">
        {!order.length && <p className="py-4 text-center text-sm text-muted">ยังไม่มีงาน</p>}
        {order.map((id, i) => {
          const t = byId.get(id)!;
          const slot = sim.slots[i];
          return (
            <div key={id} className="flex items-center gap-2">
              <div className="flex flex-col">
                <button className="px-1 text-xs text-muted" onClick={() => moveBy(i, -1)} aria-label="ขึ้น">
                  ▲
                </button>
                <button className="px-1 text-xs text-muted" onClick={() => moveBy(i, 1)} aria-label="ลง">
                  ▼
                </button>
              </div>
              <button
                className="w-24 shrink-0 truncate text-left text-xs"
                onClick={() => setOrder(order.filter((x) => x !== id))}
                title="แตะเพื่อเอาออก"
              >
                {t.emoji} {t.name}
              </button>
              <div className="relative h-6 flex-1 rounded bg-white/5">
                {slot && (
                  <>
                    <div
                      className="absolute h-full rounded-l bg-pink"
                      style={{ left: `${(slot.start / scale) * 100}%`, width: `${(t.active / scale) * 100}%` }}
                    />
                    {t.wait ? (
                      <div
                        className="stripes absolute h-full rounded-r bg-cyan/40"
                        style={{ left: `${(slot.activeEnd / scale) * 100}%`, width: `${(t.wait / scale) * 100}%` }}
                      />
                    ) : null}
                  </>
                )}
              </div>
            </div>
          );
        })}
        {order.length > 0 && (
          <p className="pt-2 text-right text-sm">
            เสร็จทั้งหมดใน <b className="font-display text-lg text-yellow">{sim.error ? "—" : sim.total}</b> นาที
          </p>
        )}
      </div>
      <p className="mt-1 text-[11px] text-muted">■ ชมพู = ลงมือทำ · ▨ ฟ้าลาย = รอให้เสร็จเอง (ทำอย่างอื่นได้) · แตะชื่อเพื่อเอาออก</p>

      <Toast msg={sim.error ?? null} />
      <button className="btn btn-primary mt-4 w-full" onClick={submit} disabled={!!pool.length || !!sim.error}>
        ✅ ใช้แผนนี้!
      </button>
      <HintList hints={hintText} shown={hints} startedAt={session.startedAt} onMore={() => { setHints(hints + 1); session.takeHint(); }} />
      <FinishModal done={done} onRetry={() => setDone(null)} cfg={cfg} lowerIsBetter />
    </>
  );
}

function FinishModal({
  done,
  onRetry,
  cfg,
  lowerIsBetter,
}: {
  done: Finish | null;
  onRetry: () => void;
  cfg: Cfg;
  lowerIsBetter?: boolean;
}) {
  const perfect = done && done.score === done.best;
  return (
    <ResultModal
      open={!!done}
      title={perfect ? "Perfect!" : "Nice!"}
      stars={done?.stars}
      xp={done?.xp}
      stats={[
        ["ของเรา", `${done?.score ?? ""} ${done?.unit ?? ""}`],
        ["ดีที่สุดที่เป็นไปได้", perfect ? `${done?.best} ✔` : "???"],
      ]}
      onRetry={onRetry}
      retryLabel={perfect ? "ดูอีกที" : "ลองหาวิธีที่ดีกว่า"}
      backHref={cfg.backHref}
    >
      {cfg.onNew && (
        <button className="btn btn-cyan mt-4 w-full" onClick={cfg.onNew}>
          🎲 โจทย์ใหม่ (ธีมเดิม)
        </button>
      )}
      {!perfect && (
        <p className="mt-3 text-sm text-muted">
          ยังมีแผนที่{lowerIsBetter ? "เร็วกว่า" : "ดีกว่า"}นี้อยู่ ไม่บอกหรอกว่าอะไร 😏
        </p>
      )}
    </ResultModal>
  );
}

function Scenario({ th, seed, cfg }: { th: Theme; seed: number; cfg: Cfg }) {
  const sc = useMemo(() => generateScenario(th, seed), [th, seed]);
  return (
    <>
      <p className="card speedlines mb-4 p-4 text-sm leading-relaxed">{sc.story}</p>
      {sc.kind === "budget" ? <Budget key={seed} sc={sc} cfg={cfg} /> : <Schedule key={seed} sc={sc} cfg={cfg} />}
    </>
  );
}

/** Free play: seed lives in the URL and can be rerolled. */
export function SituationGame({ th }: { th: Theme }) {
  const [seed, setSeed] = useState(() => codeToSeed(readParams().get("s")) ?? randomSeed());
  useEffect(() => writeParams({ s: seedToCode(seed) }), [seed]);
  const next = () => {
    setSeed(randomSeed());
    window.scrollTo({ top: 0 });
  };
  return (
    <>
      <div className="mb-3">
        <SeedBar code={seedToCode(seed)} title={`Brain Dojo · ${th.title}`} onNew={next} />
      </div>
      <Scenario th={th} seed={seed} cfg={{ recordKey: `situation:${th.id}`, backHref: "/situation", onNew: next }} />
    </>
  );
}

/** Quest: one fixed puzzle per map node. */
export function FixedSituation({ th, seed, recordKey, backHref }: { th: Theme; seed: number; recordKey: string; backHref: string }) {
  return <Scenario th={th} seed={seed} cfg={{ recordKey, backHref }} />;
}
