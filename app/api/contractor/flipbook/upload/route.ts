import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { authorizeContractorId } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const contractorId = String(form.get("contractorId") ?? "");
  if (!contractorId) return NextResponse.json({ error: "contractorId is required" }, { status: 400 });
  const denied = await authorizeContractorId(req, contractorId);
  if (denied) return NextResponse.json({ error: denied }, { status: 401 });

  const file = form.get("file");
  if (!(file instanceof File) || !file.type.startsWith("image/")) {
    return NextResponse.json({ error: "A valid image is required" }, { status: 400 });
  }
  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "Image must be under 8 MB" }, { status: 400 });
  }
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(
      `flipbook/${contractorId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`,
      file,
      { access: "public", addRandomSuffix: true }
    );
    return NextResponse.json({ url: blob.url });
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  return NextResponse.json({ url: `data:${file.type};base64,${buffer.toString("base64")}` });
}
