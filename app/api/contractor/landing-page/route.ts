import { NextRequest, NextResponse } from "next/server";
import { contractorStore, landingPageStore, newId } from "@/lib/store";
import { authorizeContractorId, isOperator, pinFromRequest } from "@/lib/auth";
import type { LandingPagePatch } from "@/lib/landing-page-types";

/** GET ?contractorId= — any authorized party (contractor's own PIN or operator) can read. */
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
  return NextResponse.json({ page });
}

/** PATCH — operator only, mirrors the contractor profile edit route. */
export async function PATCH(req: NextRequest) {
  if (!isOperator(pinFromRequest(req))) {
    return NextResponse.json({ error: "Operator PIN required" }, { status: 401 });
  }
  const body = await req.json();
  const contractorId = String(body.contractorId ?? "");
  const contractor = await contractorStore.getById(contractorId);
  if (!contractor) return NextResponse.json({ error: "Contractor not found" }, { status: 404 });

  const patch: LandingPagePatch = {};
  if (body.published !== undefined) patch.published = Boolean(body.published);
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
