// ---------------------------------------------------------------------------
// Southline Professional Intake — profile auto-fill mapping.
// Two separate, explicit adapters (contractor / agent) reading from the SAME
// normalized answer bag. Real field names only, taken directly from
// lib/types.ts (Contractor/ContractorProfilePatch) and
// lib/agent-profiles/types.ts (AgentProfile) — nothing invented.
//
// Some answers compose into one target field (e.g. city+state+zips → one
// `serviceArea` sentence); some have no reliable target on one owner type
// and are documented as copy-only (see the "no field" notes below) rather
// than force-fit into the wrong shape.
// ---------------------------------------------------------------------------

import type { ContractorProfilePatch } from "../types.ts";
import type { AgentProfile } from "../agent-profiles/types.ts";
import { isValidProfessionType } from "../profession-types.ts";
import { isValidAgentProfessionType } from "../profession-types.ts";
import { normalizeZip } from "../geo/zip.ts";
import type { IntakeAnswers } from "./types.ts";

/**
 * Documentation-oriented map: real profile field → the answer id(s) it can be
 * filled from. Mirrors the shape suggested by the task spec
 * (PROFESSIONAL_INTAKE_PROFILE_MAP). Used by apply.ts to label the review
 * preview's "source question" column — the actual value composition for
 * multi-answer fields lives in buildContractorPatch/buildAgentPatch below.
 */
export const CONTRACTOR_INTAKE_FIELD_MAP: Record<string, string[]> = {
  professionType: ["professionType"],
  businessName: ["companyName", "displayName"],
  ownerName: ["displayName"],
  tagline: ["differentiator", "designStyle"],
  phone: ["phone"],
  whatsapp: ["whatsapp"],
  email: ["email"],
  website: ["website"],
  serviceArea: ["serviceAreaCity", "serviceAreaState", "serviceAreaZips"],
  serviceZip: ["serviceZip"],
  serviceRadiusMiles: ["serviceRadius"],
  licenseInfo: ["experienceQualifications", "yearsInBusiness", "licenseInfo", "insuranceCarried"],
  avatarUrl: ["profilePhoto"],
  logoUrl: ["profilePhoto"],
  galleryUrls: ["galleryPhotos"],
  preferredLanguage: ["languages"],
  // No reliable target on Contractor (category-level answers don't fit the
  // specialty-level `services` field; no marketplaceSummary/bookingLink/
  // coverPhotoUrl fields exist on Contractor) — copy-generation-only, see
  // generate-copy.ts and docs/professional-intake/04-profile-field-mapping.md.
};

export const AGENT_INTAKE_FIELD_MAP: Record<string, string[]> = {
  professionType: ["professionType"],
  displayName: ["displayName"],
  brokerageName: ["companyName"],
  officeName: ["officeName"],
  teamName: ["teamName"],
  licenseNumber: ["licenseNumber"],
  licenseState: ["licenseState"],
  categories: ["primaryService", "additionalServices"],
  serviceArea: ["serviceAreaCity", "serviceAreaState", "serviceAreaZips"],
  serviceZip: ["serviceZip"],
  serviceRadius: ["serviceRadius"],
  neighborhoods: ["neighborhoodsFocus"],
  marketplaceSummary: ["idealCustomer", "customerProblem", "differentiator"],
  languages: ["languages"],
  phone: ["phone"],
  email: ["email"],
  whatsapp: ["whatsapp"],
  website: ["website"],
  bookingLink: ["bookingLink"],
  photoUrl: ["profilePhoto"],
  coverPhotoUrl: ["coverPhoto"],
};

function composeServiceArea(answers: IntakeAnswers): string | undefined {
  const city = typeof answers.serviceAreaCity === "string" ? answers.serviceAreaCity : "";
  const state = typeof answers.serviceAreaState === "string" ? answers.serviceAreaState : "";
  const zips = typeof answers.serviceAreaZips === "string" ? answers.serviceAreaZips : "";
  const base = [city, state].filter(Boolean).join(", ");
  if (!base) return undefined;
  return zips ? `${base} (ZIPs: ${zips})` : base;
}

