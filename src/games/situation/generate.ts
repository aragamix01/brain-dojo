import { randInt, rngFrom, shuffle, type Rng } from "@/lib/rng";
import type { BudgetItem, BudgetScenario, BudgetTheme, Scenario, ScheduleScenario, ScheduleTheme, Task, Theme } from "./data";
import { bestBudget } from "./solver";

const roundTo = (v: number, step: number) => Math.max(step, Math.round(v / step) * step);

/** ±pct random wobble so the same theme never has quite the same numbers. */
const wobble = (rng: Rng, v: number, pct: number) => v * (1 - pct + rng() * 2 * pct);

function withRequirements<T extends { id: string }>(picked: T[], pool: T[], needs: (t: T) => string[]): T[] {
  const byId = new Map(pool.map((t) => [t.id, t]));
  const out = new Map(picked.map((t) => [t.id, t]));
  const stack = [...picked];
  while (stack.length) {
    for (const id of needs(stack.pop()!)) {
      if (!out.has(id)) {
        out.set(id, byId.get(id)!);
        stack.push(byId.get(id)!);
      }
    }
  }
  // keep the theme's original order so the list reads naturally
  return pool.filter((t) => out.has(t.id));
}

function generateBudget(rng: Rng, th: BudgetTheme): BudgetScenario {
  for (;;) {
    const count = randInt(rng, th.pick[0], th.pick[1]);
    const drawn = withRequirements(shuffle(rng, th.items).slice(0, count), th.items, (i) =>
      i.requires ? [i.requires] : [],
    );
    const items: BudgetItem[] = drawn.map((i) => ({
      ...i,
      cost: roundTo(wobble(rng, i.cost, 0.2), th.step),
      value: i.value === 0 ? 0 : Math.max(1, i.value + randInt(rng, -1, 1)),
    }));
    const total = items.reduce((a, i) => a + i.cost, 0);
    const ratio = th.limitRatio[0] + rng() * (th.limitRatio[1] - th.limitRatio[0]);
    const limit = roundTo(total * ratio, th.step);
    const sc: BudgetScenario = {
      kind: "budget",
      id: th.id,
      story: th.story.replace("{limit}", limit.toLocaleString()),
      unit: th.unit,
      valueLabel: th.valueLabel,
      limit,
      maxItems: th.maxItems,
      mustHave: th.mustHave,
      items,
    };
    // Reject draws where a required tag is missing or nothing valid fits.
    if (bestBudget(sc) > 0) return sc;
  }
}

function generateSchedule(rng: Rng, th: ScheduleTheme): ScheduleScenario {
  for (;;) {
    const target = randInt(rng, th.pick[0], th.pick[1]);
    let chosen: Task[] = [];
    for (const t of shuffle(rng, th.tasks)) {
      const next = withRequirements([...chosen, t], th.tasks, (x) => x.deps ?? []);
      if (next.length <= th.pick[1]) chosen = next;
      if (chosen.length >= target) break;
    }
    const tasks = chosen.map((t) => ({
      ...t,
      active: Math.max(1, Math.round(wobble(rng, t.active, 0.25))),
      wait: t.wait ? roundTo(wobble(rng, t.wait, 0.25), 5) : undefined,
    }));
    // Without at least two background tasks there's nothing interesting to plan.
    if (tasks.filter((t) => t.wait).length >= 2) {
      return { kind: "schedule", id: th.id, story: th.story, tasks };
    }
  }
}

/** `pick` overrides how many items/tasks to draw (Daily uses smaller puzzles). */
export function generateScenario(th: Theme, seed: number, pick?: [number, number]): Scenario {
  const rng = rngFrom(`${th.id}:${seed}`);
  const t = pick ? { ...th, pick } : th;
  return t.kind === "budget" ? generateBudget(rng, t) : generateSchedule(rng, t);
}
