// Client-safe KidTimer numbers: how much time a reward is worth. No key, no crypto here.

/** The PC counts time in 15-minute steps, up to 0xFFF of them. */
export const UNIT_MIN = 15;
export const MAX_MINUTES = 0xfff * UNIT_MIN;

export const isValidMinutes = (m: unknown): m is number =>
  Number.isInteger(m) && (m as number) >= UNIT_MIN && (m as number) <= MAX_MINUTES && (m as number) % UNIT_MIN === 0;

/** Finishing the Daily: 1 hour, plus 10 minutes a star, rounded up to the PC's 15-minute steps. */
export const DAILY_REWARD = { base: 60, perStar: 10, maxStars: 9 };

export function rewardMinutes(stars: number): number {
  const s = Math.max(0, Math.min(DAILY_REWARD.maxStars, Math.floor(stars)));
  return Math.ceil((DAILY_REWARD.base + s * DAILY_REWARD.perStar) / UNIT_MIN) * UNIT_MIN;
}

export function formatMinutes(m: number): string {
  const h = Math.floor(m / 60);
  const r = m % 60;
  return h ? `${h} ชม.${r ? ` ${r} นาที` : ""}` : `${r} นาที`;
}

/** Coin shop: an hour of PC time, at most twice a day (the server's serials enforce the daily cap too). */
export const SHOP_TIME = { minutes: 60, price: 10, perDay: 2 } as const;