/**
 * Normalizes a service-ZIP answer to a 5-digit US ZIP (ZIP+4 → 5). Any value
 * that is not a clean 5-digit ZIP is dropped entirely (never fabricated), so a
 * professional without a valid home-base ZIP is simply not GEO-indexable —
 * matching the TRUE GEO contract in lib/geo/zip.ts + southline-search.ts.
 */
function resolveServiceZip(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = normalizeZip(value);
  return /^\d{5}$/.test(normalized) ? normalized : undefined;
}

/** Parses a numeric radius (miles). Only finite, > 0 values are accepted — 0/blank never fabricate a radius. */
function resolveRadiusMiles(value: unknown): number | undefined {
  if (typeof value !== "string") return undefined;
  const radius = Number(value);
  if (!Number.isFinite(radius) || radius <= 0) return undefined;
  return radius;
}

function composeLicenseInfo(answers: IntakeAnswers): string | undefined {
  const parts: string[] = [];
  if (typeof answers.yearsInBusiness === "string" && answers.yearsInBusiness) {
    parts.push(`${answers.yearsInBusiness} years in business`);
  }
  if (typeof answers.licenseInfo === "string" && answers.licenseInfo) {
    parts.push(`License #${answers.licenseInfo}`);
  }
  if (answers.insuranceCarried === true) parts.push("Carries liability insurance");
  if (typeof answers.experienceQualifications === "string" && answers.experienceQualifications) {
    parts.push(answers.experienceQualifications);
  }
  return parts.length > 0 ? parts.join(". ") : undefined;
}

/**
 * Builds a partial contractor patch from normalized intake answers. Never
 * returns fields the answers didn't touch — apply.ts is what decides whether
 * a returned field actually overwrites the live profile (default: only
 * fills currently-empty fields, see ProfileApplyMode).
 */
export function buildContractorPatch(answers: IntakeAnswers): ContractorProfilePatch {
  const patch: ContractorProfilePatch = {};

  if (typeof answers.professionType === "string" && isValidProfessionType(answers.professionType)) {
    patch.professionType = answers.professionType;
  }

  const companyName = typeof answers.companyName === "string" ? answers.companyName : "";
  const displayName = typeof answers.displayName === "string" ? answers.displayName : "";
  if (companyName || displayName) patch.businessName = companyName || displayName;
  if (displayName) patch.ownerName = displayName;

  const tagline = typeof answers.differentiator === "string" && answers.differentiator
    ? answers.differentiator
    : typeof answers.designStyle === "string" ? answers.designStyle : "";
  if (tagline) patch.tagline = tagline;

  if (typeof answers.phone === "string" && answers.phone) patch.phone = answers.phone;
  if (typeof answers.whatsapp === "string" && answers.whatsapp) patch.whatsapp = answers.whatsapp;
  if (typeof answers.email === "string" && answers.email) patch.email = answers.email;
  if (typeof answers.website === "string" && answers.website) patch.website = answers.website;

  const serviceArea = composeServiceArea(answers);
  if (serviceArea) patch.serviceArea = serviceArea;

  const serviceZip = resolveServiceZip(answers.serviceZip);
  if (serviceZip) patch.serviceZip = serviceZip;
  const radiusMiles = resolveRadiusMiles(answers.serviceRadius);
  if (radiusMiles !== undefined) patch.serviceRadiusMiles = radiusMiles;

  const licenseInfo = composeLicenseInfo(answers);
  if (licenseInfo) patch.licenseInfo = licenseInfo;

  if (Array.isArray(answers.profilePhoto) && answers.profilePhoto[0]) {
    patch.avatarUrl = answers.profilePhoto[0] as string;
    patch.logoUrl = answers.profilePhoto[0] as string;
  }
  if (Array.isArray(answers.galleryPhotos) && answers.galleryPhotos.length > 0) {
    patch.galleryUrls = (answers.galleryPhotos as string[]).slice(0, 6);
  }

  return patch;
}

