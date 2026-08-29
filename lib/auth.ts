// ---------------------------------------------------------------------------
// Tenant auth (MVP): 6-digit PINs.
// - Operator PIN (env OPERATOR_PIN) unlocks the master admin and every
//   contractor scope — this is Southline's key. It MUST be configured in the
//   environment; there is intentionally NO default and the legacy fallback
//   "777777" is rejected. A missing/empty/unset value fails closed so every
//   operator-only path is denied rather than silently unlocked.
// - Each contractor has their own PIN, set at creation. It unlocks ONLY their
//   scope. They never see that other tenants exist.
// PIN travels as "x-snaplink-pin" header, or "?pin=" for PDF links (new tabs
// can't set headers). Swap for Auth.js sessions when the roster justifies it.
// ---------------------------------------------------------------------------

import type { NextRequest } from "next/server";
import type { Contractor } from "./types";
import { contractorStore } from "./store";

// The old default that must never be treated as a valid operator credential.
const LEGACY_DEFAULT_OPERATOR_PIN = "777777";

/**
 * Returns the configured operator PIN, or "" when it is missing, empty, or is
 * the legacy default. An empty return fails closed in isOperator() so no path
 * can silently open. The value is never surfaced in errors or logs.
 */
export function operatorPin(): string {
  const pin = process.env.OPERATOR_PIN?.trim();
  if (!pin || pin === LEGACY_DEFAULT_OPERATOR_PIN) return "";
  return pin;
}

export function pinFromRequest(req: NextRequest): string {
  return (
    req.headers.get("x-snaplink-pin") ??
    req.nextUrl.searchParams.get("pin") ??
    ""
  ).trim();
}

export function isOperator(pin: string): boolean {
  return pin.length > 0 && pin === operatorPin();
}

export function canAccessContractor(pin: string, contractor: Contractor): boolean {
  if (isOperator(pin)) return true;
  return Boolean(contractor.pin) && pin === contractor.pin;
}

/** Authorize a request against a contractor id. Returns null when allowed, or an error string. */
export async function authorizeContractorId(
  req: NextRequest,
  contractorId: string
): Promise<string | null> {
  const pin = pinFromRequest(req);
  if (isOperator(pin)) return null;
  const contractor = await contractorStore.getById(contractorId);
  if (!contractor) return "Contractor not found";
  return canAccessContractor(pin, contractor) ? null : "Invalid PIN for this dashboard";
}

/** Strip the PIN before sending a contractor object to any client. */
export function publicContractor<T extends Contractor>(c: T): Omit<T, "pin"> {
  const { pin: _pin, ...rest } = c;
  return rest;
}

/**
 * Minimal PUBLIC projection for contractor discovery (directory, results,
 * planner, booking). Only fields explicitly rendered on the public profile
 * page are included. Everything private/internal is intentionally dropped:
 * pin, payment methods, all Stripe/Connect state, all manual-payment state,
 * internal owner record, and operator telemetry.
 */
export interface PublicContractorDiscovery {
  id: string;
  username: string;
  professionType: string;
  preferredLanguage: "en" | "es";
  businessName: string;
  phone: string;
  whatsapp?: string;
  email: string;
  serviceArea: string;
  services: Contractor["services"];
  tagline?: string;
  licenseInfo?: string;
  reviewsUrl?: string;
  galleryUrl?: string;
  galleryUrls?: string[];
  website?: string;
  brandColor?: string;
  avatarUrl?: string;
  logoUrl?: string;
  createdAt?: string;
}

/** Maps a full contractor record down to the public discovery projection only. */
export function publicContractorDiscovery(
  c: Contractor
): PublicContractorDiscovery {
  return {
    id: c.id,
    username: c.username,
    professionType: c.professionType,
    preferredLanguage: c.preferredLanguage,
    businessName: c.businessName,
    phone: c.phone,
    whatsapp: c.whatsapp,
    email: c.email,
    serviceArea: c.serviceArea,
    services: c.services,
    tagline: c.tagline,
    licenseInfo: c.licenseInfo,
    reviewsUrl: c.reviewsUrl,
    galleryUrl: c.galleryUrl,
    galleryUrls: c.galleryUrls,
    website: c.website,
    brandColor: c.brandColor,
    avatarUrl: c.avatarUrl,
    logoUrl: c.logoUrl,
    createdAt: c.createdAt,
  };
}
