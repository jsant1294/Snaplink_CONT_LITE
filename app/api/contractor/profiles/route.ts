import { NextRequest, NextResponse } from "next/server";
import { contractorStore, newId } from "@/lib/store";
import { SERVICE_LIBRARY } from "@/lib/services";
import { DEFAULT_PROFESSION_TYPE, isValidProfessionType } from "@/lib/profession-types";
import type { Contractor, ContractorStatus } from "@/lib/types";
import { pinFromRequest, isOperator, canAccessContractor, publicContractor } from "@/lib/auth";

/**
 * Full contractor roster — OPERATOR ONLY. Returns the full record minus the
 * PIN. No public page depends on this endpoint; public discovery uses the
 * server-side store or the dedicated public projection endpoint.
 */
export async function GET(req: NextRequest) {
  if (!isOperator(pinFromRequest(req))) {
    return NextResponse.json({ error: "Operator PIN required" }, { status: 401 });
  }
  const contractors = await contractorStore.list();
  return NextResponse.json({ contractors: contractors.map(publicContractor) });
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

const VALID_SERVICE_NAMES = new Set(SERVICE_LIBRARY.map((s) => s.name));

export async function POST(req: NextRequest) {
  if (!isOperator(pinFromRequest(req))) {
    return NextResponse.json({ error: "Operator PIN required to create contractors" }, { status: 401 });
  }
  const body = await req.json();
  const contractorPin = String(body.pin ?? "").trim();
  if (!/^\d{6}$/.test(contractorPin)) {
    return NextResponse.json({ error: "Contractor PIN must be exactly 6 digits" }, { status: 400 });
  }
  const businessName = String(body.businessName ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  if (!businessName || !phone) {
    return NextResponse.json({ error: "Business name and phone are required" }, { status: 400 });
  }

  const username = slugify(String(body.username ?? "") || businessName);
  if (!username) {
    return NextResponse.json({ error: "Could not derive a valid username" }, { status: 400 });
  }

  const services = Array.isArray(body.services)
    ? body.services.filter((s: unknown): s is string => typeof s === "string" && VALID_SERVICE_NAMES.has(s))
    : [];

  const contractor: Contractor = {
    id: newId("ctr"),
    username,
    pin: contractorPin,
    preferredLanguage: body.preferredLanguage === "es" ? "es" : "en",
    professionType: isValidProfessionType(body.professionType) ? body.professionType : DEFAULT_PROFESSION_TYPE,
    payments: typeof body.payments === "object" && body.payments ? body.payments : undefined,
    businessName,
    ownerName: String(body.ownerName ?? ""),
    phone,
    whatsapp: body.whatsapp ? String(body.whatsapp) : undefined,
    email: String(body.email ?? ""),
    serviceArea: String(body.serviceArea ?? ""),
    services,
    tagline: body.tagline ? String(body.tagline) : undefined,
    licenseInfo: body.licenseInfo ? String(body.licenseInfo) : undefined,
    reviewsUrl: body.reviewsUrl ? String(body.reviewsUrl) : undefined,
    galleryUrl: body.galleryUrl ? String(body.galleryUrl) : undefined,
    createdAt: new Date().toISOString(),
  };

  try {
    await contractorStore.create(contractor);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Create failed" }, { status: 409 });
  }
  return NextResponse.json({ ok: true, contractor: publicContractor(contractor) });
}

/**
 * PATCH { contractorId, pin?, preferredLanguage? } — operator only.
 * The recovery path when a contractor forgets their PIN: you set a new one
 * and read it to them over the phone. PINs are write-only; never returned.
 */
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const contractorId = String(body.contractorId ?? "");
  const pin = pinFromRequest(req);
  const operator = isOperator(pin);

  // Self-service: a contractor's own PIN may change ONLY their display language.
  // Anything touching the PIN itself stays operator-only.
  if (!operator) {
    const target = await contractorStore.getById(contractorId);
    // Self-service: contractor's own PIN may change language and/or payment methods (never their PIN).
    const onlySelfEditable =
      body.pin === undefined &&
      (body.preferredLanguage !== undefined || body.payments !== undefined);
    if (!target || !canAccessContractor(pin, target) || !onlySelfEditable) {
      return NextResponse.json({ error: "Operator PIN required" }, { status: 401 });
    }
  }
  const patch: {
    pin?: string;
    preferredLanguage?: "en" | "es";
    payments?: import("@/lib/types").PaymentMethods;
    status?: ContractorStatus;
  } & import("@/lib/types").ContractorProfilePatch = {};

  if (body.pin !== undefined) {
    const pin = String(body.pin).trim();
    if (!/^\d{6}$/.test(pin)) {
      return NextResponse.json({ error: "New PIN must be exactly 6 digits" }, { status: 400 });
    }
    patch.pin = pin;
  }
  if (body.preferredLanguage !== undefined) {
    patch.preferredLanguage = body.preferredLanguage === "es" ? "es" : "en";
  }
  if (body.payments !== undefined && typeof body.payments === "object") {
    patch.payments = body.payments as import("@/lib/types").PaymentMethods;
  }

  // Profile fields (business info, avatar/logo) are operator-only — a
  // contractor never edits their own listing, per the product model.
  if (operator) {
    if (body.businessName !== undefined) patch.businessName = String(body.businessName).trim();
    if (body.ownerName !== undefined) patch.ownerName = String(body.ownerName).trim();
    if (body.tagline !== undefined) patch.tagline = String(body.tagline).trim();
    if (body.phone !== undefined) patch.phone = String(body.phone).trim();
    if (body.whatsapp !== undefined) patch.whatsapp = String(body.whatsapp).trim();
    if (body.email !== undefined) patch.email = String(body.email).trim();
    if (body.serviceArea !== undefined) patch.serviceArea = String(body.serviceArea).trim();
    if (body.licenseInfo !== undefined) patch.licenseInfo = String(body.licenseInfo).trim();
    if (body.reviewsUrl !== undefined) patch.reviewsUrl = String(body.reviewsUrl).trim();
    if (body.galleryUrl !== undefined) patch.galleryUrl = String(body.galleryUrl).trim();
    if (body.website !== undefined) patch.website = String(body.website).trim();
    if (body.galleryUrls !== undefined && Array.isArray(body.galleryUrls)) {
      patch.galleryUrls = body.galleryUrls
        .filter((u: unknown): u is string => typeof u === "string" && u.trim().length > 0)
        .slice(0, 6);
    }
    if (body.avatarUrl !== undefined) patch.avatarUrl = String(body.avatarUrl).trim();
    if (body.logoUrl !== undefined) patch.logoUrl = String(body.logoUrl).trim();
    if (body.services !== undefined && Array.isArray(body.services)) {
      patch.services = body.services.filter(
        (s: unknown): s is string => typeof s === "string" && VALID_SERVICE_NAMES.has(s)
      );
    }
    if (body.professionType !== undefined && isValidProfessionType(body.professionType)) {
      patch.professionType = body.professionType;
    }
    if (body.status !== undefined) {
      if (!["draft", "onboarding", "ready", "published", "suspended"].includes(body.status)) {
        return NextResponse.json({ error: "Invalid contractor status" }, { status: 400 });
      }
      patch.status = body.status as ContractorStatus;
    }
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const updated = await contractorStore.update(contractorId, patch);
  if (!updated) return NextResponse.json({ error: "Contractor not found" }, { status: 404 });
  return NextResponse.json({ ok: true, contractor: publicContractor(updated) });
}
