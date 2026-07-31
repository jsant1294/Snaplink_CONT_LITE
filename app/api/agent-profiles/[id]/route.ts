import { NextRequest, NextResponse } from "next/server";
import { agentProfileStore } from "@/lib/agent-profiles/store";
import { canAccessAgentProfile, isOperator, pinFromRequest, publicAgentProfile } from "@/lib/agent-profiles/auth";
import { subscribeAgentToTier } from "@/lib/agent-profiles/billing";
import { SELF_EDITABLE_FIELDS, type AgentProfile, type AgentProfileTier } from "@/lib/agent-profiles/types";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const profile = await agentProfileStore.getById(id);
  if (!profile || profile.status !== "active") return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  return NextResponse.json({ profile: publicAgentProfile(profile) });
}

const OPERATOR_EDITABLE_FIELDS = [
  ...SELF_EDITABLE_FIELDS,
  "name", "email", "phone", "serviceArea", "brokerageName", "licenseNumber", "yearsExperience",
] as const;

/**
 * PATCH — operator activates (status/pin/tier+planId), suspends, or edits a
 * profile broadly. A profile's own PIN may self-edit only the fields in
 * SELF_EDITABLE_FIELDS, mirroring the onlySelfEditable pattern in
 * app/api/contractor/profiles/route.ts. PINs are write-only; never returned.
 */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json();
  const pin = pinFromRequest(req);
  const operator = isOperator(pin);
  const target = await agentProfileStore.getById(id);
  if (!target) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  if (!operator) {
    const requestedKeys = Object.keys(body);
    const onlySelfEditable = requestedKeys.every((k) => (SELF_EDITABLE_FIELDS as readonly string[]).includes(k));
    if (!canAccessAgentProfile(pin, target) || !onlySelfEditable) {
      return NextResponse.json({ error: "Operator PIN required" }, { status: 401 });
    }
  }

  const patch: Partial<Omit<AgentProfile, "id" | "slug" | "createdAt">> = {};
  const allowed = operator ? OPERATOR_EDITABLE_FIELDS : SELF_EDITABLE_FIELDS;
  for (const field of allowed) {
    if (body[field] === undefined) continue;
    if (field === "yearsExperience") patch.yearsExperience = Number.isFinite(body.yearsExperience) ? Number(body.yearsExperience) : undefined;
    else if (["languages", "specialties", "serviceAreas"].includes(field)) {
      patch[field as "languages"] = Array.isArray(body[field]) ? body[field].filter((x: unknown) => typeof x === "string") : [];
    } else {
      (patch as Record<string, unknown>)[field] = String(body[field]);
    }
  }

  if (operator) {
    if (body.status !== undefined && ["pending", "active", "suspended"].includes(body.status)) patch.status = body.status;
    if (body.pin !== undefined) {
      const newPin = String(body.pin).trim();
      if (!/^\d{6}$/.test(newPin)) return NextResponse.json({ error: "New PIN must be exactly 6 digits" }, { status: 400 });
      patch.pin = newPin;
    }
  }

  const updated = patch && Object.keys(patch).length ? await agentProfileStore.update(id, patch) : target;
  if (!updated) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  if (operator && body.planId && body.tier && ["basic", "professional", "featured"].includes(body.tier)) {
    try {
      await subscribeAgentToTier(id, String(body.planId), body.tier as AgentProfileTier);
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "Subscription failed" }, { status: 400 });
    }
  }

  const final = await agentProfileStore.getById(id);
  return NextResponse.json({ ok: true, profile: final ? publicAgentProfile(final) : null });
}
