import { NextRequest, NextResponse } from "next/server";
import { downloadPortalDocument } from "@/lib/real-estate/documents/service";
import { PORTAL_SESSION_COOKIE, portalPrincipalFromToken } from "@/lib/real-estate/portal/auth";

export const runtime = "nodejs";
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const principal = await portalPrincipalFromToken(req.cookies.get(PORTAL_SESSION_COOKIE)?.value);
  if (!principal) return NextResponse.json({ error: "Portal session required" }, { status: 401 });
  const result = await downloadPortalDocument(principal, (await params).id);
  if (!result) return NextResponse.json({ error: "Document unavailable" }, { status: 404 });
  return new NextResponse(result.blob.stream, {
    headers: { "content-type": result.mimeType, "content-disposition": `attachment; filename="${result.filename.replaceAll('"', "")}"`, "cache-control": "private, no-store" },
  });
}
