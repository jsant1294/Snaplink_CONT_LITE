import { NextRequest, NextResponse } from "next/server";
import { contractorStore, landingPageStore, newId } from "@/lib/store";
import { authorizeContractorId, isOperator, pinFromRequest } from "@/lib/auth";
import { getProfessionalBillingSummary } from "@/lib/professional-intake-payment/adapters";
import { evaluateProfilePublicationEligibility } from "@/lib/professional-intake-payment/eligibility";
import type { LandingPagePatch } from "@/lib/landing-page-types";

/** Eligibility for the standalone landing-page editor. `profileApproved` is derived from the contractor lifecycle (not draft/suspended), never hardcoded. */
async function landingPageEligibility(contractorId: string, contractorStatus?: string) {
  const billing = await getProfessionalBillingSummary({ ownerType: "contractor", ownerId: contractorId });
  if (!billing) return null;
  const profileApproved = Boolean(contractorStatus && contractorStatus !== "draft" && contractorStatus !== "suspended");
  const eligibility = evaluateProfilePublicationEligibility({
    profileApproved,
    paymentStatus: billing.paymentStatus,
    planActive: billing.planActive,
    entitlementValid: billing.entitlementValid,
  });
  return { billing, eligibility };
}

/** GET ?contractorId= — any authorized party (contractor's own PIN or operator) can read. Operator requests also get billing + eligibility for gating the UI. */
export async function GET(req: NextRequest) {
  const contractorId = req.nextUrl.searchParams.get("contractorId") ?? "";
  if (!contractorId) return NextResponse.json({ error: "contractorId is required" }, { status: 400 });
  const denied = await authorizeContractorId(req, contractorId);
  if (denied) return NextResponse.json({ error: denied }, { status: 401 });

  const page = (await landingPageStore.get(contractorId)) ?? {
    id: "",
    contractorId,
    published: false,
    createdAt: "",
    updatedAt: "",
  };

  const gate = isOperator(pinFromRequest(req)) ? await landingPageEligibility(contractorId) : null;
  return NextResponse.json({ page, ...(gate ? { billing: gate.billing, eligibility: gate.eligibility } : {}) });
}

/** PATCH — operator only, mirrors the contractor profile edit route. Publishing is gated by the shared eligibility rule (never relies on a disabled UI toggle). */
export async function PATCH(req: NextRequest) {
  if (!isOperator(pinFromRequest(req))) {
    return NextResponse.json({ error: "Operator PIN required" }, { status: 401 });
  }
  const body = await req.json();
  const contractorId = String(body.contractorId ?? "");
  const contractor = await contractorStore.getById(contractorId);
  if (!contractor) return NextResponse.json({ error: "Contractor not found" }, { status: 404 });

  const desiredPublished = body.published === undefined ? undefined : Boolean(body.published);
  if (desiredPublished) {
    const gate = await landingPageEligibility(contractorId, contractor.status);
    if (!gate || !gate.eligibility.canPublish) {
      return NextResponse.json(
        { error: "Landing page is not eligible to publish", eligibility: gate?.eligibility ?? null, billing: gate?.billing ?? null },
        { status: 409 }
      );
    }
  }

  const patch: LandingPagePatch = {};
  if (desiredPublished !== undefined) patch.published = desiredPublished;
  if (body.templateKey !== undefined) patch.templateKey = String(body.templateKey).trim();
  if (body.headlineEn !== undefined) patch.headlineEn = String(body.headlineEn).trim();
  if (body.headlineEs !== undefined) patch.headlineEs = String(body.headlineEs).trim();
  if (body.subheadlineEn !== undefined) patch.subheadlineEn = String(body.subheadlineEn).trim();
  if (body.subheadlineEs !== undefined) patch.subheadlineEs = String(body.subheadlineEs).trim();
  if (body.ctaLabelEn !== undefined) patch.ctaLabelEn = String(body.ctaLabelEn).trim();
  if (body.ctaLabelEs !== undefined) patch.ctaLabelEs = String(body.ctaLabelEs).trim();
  if (body.ctaUrl !== undefined) patch.ctaUrl = String(body.ctaUrl).trim();
  if (body.locationText !== undefined) patch.locationText = String(body.locationText).trim();
  if (body.hoursText !== undefined) patch.hoursText = String(body.hoursText).trim();
  if (body.noteText !== undefined) patch.noteText = String(body.noteText).trim();
  if (body.heroImageUrl !== undefined) patch.heroImageUrl = String(body.heroImageUrl).trim();

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const page = await landingPageStore.upsert(newId("lp"), contractorId, patch);
  return NextResponse.json({ ok: true, page });
}
