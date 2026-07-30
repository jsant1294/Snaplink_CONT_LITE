import { NextRequest, NextResponse } from "next/server";
import { authorizeRealEstate } from "@/lib/real-estate/auth";
import { createDocumentShare } from "@/lib/real-estate/documents/service";

export const runtime = "nodejs";
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const principal = await authorizeRealEstate(req, "documents:manage");
  if (!principal) return NextResponse.json({ error: "Document management permission required" }, { status: 403 });
  try {
    const result = await createDocumentShare(principal, principal.membershipId, (await params).id, await req.json());
    return NextResponse.json({ ok: true, token: result.token, expiresAt: result.share.expiresAt }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create share" }, { status: 400 });
  }
}
