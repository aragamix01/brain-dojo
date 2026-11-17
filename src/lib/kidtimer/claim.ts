// Weekly PC time: the player sends a report link / QR code, the parent page turns every Daily not
// yet paid for into one code. Paid days are remembered on the parent's device.
import { rewardMinutes } from "./reward";

/** How far back a report still carries Dailies to claim, so a late week isn't lost. */
export const CLAIM_DAYS = 28;

export type ClaimDay = { day: string; stars: number; minutes: number; paid: boolean };

/**
 * Each Daily in the report with its reward, oldest first. Days after `today` (the parent's clock) are
 * dropped: they can only come from a wrong clock or a doctored code.
 */
export function claimDays(rewards: Record<string, number>, paid: Record<string, number>, today: string): ClaimDay[] {
  return Object.entries(rewards)
    .filter(([day]) => /^\d{4}-\d{2}-\d{2}$/.test(day) && day <= today)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, stars]) => ({ day, stars, minutes: rewardMinutes(stars), paid: day in paid }));
}

export const unpaidMinutes = (days: ClaimDay[]) => days.reduce((a, d) => a + (d.paid ? 0 : d.minutes), 0);

const PAID_KEY = "kidtimer-paid-days";

export function readPaid(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(PAID_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function markPaid(days: string[], at = Date.now()): Record<string, number> {
  const next = { ...readPaid(), ...Object.fromEntries(days.map((d) => [d, at])) };
  try {
    localStorage.setItem(PAID_KEY, JSON.stringify(next));
  } catch {
    /* storage blocked: the list on screen still shows them as paid until reload */
  }
  return next;
}
