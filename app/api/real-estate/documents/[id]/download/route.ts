import { NextRequest, NextResponse } from "next/server";
import { authorizeRealEstate } from "@/lib/real-estate/auth";
import { downloadProfessionalDocument } from "@/lib/real-estate/documents/service";

export const runtime = "nodejs";
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const principal = await authorizeRealEstate(req, "documents:manage");
  if (!principal) return NextResponse.json({ error: "Document access denied" }, { status: 403 });
  const result = await downloadProfessionalDocument(principal, principal.membershipId, (await params).id);
  if (!result) return NextResponse.json({ error: "Document unavailable" }, { status: 404 });
  return new NextResponse(result.blob.stream, {
    headers: { "content-type": result.mimeType, "content-disposition": `attachment; filename="${result.filename.replaceAll('"', "")}"`, "cache-control": "private, no-store" },
  });
}
