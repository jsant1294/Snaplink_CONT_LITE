import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { isOperator, pinFromRequest } from "@/lib/auth";

const KINDS = ["hero", "services", "trending", "seasonal", "category", "spotlight", "snaplink-promo", "general"] as const;

export async function POST(req: NextRequest) {
  const pin = pinFromRequest(req);
  if (!isOperator(pin)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const form = await req.formData();
  const file = form.get("file");
  const kind = String(form.get("kind") || "general");
  if (!(file instanceof File) || !file.type.startsWith("image/")) {
    return NextResponse.json({ error: "A valid image is required" }, { status: 400 });
  }
  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "Image must be under 8 MB" }, { status: 400 });
  }
  if (!KINDS.includes(kind as (typeof KINDS)[number])) {
    return NextResponse.json({ error: "Invalid upload kind" }, { status: 400 });
  }
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(
      `southline/${kind}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`,
      file,
      { access: "public", addRandomSuffix: true }
    );
    return NextResponse.json({ url: blob.url });
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  return NextResponse.json({ url: `data:${file.type};base64,${buffer.toString("base64")}` });
}
