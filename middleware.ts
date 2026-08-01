import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { agentProfileStore } from "@/lib/agent-profiles/store";

// Scoped to /p/:username only. Next.js cannot change a response's HTTP status
// code once the root layout (dynamic, via cookies()) has started streaming —
// this is documented, expected behavior, not a bug: see
// https://nextjs.org/docs/app/api-reference/file-conventions/loading#status-codes.
// A page-level notFound() therefore always ships as a 200 (still correctly
// marked <meta name="robots" content="noindex">, so it's SEO-safe as-is).
// The only place that can set a real 404 status is here, before rendering
// starts — traded off against losing the full React-rendered not-found page
// for this one response.
export const config = {
  matcher: "/p/:username",
  runtime: "nodejs",
};

function notFoundResponse(): NextResponse {
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><meta name="robots" content="noindex"/><title>Profile not found</title></head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0B0B0D;color:#F2EEE6;font-family:system-ui,-apple-system,sans-serif;text-align:center;padding:2rem;">
<div>
<p style="font-size:11px;letter-spacing:0.35em;text-transform:uppercase;color:#C9A24B;margin-bottom:12px;">SnapLink</p>
<h1 style="font-size:28px;margin:0 0 8px;">This profile could not be found</h1>
<p style="color:#9a9a9a;font-size:14px;margin:0;">It may have been unpublished, suspended, or the link is incorrect.</p>
</div>
</body>
</html>`;
  return new NextResponse(html, {
    status: 404,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const username = request.nextUrl.pathname.slice("/p/".length);
  if (!username) return NextResponse.next();

  const profile = await agentProfileStore.getByUsername(username.toLowerCase()).catch(() => null);
  const visible = Boolean(
    profile &&
      profile.status !== "archived" &&
      profile.status !== "suspended" &&
      profile.snaplinkStatus === "published"
  );

  return visible ? NextResponse.next() : notFoundResponse();
}
