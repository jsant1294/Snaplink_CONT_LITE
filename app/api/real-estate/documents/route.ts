import { NextRequest, NextResponse } from "next/server";
import { authorizeRealEstate } from "@/lib/real-estate/auth";
import { uploadProfessionalDocument } from "@/lib/real-estate/documents/service";

export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  const principal = await authorizeRealEstate(req, "documents:manage");
  if (!principal) return NextResponse.json({ error: "Document management permission required" }, { status: 403 });
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "File is required" }, { status: 400 });
  try {
    const result = await uploadProfessionalDocument(principal, principal.membershipId, {
      transactionId: String(form.get("transactionId") || ""), file,
      title: String(form.get("title") || ""), category: String(form.get("category") || "other"),
      visibility: String(form.get("visibility") || "internal"),
      documentId: String(form.get("documentId") || "") || undefined,
    });
    return NextResponse.json({ ok: true, ...result }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed" }, { status: 400 });
  }
}
