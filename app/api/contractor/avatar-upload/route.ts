import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { isOperator, pinFromRequest } from "@/lib/auth";

const KINDS = ["avatar", "logo"] as const;

/** Operator-only — profile images are edited by the operator, not the contractor. */
export async function POST(req: NextRequest) {
  if (!isOperator(pinFromRequest(req))) {
    return NextResponse.json({ error: "Operator PIN required" }, { status: 401 });
  }
  const form = await req.formData();
  const contractorId = String(form.get("contractorId") ?? "");
  if (!contractorId) return NextResponse.json({ error: "contractorId is required" }, { status: 400 });
  const kind = String(form.get("kind") ?? "");
  if (!KINDS.includes(kind as (typeof KINDS)[number])) {
    return NextResponse.json({ error: "Invalid upload kind" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File) || !file.type.startsWith("image/")) {
    return NextResponse.json({ error: "A valid image is required" }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Image must be under 5 MB" }, { status: 400 });
  }
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(
      `contractors/${contractorId}/${kind}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`,
      file,
      { access: "public", addRandomSuffix: true }
    );
    return NextResponse.json({ url: blob.url });
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  return NextResponse.json({ url: `data:${file.type};base64,${buffer.toString("base64")}` });
}
