import { NextRequest, NextResponse } from "next/server";
import { agentProfileStore, newId } from "@/lib/agent-profiles/store";
import { isOperator, pinFromRequest, publicAgentProfile } from "@/lib/agent-profiles/auth";
import { firstAvailable, isValidUsernameFormat, suggestUsername, usernameify } from "@/lib/agent-profiles/identity";
import { AGENT_MODULE_KEYS, type AgentOperatorCreateInput } from "@/lib/agent-profiles/types";
import { computeTierModules, resolveAgentTier } from "@/lib/agent-profiles/tiers";
import { isValidAgentProfessionType } from "@/lib/profession-types";

/**
 * POST /api/agent-profiles/create — operator-only "New Agent" workflow
 * (Phase 3/4 of the Agent Management slice). Deliberately a SEPARATE route
 * from POST /api/agent-profiles, which must stay a no-PIN public request
 * form (tests/agent-profiles.test.mjs enforces that isOperator never
 * appears in that handler).
 *
 * One INSERT creates the account + SnapLink profile + Southline listing
 * together (see lib/agent-profiles/store-pg.ts `createAgent`), so there is
 * no multi-step transaction to roll back — either the row is created or the
 * request fails before any write happens.
 */
export async function POST(req: NextRequest) {
  const pin = pinFromRequest(req);
  if (!isOperator(pin)) {
    return NextResponse.json({ error: "Operator PIN required" }, { status: 401 });
  }

  const body = await req.json();
  const firstName = String(body.firstName ?? "").trim();
  const lastName = String(body.lastName ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const phone = String(body.phone ?? "").trim();
  const newPin = String(body.pin ?? "").trim();

  if (!firstName || !lastName) {
    return NextResponse.json({ error: "First and last name are required" }, { status: 400 });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }
  if (!phone) {
    return NextResponse.json({ error: "Phone is required" }, { status: 400 });
  }
  if (!/^\d{6}$/.test(newPin)) {
    return NextResponse.json({ error: "A 6-digit PIN is required" }, { status: 400 });
  }

  const existingByEmail = (await agentProfileStore.list()).find((p) => p.email.toLowerCase() === email);
  if (existingByEmail) {
    return NextResponse.json({ error: "Duplicate email — an agent with this email already exists" }, { status: 409 });
  }

  const requestedUsername = body.username ? usernameify(String(body.username)) : "";
  if (requestedUsername && !isValidUsernameFormat(requestedUsername)) {
    return NextResponse.json({ error: "Username must be lowercase letters, numbers, and hyphens only" }, { status: 400 });
  }
  const usernameSeed = requestedUsername || suggestUsername(firstName, lastName);
  const username = await firstAvailable(
    usernameSeed,
    async (candidate) => Boolean(await agentProfileStore.getByUsername(candidate)),
    email
  );
  if (requestedUsername && requestedUsername !== username) {
    return NextResponse.json({ error: "Duplicate username — that username is already taken or reserved" }, { status: 409 });
  }

  const requestedSlug = body.slug ? usernameify(String(body.slug)) : "";
  const slugSeed = requestedSlug || username;
  const slug = await firstAvailable(
    slugSeed,
    async (candidate) => Boolean(await agentProfileStore.getBySlug(candidate)),
    email
  );
  if (requestedSlug && requestedSlug !== slug) {
    return NextResponse.json({ error: "Duplicate slug — that slug is already taken or reserved" }, { status: 409 });
  }

  // A tier provided at creation applies its module bundle immediately (same
  // rule as everywhere else this task touches); no tier means fall back to
  // whatever modules were explicitly requested (both default to all-false).
  const createTier = resolveAgentTier(body.tier);
  const modules: AgentOperatorCreateInput["modules"] = createTier
    ? computeTierModules(createTier)
    : Object.fromEntries(AGENT_MODULE_KEYS.map((key) => [key, Boolean(body.modules?.[key])])) as AgentOperatorCreateInput["modules"];

  const input: AgentOperatorCreateInput = {
    firstName,
    lastName,
    displayName: body.displayName ? String(body.displayName).trim() : undefined,
    username,
    slug,
    email,
    phone,
    photoUrl: body.photoUrl ? String(body.photoUrl) : undefined,
    coverPhotoUrl: body.coverPhotoUrl ? String(body.coverPhotoUrl) : undefined,
    preferredLanguage: ["en", "es", "both"].includes(body.preferredLanguage) ? body.preferredLanguage : "en",
    pin: newPin,

    brokerageName: body.brokerageName ? String(body.brokerageName) : undefined,
    officeName: body.officeName ? String(body.officeName) : undefined,
    teamName: body.teamName ? String(body.teamName) : undefined,
    professionType: isValidAgentProfessionType(body.professionType) ? body.professionType : undefined,
    licenseNumber: body.licenseNumber ? String(body.licenseNumber) : undefined,
    licenseState: body.licenseState ? String(body.licenseState) : undefined,
    yearsExperience: Number.isFinite(body.yearsExperience) ? Number(body.yearsExperience) : undefined,
    specialties: Array.isArray(body.specialties) ? body.specialties.filter((x: unknown) => typeof x === "string") : undefined,
    serviceArea: body.serviceArea ? String(body.serviceArea) : undefined,
    serviceAreas: Array.isArray(body.serviceAreas) ? body.serviceAreas.filter((x: unknown) => typeof x === "string") : undefined,
    bio: body.bio ? String(body.bio) : undefined,
    tagline: body.tagline ? String(body.tagline) : undefined,
    languages: Array.isArray(body.languages) ? body.languages.filter((x: unknown) => typeof x === "string") : undefined,

    smsPhone: body.smsPhone ? String(body.smsPhone) : undefined,
    whatsapp: body.whatsapp ? String(body.whatsapp) : undefined,
    website: body.website ? String(body.website) : undefined,
    bookingLink: body.bookingLink ? String(body.bookingLink) : undefined,
    facebook: body.facebook ? String(body.facebook) : undefined,
    instagram: body.instagram ? String(body.instagram) : undefined,
    linkedin: body.linkedin ? String(body.linkedin) : undefined,

    featured: Boolean(body.featured),
    categories: Array.isArray(body.categories) ? body.categories.filter((x: unknown) => typeof x === "string") : undefined,
    neighborhoods: Array.isArray(body.neighborhoods) ? body.neighborhoods.filter((x: unknown) => typeof x === "string") : undefined,
    serviceRadius: Number.isFinite(body.serviceRadius) ? Number(body.serviceRadius) : undefined,
    seoTitle: body.seoTitle ? String(body.seoTitle) : undefined,
    seoDescription: body.seoDescription ? String(body.seoDescription) : undefined,
    marketplaceSummary: body.marketplaceSummary ? String(body.marketplaceSummary) : undefined,

    tier: createTier ?? undefined,
    modules,

    status: "active",
    snaplinkStatus: body.snaplinkStatus === "published" ? "published" : "draft",
    southlineStatus: ["published", "featured"].includes(body.southlineStatus) ? body.southlineStatus : "draft",
  };

  const profile = await agentProfileStore.createAgent(newId("apx"), input, slug);

  return NextResponse.json(
    {
      ok: true,
      profile: publicAgentProfile(profile),
      urls: {
        snaplink: `/p/${profile.username}`,
        southline: `/agents/${profile.slug}`,
      },
    },
    { status: 201 }
  );
}
