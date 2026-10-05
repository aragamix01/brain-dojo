import { bangkokDay, dailySerial } from "@/lib/kidtimer/core";
import { rewardMinutes } from "@/lib/kidtimer/reward";
import { issueCode, kidtimerReady } from "@/lib/kidtimer/server";

/**
 * Daily reward: a PC time code for finishing today's (or yesterday's, near midnight) Daily.
 * The serial is the day number, so a day can only ever unlock the PC once.
 */
export async function POST(request: Request) {
  if (!kidtimerReady()) return Response.json({ error: "not-configured" }, { status: 503 });
  const body = await request.json().catch(() => null);
  const date = typeof body?.date === "string" ? body.date : "";
  const stars = Number(body?.stars);
  const now = Date.now();
  if (date !== bangkokDay(now) && date !== bangkokDay(now, -1))
    return Response.json({ error: "bad-date" }, { status: 400 });
  if (!Number.isFinite(stars)) return Response.json({ error: "bad-stars" }, { status: 400 });
  const minutes = rewardMinutes(stars);
  return Response.json({ code: issueCode(minutes, dailySerial(date)), minutes });
}
