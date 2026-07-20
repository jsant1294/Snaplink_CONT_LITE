import { NextRequest, NextResponse, after } from "next/server";
import { leadStore, newId } from "@/lib/store";
import { contractorStore } from "@/lib/store";
import { pinFromRequest, isOperator, canAccessContractor } from "@/lib/auth";
import { notifyNewLead } from "@/lib/notify";
import type { Lead, Photo } from "@/lib/types";

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("contractor") ?? undefined;
  const pin = pinFromRequest(req);
  if (username) {
    const contractor = await contractorStore.getByUsername(username);
    if (!contractor) return NextResponse.json({ error: "Contractor not found" }, { status: 404 });
    if (!canAccessContractor(pin, contractor)) {
      return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
    }
  } else if (!isOperator(pin)) {
    return NextResponse.json({ error: "Operator PIN required" }, { status: 401 });
  }
  const leads = await leadStore.list(username);
  return NextResponse.json({ leads });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const contractor = await contractorStore.getByUsername(String(body.contractorUsername ?? ""));
  if (!contractor) {
    return NextResponse.json({ error: "Unknown contractor" }, { status: 404 });
  }
  if (!body.name || !body.phone || !body.projectType) {
    return NextResponse.json({ error: "Name, phone, and project type are required" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const leadId = newId("lead");
  const photos: Photo[] = Array.isArray(body.photos)
    ? body.photos.slice(0, 6).map((p: { dataUrl: string; filename: string; kind?: Photo["kind"] }) => ({
        id: newId("ph"),
        leadId,
        kind: p.kind ?? "other",
        dataUrl: String(p.dataUrl ?? ""),
        filename: String(p.filename ?? "photo.jpg"),
        createdAt: now,
      }))
    : [];

  const lead: Lead = {
    id: leadId,
    contractorId: contractor.id,
    contractorUsername: contractor.username,
    source: "link",
    status: "New",
    language: body.language === "es" ? "es" : "en",
    clientName: String(body.name),
    phone: String(body.phone),
    email: String(body.email ?? ""),
    projectAddress: String(body.projectAddress ?? ""),
    preferredContact: body.preferredContact ?? "Text",
    bestTimeToContact: String(body.bestTimeToContact ?? ""),
    projectType: body.projectType,
    timeline: String(body.timeline ?? ""),
    budgetRange: String(body.budgetRange ?? ""),
    notes: String(body.notes ?? ""),
    answers: body.answers ?? {},
    photos,
    tags: [],
    createdAt: now,
    updatedAt: now,
  };

  await leadStore.create(lead);
  after(() => notifyNewLead(contractor, lead));
  return NextResponse.json({ ok: true, leadId: lead.id });
}
