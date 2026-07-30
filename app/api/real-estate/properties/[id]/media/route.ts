import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { authorizeRealEstate } from "@/lib/real-estate/auth";
import { propertyMediaRepository, propertyRepository } from "@/lib/real-estate/repositories";

async function canAccessProperty(id: string, principal: Awaited<ReturnType<typeof authorizeRealEstate>>) {
  if (!principal) return false;
  const property = await propertyRepository.findPropertyById(id, principal.tenantId);
  return Boolean(property && (principal.role !== "listing_agent" || property.agentId === principal.agentId));
}

async function resolveImage(dataUrl: string, filename: string, propertyId: string): Promise<string> {
  if (!dataUrl.startsWith("data:image/")) throw new Error("A valid image is required");
  if (!process.env.BLOB_READ_WRITE_TOKEN) return dataUrl;
  const [meta, encoded] = dataUrl.split(",");
  const contentType = meta.match(/data:(.*?);/)?.[1] ?? "image/jpeg";
  const blob = await put(`snaplink-real-estate/${propertyId}/${Date.now()}-${filename}`, Buffer.from(encoded, "base64"), { access: "public", contentType });
  return blob.url;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const principal = await authorizeRealEstate(req, "properties:view");
  if (!principal) return NextResponse.json({ error: "Real Estate access denied" }, { status: 401 });
  const propertyId = (await params).id;
  if (!await canAccessProperty(propertyId, principal)) return NextResponse.json({ error: "Property not found" }, { status: 404 });
  return NextResponse.json({ media: await propertyMediaRepository.list(propertyId, principal.tenantId) });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const principal = await authorizeRealEstate(req, "properties:manage");
  if (!principal) return NextResponse.json({ error: "Property management permission required" }, { status: 403 });
  const propertyId = (await params).id;
  if (!await canAccessProperty(propertyId, principal)) return NextResponse.json({ error: "Property not found" }, { status: 404 });
  const body = await req.json();
  try {
    const filename = String(body.filename ?? "property-image.jpg");
    const url = await resolveImage(String(body.dataUrl ?? ""), filename, propertyId);
    const media = await propertyMediaRepository.add(propertyId, principal.tenantId, { url, filename, altText: String(body.altText ?? ""), isHero: body.isHero === true });
    return NextResponse.json({ ok: true, media }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Image upload failed" }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const principal = await authorizeRealEstate(req, "properties:manage");
  if (!principal) return NextResponse.json({ error: "Property management permission required" }, { status: 403 });
  const propertyId = (await params).id;
  if (!await canAccessProperty(propertyId, principal)) return NextResponse.json({ error: "Property not found" }, { status: 404 });
  const body = await req.json();
  if (Array.isArray(body.ids)) {
    return NextResponse.json({ ok: true, media: await propertyMediaRepository.reorder(propertyId, principal.tenantId, body.ids.map(String)) });
  }
  try {
    const filename = String(body.filename ?? "property-image.jpg");
    const url = await resolveImage(String(body.dataUrl ?? ""), filename, propertyId);
    const media = await propertyMediaRepository.replace(String(body.id ?? ""), propertyId, principal.tenantId, { url, filename });
    return media ? NextResponse.json({ ok: true, media }) : NextResponse.json({ error: "Image not found" }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Image replacement failed" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const principal = await authorizeRealEstate(req, "properties:manage");
  if (!principal) return NextResponse.json({ error: "Property management permission required" }, { status: 403 });
  const propertyId = (await params).id;
  if (!await canAccessProperty(propertyId, principal)) return NextResponse.json({ error: "Property not found" }, { status: 404 });
  const mediaId = req.nextUrl.searchParams.get("mediaId") ?? "";
  const removed = await propertyMediaRepository.remove(mediaId, propertyId, principal.tenantId);
  return removed ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Image not found" }, { status: 404 });
}
