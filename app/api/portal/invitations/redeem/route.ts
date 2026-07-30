import { NextRequest, NextResponse } from "next/server";
import { allowRequest } from "@/lib/real-estate/integrations/rate-limit";
import { PORTAL_SESSION_COOKIE, redeemPortalInvitation } from "@/lib/real-estate/portal/auth";

export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  if (!allowRequest(`portal-invite:${ip}`, 8, 15 * 60_000)) return NextResponse.json({ error: "Unable to accept invitation" }, { status: 429 });
  const body = await req.json();
  const redeemed = await redeemPortalInvitation(String(body.token || ""), {
    firstName: String(body.firstName || ""), lastName: String(body.lastName || ""),
  });
  if (!redeemed) return NextResponse.json({ error: "Unable to accept invitation" }, { status: 400 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(PORTAL_SESSION_COOKIE, redeemed.sessionToken, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax",
    path: "/", maxAge: 7 * 24 * 60 * 60,
  });
  return response;
}
