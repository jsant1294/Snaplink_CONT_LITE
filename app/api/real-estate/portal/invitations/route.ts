import { NextRequest, NextResponse } from "next/server";
import { authorizeRealEstate } from "@/lib/real-estate/auth";
import { createPortalInvitation } from "@/lib/real-estate/portal/auth";

export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  const principal = await authorizeRealEstate(req, "portal:manage");
  if (!principal) return NextResponse.json({ error: "Portal management permission required" }, { status: 403 });
  try {
    const invitation = await createPortalInvitation(principal, principal.membershipId, await req.json());
    return NextResponse.json({ ok: true, invitation }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to invite client" }, { status: 400 });
  }
}
