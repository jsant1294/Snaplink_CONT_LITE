import { NextRequest, NextResponse } from "next/server";
import { PORTAL_SESSION_COOKIE, portalPrincipalFromToken, revokePortalSession } from "@/lib/real-estate/portal/auth";

export async function POST(req: NextRequest) {
  const principal = await portalPrincipalFromToken(req.cookies.get(PORTAL_SESSION_COOKIE)?.value);
  if (principal) await revokePortalSession(principal.sessionId, principal.portalUserId);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(PORTAL_SESSION_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
  return response;
}
