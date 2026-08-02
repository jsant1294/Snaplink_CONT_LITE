import { NextRequest, NextResponse } from "next/server";
import { agentProfileStore } from "@/lib/agent-profiles/store";
import { canAccessAgentProfile, isOperator, pinFromRequest, publicAgentProfile } from "@/lib/agent-profiles/auth";
import { applyAgentTier, subscribeAgentToTier, type TierAssignmentResult } from "@/lib/agent-profiles/billing";
import { isReservedIdentifier, isValidUsernameFormat, usernameify } from "@/lib/agent-profiles/identity";
import { AGENT_MODULE_KEYS, SELF_EDITABLE_FIELDS, type AgentProfile } from "@/lib/agent-profiles/types";
import { isValidAgentProfessionType } from "@/lib/profession-types";
import { intakeSessionStore } from "@/lib/store";
import { getProfessionalBillingSummary } from "@/lib/professional-intake-payment/adapters";
import { evaluateProfilePublicationEligibility } from "@/lib/professional-intake-payment/eligibility";

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

  // Publication eligibility is enforced here too, not only on the dedicated
  // /api/professional-intake/sessions/[id]/publish route — this is the
  // generic PATCH every other agent-editing surface already goes through, so
  // it must not be a second way to bypass the payment/approval gate.
  const requestsPublication = body.snaplinkStatus === "published" || ["published", "featured"].includes(body.southlineStatus);
  if (requestsPublication) {
    if (body.tier !== undefined || body.modules !== undefined) {
      return NextResponse.json({ error: "Save tier and entitlement changes before publishing" }, { status: 400 });
    }
    const sessions = await intakeSessionStore.list("agent", id);
    const approved = sessions.find((session) => session.status === "applied" && Boolean(session.contentApprovedAt));
    const billing = await getProfessionalBillingSummary({ ownerType: "agent", ownerId: id });
    if (!approved || !billing) {
      return NextResponse.json({ error: "An applied, operator-approved intake is required before publishing" }, { status: 409 });
    }
    const eligibility = evaluateProfilePublicationEligibility(
      {
        profileApproved: true,
        paymentStatus: billing.paymentStatus,
        planActive: billing.planActive,
        entitlementValid: billing.entitlementValid,
      },
      approved.locale
    );
    if (!eligibility.canPublish) {
      return NextResponse.json({ error: "Profile is not eligible to publish", eligibility, billing }, { status: 409 });
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

  // Tier assignment/change is handled separately from the generic field loop
  // above because it drives the module bundle too (see lib/agent-profiles/
  // billing.ts). `body.tier` + `body.planId` together create/record a
  // subscription (the original activation path); `body.tier` alone just
  // re-applies a tier's module bundle without touching billing — this is
  // what makes the Edit page's Tier selector actually take effect, which it
  // did not before (it silently required a planId it never sent).
  let tierResult: TierAssignmentResult | null = null;
  if (operator && body.tier !== undefined) {
    try {
      if (body.planId) {
        const result = await subscribeAgentToTier(id, String(body.planId), String(body.tier));
        tierResult = result.tierResult;
      } else {
        tierResult = await applyAgentTier(id, body.tier ? String(body.tier) : null);
      }
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "Tier update failed" }, { status: 400 });
    }
  }

  const final = await agentProfileStore.getById(id);
  return NextResponse.json({ ok: true, profile: final ? publicAgentProfile(final) : null, tierResult });
}

