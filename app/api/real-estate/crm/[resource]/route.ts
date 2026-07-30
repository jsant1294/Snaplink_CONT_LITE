import { NextRequest, NextResponse } from "next/server";
import { authorizeRealEstate } from "@/lib/real-estate/auth";
import { crmRepository, type CrmResource } from "@/lib/real-estate/crm-repositories";
import { validateCrmInput } from "@/lib/real-estate/crm-validation";
import type { RealEstatePermission } from "@/lib/real-estate/permissions";
import { triggerWorkflows } from "@/lib/real-estate/phase5-repositories";
import { enqueueCalendarJobs } from "@/lib/real-estate/jobs";

const resources: CrmResource[] = ["brokerages", "agents", "buyers", "sellers", "leads", "showings", "open-houses", "tasks"];
const viewPermission = (resource: CrmResource): RealEstatePermission =>
  resource === "brokerages" || resource === "agents" ? "agents:view"
    : resource === "leads" ? "leads:view"
    : resource === "showings" || resource === "open-houses" ? "open_houses:manage"
    : "clients:view";
const managePermission = (resource: CrmResource): RealEstatePermission =>
  resource === "brokerages" ? "brokerages:manage"
    : resource === "agents" ? "agents:manage"
    : resource === "leads" ? "leads:assign"
    : resource === "showings" || resource === "open-houses" ? "open_houses:manage"
    : "clients:manage";

function parse(value: string): CrmResource | null {
  return resources.includes(value as CrmResource) ? value as CrmResource : null;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ resource: string }> }) {
  const resource = parse((await params).resource);
  if (!resource) return NextResponse.json({ error: "Unknown CRM resource" }, { status: 404 });
  const principal = await authorizeRealEstate(req, viewPermission(resource));
  if (!principal) return NextResponse.json({ error: "CRM access denied" }, { status: 403 });
  let records = await crmRepository.list(resource, principal.tenantId);
  if (principal.role === "listing_agent") {
    records = records.filter((record) => resource === "agents" ? record.id === principal.agentId : !("assignedAgentId" in record) || record.assignedAgentId === principal.agentId);
  }
  return NextResponse.json({ records });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ resource: string }> }) {
  const resource = parse((await params).resource);
  if (!resource) return NextResponse.json({ error: "Unknown CRM resource" }, { status: 404 });
  const principal = await authorizeRealEstate(req, managePermission(resource));
  if (!principal) return NextResponse.json({ error: "CRM management permission required" }, { status: 403 });
  const validation = validateCrmInput(resource, await req.json());
  if (!validation.valid) return NextResponse.json({ error: "Validation failed", errors: validation.errors }, { status: 400 });
  const data = { ...validation.data };
  if (principal.role === "listing_agent" && ["buyers", "sellers", "leads", "showings", "open-houses", "tasks"].includes(resource)) {
    if (!principal.agentId) return NextResponse.json({ error: "Agent membership is not linked" }, { status: 403 });
    data.assignedAgentId = principal.agentId;
  }
  const record = await crmRepository.create(resource, principal.tenantId, data);
  if (resource === "leads") await triggerWorkflows(principal, "lead_created", "lead", String(record.id));
  if (resource === "showings") await triggerWorkflows(principal, "showing_scheduled", "showing", String(record.id));
  if (resource === "showings") await enqueueCalendarJobs(principal, principal.membershipId, "showing", String(record.id));
  if (resource === "open-houses") await enqueueCalendarJobs(principal, principal.membershipId, "open_house", String(record.id));
  return NextResponse.json({ ok: true, record }, { status: 201 });
}
