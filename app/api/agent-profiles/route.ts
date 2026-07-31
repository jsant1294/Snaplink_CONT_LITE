import { NextRequest, NextResponse } from "next/server";
import { agentProfileStore, newId } from "@/lib/agent-profiles/store";
import { isOperator, pinFromRequest, publicAgentProfile } from "@/lib/agent-profiles/auth";
import type { AgentProfileRequestInput } from "@/lib/agent-profiles/types";

/** Public: active profiles only. Operator PIN: every profile (for the admin review queue). */
export async function GET(req: NextRequest) {
  const profiles = isOperator(pinFromRequest(req)) ? await agentProfileStore.list() : await agentProfileStore.listActive();
  return NextResponse.json({ profiles: profiles.map(publicAgentProfile) });
}

/**
 * POST — public request form. No PIN required. Creates a "pending" profile
 * for an operator to review and activate (assign PIN + tier). Mirrors the
 * fact that SnapLink Contractor profiles have no self-service creation
 * either — an operator always activates the account.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const serviceArea = String(body.serviceArea ?? "").trim();
  if (!name || !email || !phone || !serviceArea) {
    return NextResponse.json({ error: "Name, email, phone, and service area are required" }, { status: 400 });
  }
  const input: AgentProfileRequestInput = {
    name,
    email,
    phone,
    serviceArea,
    brokerageName: body.brokerageName ? String(body.brokerageName) : undefined,
    licenseNumber: body.licenseNumber ? String(body.licenseNumber) : undefined,
    bio: body.bio ? String(body.bio) : undefined,
    tagline: body.tagline ? String(body.tagline) : undefined,
    photoUrl: body.photoUrl ? String(body.photoUrl) : undefined,
    languages: Array.isArray(body.languages) ? body.languages.filter((x: unknown) => typeof x === "string") : undefined,
    specialties: Array.isArray(body.specialties) ? body.specialties.filter((x: unknown) => typeof x === "string") : undefined,
    serviceAreas: Array.isArray(body.serviceAreas) ? body.serviceAreas.filter((x: unknown) => typeof x === "string") : undefined,
    yearsExperience: Number.isFinite(body.yearsExperience) ? Number(body.yearsExperience) : undefined,
  };
  const profile = await agentProfileStore.create(newId("apx"), input);
  return NextResponse.json({ ok: true, profile: publicAgentProfile(profile) }, { status: 201 });
}
