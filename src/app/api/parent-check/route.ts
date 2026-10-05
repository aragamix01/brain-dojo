import { kidtimerReady, parentPasswordOk } from "@/lib/kidtimer/server";

/** Parent page PIN check. A wrong PIN answers slowly, so guessing all 6 digits takes forever. */
export async function POST(request: Request) {
  if (!kidtimerReady() || !process.env.PARENT_PASSWORD)
    return Response.json({ error: "not-configured" }, { status: 503 });
  const body = await request.json().catch(() => null);
  if (parentPasswordOk(body?.password)) return Response.json({ ok: true });
  await new Promise((r) => setTimeout(r, 1000));
  return Response.json({ error: "wrong-password" }, { status: 401 });
}
