import { NextRequest, NextResponse } from "next/server";
import { contractorStore, newId } from "@/lib/store";
import { SERVICE_LIBRARY } from "@/lib/services";
import type { Contractor } from "@/lib/types";
import { pinFromRequest, isOperator, canAccessContractor, publicContractor } from "@/lib/auth";

export async function GET() {
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
  const patch: { pin?: string; preferredLanguage?: "en" | "es"; payments?: import("@/lib/types").PaymentMethods } = {};

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
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const updated = await contractorStore.update(contractorId, patch);
  if (!updated) return NextResponse.json({ error: "Contractor not found" }, { status: 404 });
  return NextResponse.json({ ok: true, contractor: publicContractor(updated) });
}
