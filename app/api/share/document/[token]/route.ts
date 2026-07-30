import { NextRequest, NextResponse } from "next/server";
import { accessDocumentShare } from "@/lib/real-estate/documents/service";
import { allowRequest } from "@/lib/real-estate/integrations/rate-limit";

export const runtime = "nodejs";
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  if (!allowRequest(`document-share:${ip}`, 10, 15 * 60_000)) return NextResponse.json({ error: "Document unavailable" }, { status: 429 });
  const body = await req.json();
  const result = await accessDocumentShare((await params).token, {
    password: body.password, recipientEmail: body.recipientEmail, download: body.download !== false,
  });
  if (!result) return NextResponse.json({ error: "Document unavailable" }, { status: 404 });
  return new NextResponse(result.blob.stream, {
    headers: { "content-type": result.mimeType, "content-disposition": `${body.download === false ? "inline" : "attachment"}; filename="${result.filename.replaceAll('"', "")}"`, "cache-control": "private, no-store" },
  });
}
