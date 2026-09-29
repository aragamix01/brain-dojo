// Hint coins: a small, capped wallet earned by playing well and spent on extra hints.

export const COINS = {
  start: 5,
  cap: 20,
  /** hints per puzzle that cost nothing (still cost stars) */
  freePerPuzzle: 2,
  /** most coins Free Play can pay out per day */
  freePlayPerDay: 5,
  logSize: 40,
  /** coins that don't fit in the wallet are sold for XP instead of vanishing */
  overflowXp: 15,
} as const;

export type CoinEntry = { t: number; delta: number; reason: string };

export type Wallet = {
  coins: number;
  coinLog: CoinEntry[];
  /** one-time reward keys already paid out */
  rewarded: Record<string, number>;
};

export type Reward = { amount: number; reason: string; once: string };

/**
 * Apply rewards in order; each `once` key pays at most one time. The wallet never passes the cap —
 * whatever doesn't fit is reported as `overflow` (the store turns it into XP).
 */
export function applyRewards(
  w: Wallet,
  rewards: Reward[],
  now = Date.now(),
): { wallet: Wallet; gained: Reward[]; overflow: number } {
  let { coins } = w;
  const coinLog = w.coinLog.slice();
  const rewarded = { ...w.rewarded };
  const gained: Reward[] = [];
  let overflow = 0;
  for (const r of rewards) {
    if (rewarded[r.once]) continue;
    rewarded[r.once] = now;
    const add = Math.max(0, Math.min(r.amount, COINS.cap - coins));
    overflow += r.amount - add;
    if (add <= 0) continue;
    coins += add;
    coinLog.unshift({ t: now, delta: add, reason: r.reason });
    gained.push({ ...r, amount: add });
  }
  return { wallet: { coins, coinLog: coinLog.slice(0, COINS.logSize), rewarded }, gained, overflow };
}

export function spend(w: Wallet, reason: string, amount = 1, now = Date.now()): Wallet | null {
  if (w.coins < amount) return null;
  return {
    ...w,
    coins: w.coins - amount,
    coinLog: [{ t: now, delta: -amount, reason }, ...w.coinLog].slice(0, COINS.logSize),
  };
}

const FREE_PLAY = /^(logic|robot|situation):|^sprint$/;

/** What a win is worth. `firstWin` = no earlier win recorded for this key. */
export function winRewards(opts: {
  key: string;
  stars: number;
  firstWin: boolean;
  isBoss: boolean;
  today: string;
  rewarded: Record<string, number>;
}): Reward[] {
  const { key, stars, firstWin, isBoss, today, rewarded } = opts;
  const out: Reward[] = [];
  if (key.startsWith("quest:")) {
    const id = key.slice("quest:".length);
    if (isBoss && firstWin) out.push({ amount: 2, reason: "ชนะบอส 👹", once: `boss:${id}` });
    if (stars === 3) out.push({ amount: 1, reason: "3★ บนแผนที่", once: `q3:${id}` });
  } else if (FREE_PLAY.test(key) && stars === 3) {
    const paidToday = Object.keys(rewarded).filter((k) => k.startsWith(`fp:${today}:`)).length;
    if (paidToday < COINS.freePlayPerDay)
      out.push({ amount: 1, reason: "3★ ลานฝึกดาบ", once: `fp:${today}:${paidToday}` });
  }
  return out;
}

export function dailyRewards(date: string, allThreeStars: boolean): Reward[] {
  const out: Reward[] = [{ amount: 1, reason: "เล่น Daily จบ", once: `daily:${date}` }];
  if (allThreeStars) out.push({ amount: 1, reason: "Daily 3★ ทุกด่าน", once: `daily3:${date}` });
  return out;
}

export function streakRewards(streak: number, today: string): Reward[] {
  return streak > 0 && streak % 7 === 0
    ? [{ amount: 2, reason: `ออกเรือต่อเนื่อง ${streak} วัน ⚔️`, once: `streak:${today}` }]
    : [];
}

export const chestReward = (chestId: string): Reward => ({ amount: 3, reason: "เปิดหีบสมบัติ 🎁", once: chestId });

/** What's still collectable today (Quest rewards have no daily limit, so they aren't counted). */
export function todayRemaining(rewarded: Record<string, number>, today: string) {
  const freePlayPaid = Object.keys(rewarded).filter((k) => k.startsWith(`fp:${today}:`)).length;
  return {
    freePlay: Math.max(0, COINS.freePlayPerDay - freePlayPaid),
    dailyFinish: !rewarded[`daily:${today}`],
    dailyAllStars: !rewarded[`daily3:${today}`],
  };
}

/** Coins a quest node still pays out (first 3★, plus the boss bonus until the boss is beaten). */
export function questBounty(rewarded: Record<string, number>, nodeId: string, isBoss: boolean): number {
  return (rewarded[`q3:${nodeId}`] ? 0 : 1) + (isBoss && !rewarded[`boss:${nodeId}`] ? 2 : 0);
}
