/** Which deployment is live, so an open tab can tell it's running old code. */
export function GET() {
  const v = process.env.VERCEL_DEPLOYMENT_ID ?? process.env.VERCEL_GIT_COMMIT_SHA ?? "dev";
  return Response.json({ v }, { headers: { "Cache-Control": "no-store" } });
}
