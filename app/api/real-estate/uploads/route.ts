import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { authorizeRealEstate } from "@/lib/real-estate/auth";

export async function POST(req: NextRequest) {
  const principal = await authorizeRealEstate(req, "agents:manage");
  if (!principal) return NextResponse.json({ error: "Access denied" }, { status: 403 });
  const form = await req.formData();
  const file = form.get("file");
  const kind = String(form.get("kind") || "");
  if (!(file instanceof File) || !file.type.startsWith("image/") || !["brokerage-logo", "agent-photo"].includes(kind)) return NextResponse.json({ error: "A valid image and media kind are required" }, { status: 400 });
  if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: "Image must be under 8 MB" }, { status: 400 });
  const blob = await put(`real-estate/${principal.tenantId}/${kind}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`, file, { access: "public", addRandomSuffix: true });
  return NextResponse.json({ url: blob.url });
}
