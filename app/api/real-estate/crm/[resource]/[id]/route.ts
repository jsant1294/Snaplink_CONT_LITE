import { NextRequest, NextResponse } from "next/server";
import { authorizeRealEstate } from "@/lib/real-estate/auth";
import { crmRepository, type CrmResource } from "@/lib/real-estate/crm-repositories";
import { validateCrmInput } from "@/lib/real-estate/crm-validation";
import type { RealEstatePermission } from "@/lib/real-estate/permissions";

const resources: CrmResource[] = ["brokerages", "agents", "buyers", "sellers", "leads", "showings", "open-houses", "tasks"];
const permission = (resource: CrmResource): RealEstatePermission =>
  resource === "brokerages" ? "brokerages:manage" : resource === "agents" ? "agents:manage"
    : resource === "leads" ? "leads:assign" : resource === "showings" || resource === "open-houses" ? "open_houses:manage" : "clients:manage";

export async function GET(req: NextRequest, { params }: { params: Promise<{ resource: string; id: string }> }) {
  const { resource: value, id } = await params;
  const resource = resources.includes(value as CrmResource) ? value as CrmResource : null;
  if (!resource) return NextResponse.json({ error: "Unknown CRM resource" }, { status: 404 });
  const principal = authorizeRealEstate(req, permission(resource));
  if (!principal) return NextResponse.json({ error: "CRM access denied" }, { status: 403 });
  const record = await crmRepository.find(resource, id, principal.tenantId);
  return record ? NextResponse.json({ record }) : NextResponse.json({ error: "Record not found" }, { status: 404 });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ resource: string; id: string }> }) {
  const { resource: value, id } = await params;
  const resource = resources.includes(value as CrmResource) ? value as CrmResource : null;
  if (!resource) return NextResponse.json({ error: "Unknown CRM resource" }, { status: 404 });
  const principal = authorizeRealEstate(req, permission(resource));
  if (!principal) return NextResponse.json({ error: "CRM management permission required" }, { status: 403 });
  const body = await req.json();
  if (body.action === "archive") return NextResponse.json({ ok: await crmRepository.archive(resource, id, principal.tenantId) });
  const validation = validateCrmInput(resource, body, true);
  if (!validation.valid) return NextResponse.json({ error: "Validation failed", errors: validation.errors }, { status: 400 });
  const record = await crmRepository.update(resource, id, principal.tenantId, validation.data);
  return record ? NextResponse.json({ ok: true, record }) : NextResponse.json({ error: "Record not found" }, { status: 404 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ resource: string; id: string }> }) {
  const { resource: value, id } = await params;
  const resource = resources.includes(value as CrmResource) ? value as CrmResource : null;
  if (!resource) return NextResponse.json({ error: "Unknown CRM resource" }, { status: 404 });
  const principal = authorizeRealEstate(req, permission(resource));
  if (!principal) return NextResponse.json({ error: "CRM management permission required" }, { status: 403 });
  return NextResponse.json({ ok: await crmRepository.softDelete(resource, id, principal.tenantId) });
}