/** Loosely-typed agent patch — apply.ts writes it through agentProfileStore.update()'s own Partial<AgentProfile> signature. */
export type AgentIntakePatch = Partial<
  Pick<
    AgentProfile,
    | "professionType"
    | "displayName"
    | "brokerageName"
    | "officeName"
    | "teamName"
    | "licenseNumber"
    | "licenseState"
    | "categories"
    | "serviceArea"
    | "serviceZip"
    | "serviceRadius"
    | "neighborhoods"
    | "marketplaceSummary"
    | "languages"
    | "phone"
    | "email"
    | "whatsapp"
    | "website"
    | "bookingLink"
    | "photoUrl"
    | "coverPhotoUrl"
  >
>;

export function buildAgentPatch(answers: IntakeAnswers): AgentIntakePatch {
  const patch: AgentIntakePatch = {};

  if (typeof answers.professionType === "string" && isValidAgentProfessionType(answers.professionType)) {
    patch.professionType = answers.professionType;
  }
  if (typeof answers.displayName === "string" && answers.displayName) patch.displayName = answers.displayName;
  if (typeof answers.companyName === "string" && answers.companyName) patch.brokerageName = answers.companyName;
  if (typeof answers.officeName === "string" && answers.officeName) patch.officeName = answers.officeName;
  if (typeof answers.teamName === "string" && answers.teamName) patch.teamName = answers.teamName;
  if (typeof answers.licenseNumber === "string" && answers.licenseNumber) patch.licenseNumber = answers.licenseNumber;
  if (typeof answers.licenseState === "string" && answers.licenseState) patch.licenseState = answers.licenseState;

  const categories = dedupeCategories(answers);
  if (categories.length > 0) patch.categories = categories;

  const serviceArea = composeServiceArea(answers);
  if (serviceArea) patch.serviceArea = serviceArea;

  if (typeof answers.serviceRadius === "string" && answers.serviceRadius) {
    const radius = Number(answers.serviceRadius);
    if (Number.isFinite(radius)) patch.serviceRadius = radius;
  }
  const serviceZip = resolveServiceZip(answers.serviceZip);
  if (serviceZip) patch.serviceZip = serviceZip;
  if (typeof answers.neighborhoodsFocus === "string" && answers.neighborhoodsFocus) {
    patch.neighborhoods = answers.neighborhoodsFocus
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const summary = composeMarketplaceSummary(answers);
  if (summary) patch.marketplaceSummary = summary;

  if (Array.isArray(answers.languages) && answers.languages.length > 0) {
    patch.languages = (answers.languages as string[]).filter((l) => l !== "other");
  }

  if (typeof answers.phone === "string" && answers.phone) patch.phone = answers.phone;
  if (typeof answers.email === "string" && answers.email) patch.email = answers.email;
  if (typeof answers.whatsapp === "string" && answers.whatsapp) patch.whatsapp = answers.whatsapp;
  if (typeof answers.website === "string" && answers.website) patch.website = answers.website;
  if (typeof answers.bookingLink === "string" && answers.bookingLink) patch.bookingLink = answers.bookingLink;

  if (Array.isArray(answers.profilePhoto) && answers.profilePhoto[0]) {
    patch.photoUrl = answers.profilePhoto[0] as string;
  }
  if (Array.isArray(answers.coverPhoto) && answers.coverPhoto[0]) {
    patch.coverPhotoUrl = answers.coverPhoto[0] as string;
  }

  return patch;
}

function dedupeCategories(answers: IntakeAnswers): string[] {
  const primary = typeof answers.primaryService === "string" && answers.primaryService ? [answers.primaryService] : [];
  const additional = Array.isArray(answers.additionalServices) ? (answers.additionalServices as string[]) : [];
  return Array.from(new Set([...primary, ...additional]));
}

function composeMarketplaceSummary(answers: IntakeAnswers): string | undefined {
  const parts: string[] = [];
  if (typeof answers.idealCustomer === "string" && answers.idealCustomer) parts.push(answers.idealCustomer);
  if (typeof answers.customerProblem === "string" && answers.customerProblem) parts.push(answers.customerProblem);
  if (typeof answers.differentiator === "string" && answers.differentiator) parts.push(answers.differentiator);
  return parts.length > 0 ? parts.join(" ") : undefined;
}
