import { NextRequest, NextResponse } from "next/server";
import { agentProfileStore } from "@/lib/agent-profiles/store";
import { canAccessAgentProfile, isOperator, pinFromRequest, publicAgentProfile } from "@/lib/agent-profiles/auth";
import { subscribeAgentToTier } from "@/lib/agent-profiles/billing";
import { isReservedIdentifier, isValidUsernameFormat, usernameify } from "@/lib/agent-profiles/identity";
import { AGENT_MODULE_KEYS, SELF_EDITABLE_FIELDS, type AgentProfile, type AgentProfileTier } from "@/lib/agent-profiles/types";
import { isValidAgentProfessionType } from "@/lib/profession-types";

/** Operator (any status, for the edit page) or the profile's own PIN (active only). */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const profile = await agentProfileStore.getById(id);
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  const pin = pinFromRequest(req);
  if (!isOperator(pin) && (profile.status !== "active" || !canAccessAgentProfile(pin, profile))) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }
  return NextResponse.json({ profile: publicAgentProfile(profile) });
}

const OPERATOR_EDITABLE_FIELDS = [
  ...SELF_EDITABLE_FIELDS,
  "name", "email", "phone", "serviceArea", "brokerageName", "licenseNumber", "yearsExperience",
  // Agent Management slice — identity, professional, contact, marketplace, SnapLink fields.
  "firstName", "lastName", "displayName", "professionType", "officeName", "teamName", "licenseState",
  "coverPhotoUrl", "preferredLanguage",
  "smsPhone", "whatsapp", "website", "bookingLink", "facebook", "instagram", "linkedin",
  "featured", "categories", "neighborhoods", "serviceRadius", "seoTitle", "seoDescription", "marketplaceSummary",
  "snaplinkStatus", "southlineStatus", "onboardingStatus",
] as const;

const ARRAY_FIELDS = ["languages", "specialties", "serviceAreas", "categories", "neighborhoods"];
const NUMBER_FIELDS = ["yearsExperience", "serviceRadius"];

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

  const patch: Partial<Omit<AgentProfile, "id" | "createdAt">> = {};
  const allowed = operator ? OPERATOR_EDITABLE_FIELDS : SELF_EDITABLE_FIELDS;
  for (const field of allowed) {
    if (body[field] === undefined) continue;
    if (NUMBER_FIELDS.includes(field)) {
      (patch as Record<string, unknown>)[field] = Number.isFinite(body[field]) ? Number(body[field]) : undefined;
    } else if (ARRAY_FIELDS.includes(field)) {
      (patch as Record<string, unknown>)[field] = Array.isArray(body[field]) ? body[field].filter((x: unknown) => typeof x === "string") : [];
    } else if (field === "featured") {
      patch.featured = Boolean(body.featured);
    } else if (field === "snaplinkStatus") {
      if (["draft", "published", "unpublished"].includes(body.snaplinkStatus)) patch.snaplinkStatus = body.snaplinkStatus;
    } else if (field === "southlineStatus") {
      if (["draft", "published", "featured", "hidden"].includes(body.southlineStatus)) patch.southlineStatus = body.southlineStatus;
    } else if (field === "onboardingStatus") {
      if (["not_started", "invited", "profile_incomplete", "ready", "approved", "launched"].includes(body.onboardingStatus)) {
        patch.onboardingStatus = body.onboardingStatus;
      }
    } else if (field === "preferredLanguage") {
      if (["en", "es", "both"].includes(body.preferredLanguage)) patch.preferredLanguage = body.preferredLanguage;
    } else if (field === "professionType") {
      if (isValidAgentProfessionType(body.professionType)) patch.professionType = body.professionType;
    } else {
      (patch as Record<string, unknown>)[field] = String(body[field]);
    }
  }

  if (operator) {
    if (body.status !== undefined && ["pending", "active", "suspended", "archived"].includes(body.status)) patch.status = body.status;
    if (body.pin !== undefined) {
      const newPin = String(body.pin).trim();
      if (!/^\d{6}$/.test(newPin)) return NextResponse.json({ error: "New PIN must be exactly 6 digits" }, { status: 400 });
      patch.pin = newPin;
    }

    // Username/slug are operator-editable, but must keep passing the same
    // uniqueness + reserved-word checks as at creation time.
    if (body.username !== undefined) {
      const candidate = usernameify(String(body.username));
      if (!isValidUsernameFormat(candidate) || isReservedIdentifier(candidate)) {
        return NextResponse.json({ error: "Invalid or reserved username" }, { status: 400 });
      }
      const existing = await agentProfileStore.getByUsername(candidate);
      if (existing && existing.id !== id) {
        return NextResponse.json({ error: "Duplicate username — that username is already taken" }, { status: 409 });
      }
      patch.username = candidate;
    }
    if (body.slug !== undefined) {
      const candidate = usernameify(String(body.slug));
      if (!candidate || isReservedIdentifier(candidate)) {
        return NextResponse.json({ error: "Invalid or reserved slug" }, { status: 400 });
      }
      const existing = await agentProfileStore.getBySlug(candidate);
      if (existing && existing.id !== id) {
        return NextResponse.json({ error: "Duplicate slug — that slug is already taken" }, { status: 409 });
      }
      patch.slug = candidate;
    }
    if (body.modules && typeof body.modules === "object") {
      const modules: Record<string, boolean> = { ...target.modules };
      for (const key of AGENT_MODULE_KEYS) {
        if (body.modules[key] !== undefined) modules[key] = Boolean(body.modules[key]);
      }
      patch.modules = modules;
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

