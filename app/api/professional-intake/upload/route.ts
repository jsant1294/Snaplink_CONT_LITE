import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { authorizeIntakeOwner } from "@/lib/professional-intake/auth";
import type { IntakeOwnerType } from "@/lib/professional-intake/types";

const KINDS = ["profilePhoto", "coverPhoto", "galleryPhotos"] as const;

/**
 * POST multipart { ownerType, ownerId, kind, file } — intake photo uploads.
 * Same 8MB / image/* checks as the existing southline and contractor upload
 * routes (lib/professional-intake/*, no new upload infrastructure). Operator
 * OR the owning professional's own PIN may upload, matching the rest of the
 * fill-out surface (create/autosave/submit).
 */
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const ownerType = String(form.get("ownerType") ?? "") as IntakeOwnerType;
  const ownerId = String(form.get("ownerId") ?? "");
  if (!["contractor", "agent"].includes(ownerType) || !ownerId) {
    return NextResponse.json({ error: "ownerType and ownerId are required" }, { status: 400 });
  }
  const authError = await authorizeIntakeOwner(req, ownerType, ownerId);
  if (authError) return NextResponse.json({ error: authError }, { status: 401 });

  const kind = String(form.get("kind") ?? "");
  if (!KINDS.includes(kind as (typeof KINDS)[number])) {
    return NextResponse.json({ error: "Invalid upload kind" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File) || !file.type.startsWith("image/")) {
    return NextResponse.json({ error: "A valid image is required" }, { status: 400 });
  }
  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "Image must be under 8 MB" }, { status: 400 });
  }

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(
      `professional-intake/${ownerType}/${ownerId}/${kind}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`,
      file,
      { access: "public", addRandomSuffix: true }
    );
    return NextResponse.json({ url: blob.url });
  }
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Image uploads are unavailable: BLOB_READ_WRITE_TOKEN is not configured." },
      { status: 503 }
    );
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  return NextResponse.json({ url: `data:${file.type};base64,${buffer.toString("base64")}` });
}
