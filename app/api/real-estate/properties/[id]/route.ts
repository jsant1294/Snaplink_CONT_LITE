import { NextRequest, NextResponse } from "next/server";
import { authorizeRealEstate } from "@/lib/real-estate/auth";
import { propertyRepository } from "@/lib/real-estate/repositories";
import { validatePropertyInput } from "@/lib/real-estate/validation";
import { recordActivity } from "@/lib/real-estate/crm-repositories";
import { triggerWorkflows } from "@/lib/real-estate/phase5-repositories";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const principal = await authorizeRealEstate(req, "properties:view");
  if (!principal) return NextResponse.json({ error: "Real Estate access denied" }, { status: 401 });
  const property = await propertyRepository.findPropertyById((await params).id, principal.tenantId);
  if (property && principal.role === "listing_agent" && property.agentId !== principal.agentId) return NextResponse.json({ error: "Property not found" }, { status: 404 });
  return property ? NextResponse.json({ property }) : NextResponse.json({ error: "Property not found" }, { status: 404 });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const principal = await authorizeRealEstate(req, "properties:manage");
  if (!principal) return NextResponse.json({ error: "Property management permission required" }, { status: 403 });
  const id = (await params).id;
  const existing = await propertyRepository.findPropertyById(id, principal.tenantId);
  if (!existing || (principal.role === "listing_agent" && existing.agentId !== principal.agentId)) return NextResponse.json({ error: "Property not found" }, { status: 404 });
  const body = await req.json();
  const action = String(body.action ?? "");
  let property;
  if (action === "publish") property = await propertyRepository.publishProperty(id, principal.tenantId);
  else if (action === "unpublish") property = await propertyRepository.unpublishProperty(id, principal.tenantId);
  else if (action === "archive") property = await propertyRepository.archiveProperty(id, principal.tenantId);
  else {
    const validation = validatePropertyInput(body, true);
    if (!validation.valid) return NextResponse.json({ error: "Validation failed", errors: validation.errors }, { status: 400 });
    property = await propertyRepository.updateProperty(id, principal.tenantId, validation.data ?? {});
  }
  if (property) {
    const activityAction = action || "updated";
    await recordActivity(principal.tenantId, "properties", id, activityAction, `Property ${activityAction}: ${property.title}`);
    if (action === "publish") await triggerWorkflows(principal, "property_published", "property", id);
  }
  return property ? NextResponse.json({ ok: true, property }) : NextResponse.json({ error: "Property not found" }, { status: 404 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const principal = await authorizeRealEstate(req, "properties:manage");
  if (!principal) return NextResponse.json({ error: "Property management permission required" }, { status: 403 });
  const id = (await params).id;
  const existing = await propertyRepository.findPropertyById(id, principal.tenantId);
  if (!existing || (principal.role === "listing_agent" && existing.agentId !== principal.agentId)) return NextResponse.json({ error: "Property not found" }, { status: 404 });
  const property = await propertyRepository.deleteProperty(id, principal.tenantId);
  return property ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Property not found" }, { status: 404 });
}
