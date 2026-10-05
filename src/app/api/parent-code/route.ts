import { manualSerial } from "@/lib/kidtimer/core";
import { isValidMinutes } from "@/lib/kidtimer/reward";
import { issueCode, kidtimerReady, parentPasswordOk } from "@/lib/kidtimer/server";

/** Parent page: a code for any number of minutes, behind PARENT_PASSWORD. One per minute (the serial). */
export async function POST(request: Request) {
  if (!kidtimerReady() || !process.env.PARENT_PASSWORD)
    return Response.json({ error: "not-configured" }, { status: 503 });
  const body = await request.json().catch(() => null);
  if (!parentPasswordOk(body?.password)) return Response.json({ error: "wrong-password" }, { status: 401 });
  if (!isValidMinutes(body?.minutes)) return Response.json({ error: "bad-minutes" }, { status: 400 });
  const now = Date.now();
  return Response.json({ code: issueCode(body.minutes, manualSerial(now)), minutes: body.minutes, at: now });
}
