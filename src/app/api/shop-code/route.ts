import { bangkokDay, shopSerial } from "@/lib/kidtimer/core";
import { SHOP_TIME } from "@/lib/kidtimer/reward";
import { issueCode, kidtimerReady } from "@/lib/kidtimer/server";

/**
 * Coin shop: an hour of PC time. Coins live on the device, so the server can't check the price was
 * paid — it caps the damage instead: each day has SHOP_TIME.perDay fixed serials, and the PC accepts
 * each serial only once.
 */
export async function POST(request: Request) {
  if (!kidtimerReady()) return Response.json({ error: "not-configured" }, { status: 503 });
  const body = await request.json().catch(() => null);
  const date = typeof body?.date === "string" ? body.date : "";
  const slot = Number(body?.slot);
  const now = Date.now();
  if (date !== bangkokDay(now) && date !== bangkokDay(now, -1))
    return Response.json({ error: "bad-date" }, { status: 400 });
  if (!Number.isInteger(slot) || slot < 0 || slot >= SHOP_TIME.perDay)
    return Response.json({ error: "sold-out" }, { status: 400 });
  return Response.json({ code: issueCode(SHOP_TIME.minutes, shopSerial(date, slot)), minutes: SHOP_TIME.minutes });
}
