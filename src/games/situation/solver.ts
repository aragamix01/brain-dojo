import type { BudgetScenario, ScheduleScenario, Task } from "./data";

export type BudgetEval = {
  cost: number;
  value: number;
  problems: string[];
  /** picked items that score nothing because their requirement is missing */
  dead: string[];
};

export function evalBudget(sc: BudgetScenario, picked: Set<string>): BudgetEval {
  const items = sc.items.filter((i) => picked.has(i.id));
  const cost = items.reduce((a, i) => a + i.cost, 0);
  const dead = items.filter((i) => i.requires && !picked.has(i.requires)).map((i) => i.id);
  const value = items.reduce((a, i) => a + (dead.includes(i.id) ? 0 : i.value), 0);
  const problems: string[] = [];
  if (cost > sc.limit) problems.push(`เกินลิมิต ${cost.toLocaleString()} / ${sc.limit.toLocaleString()} ${sc.unit}`);
  if (sc.maxItems && items.length > sc.maxItems) problems.push(`เลือกได้ไม่เกิน ${sc.maxItems} อย่าง`);
  for (const m of sc.mustHave ?? []) {
    if (!items.some((i) => i.tags?.includes(m.tag))) problems.push(m.label);
  }
  return { cost, value, problems, dead };
}

export function bestBudget(sc: BudgetScenario): number {
  const n = sc.items.length;
  let best = 0;
  for (let mask = 0; mask < 1 << n; mask++) {
    const picked = new Set(sc.items.filter((_, i) => (mask >> i) & 1).map((i) => i.id));
    const e = evalBudget(sc, picked);
    if (!e.problems.length && e.value > best) best = e.value;
  }
  return best;
}

export type Slot = { id: string; start: number; activeEnd: number; end: number };

/** Run tasks in the given order; you work one task at a time, "wait" runs in the background. */
export function simulate(tasks: Task[], order: string[]): { slots: Slot[]; total: number; error?: string } {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const done = new Map<string, number>();
  const slots: Slot[] = [];
  let now = 0;
  for (const id of order) {
    const t = byId.get(id)!;
    const missing = (t.deps ?? []).filter((d) => !done.has(d));
    if (missing.length) {
      const names = missing.map((d) => byId.get(d)!.name).join(", ");
      return { slots, total: now, error: `"${t.name}" ต้องทำหลัง "${names}"` };
    }
    const start = Math.max(now, ...(t.deps ?? []).map((d) => done.get(d)!));
    const activeEnd = start + t.active;
    const end = activeEnd + (t.wait ?? 0);
    slots.push({ id, start, activeEnd, end });
    done.set(id, end);
    now = activeEnd;
  }
  return { slots, total: Math.max(0, ...slots.map((s) => s.end)) };
}

export function bestSchedule(sc: ScheduleScenario): number {
  let best = Infinity;
  const ids = sc.tasks.map((t) => t.id);
  const permute = (order: string[], rest: string[]) => {
    if (!rest.length) {
      const r = simulate(sc.tasks, order);
      if (!r.error) best = Math.min(best, r.total);
      return;
    }
    for (let i = 0; i < rest.length; i++) {
      permute([...order, rest[i]], [...rest.slice(0, i), ...rest.slice(i + 1)]);
    }
  };
  permute([], ids);
  return best;
}
