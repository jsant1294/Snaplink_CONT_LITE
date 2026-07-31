import { NextRequest, NextResponse } from "next/server";
import { campaignStore } from "@/lib/store";
import { authorizeContractorId } from "@/lib/auth";
import type { CampaignCtaType } from "@/lib/campaign-types";

const CTA_TYPES: CampaignCtaType[] = ["url", "phone", "sms", "whatsapp"];

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await campaignStore.get(id);
  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  const denied = await authorizeContractorId(req, campaign.contractorId);
  if (denied) return NextResponse.json({ error: denied }, { status: 401 });
  return NextResponse.json({ campaign });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await campaignStore.get(id);
  if (!existing) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  const denied = await authorizeContractorId(req, existing.contractorId);
  if (denied) return NextResponse.json({ error: denied }, { status: 401 });

  const body = await req.json();
  const patch: Record<string, unknown> = {};
  if (body.titleEn !== undefined) patch.titleEn = String(body.titleEn).slice(0, 120);
  if (body.titleEs !== undefined) patch.titleEs = String(body.titleEs).slice(0, 120);
  if (body.bodyEn !== undefined) patch.bodyEn = String(body.bodyEn).slice(0, 600);
  if (body.bodyEs !== undefined) patch.bodyEs = String(body.bodyEs).slice(0, 600);
  if (body.mediaUrl !== undefined) patch.mediaUrl = String(body.mediaUrl);
  if (body.ctaType !== undefined && CTA_TYPES.includes(body.ctaType)) patch.ctaType = body.ctaType;
  if (body.ctaValue !== undefined) patch.ctaValue = String(body.ctaValue).slice(0, 300);
  if (body.startsAt !== undefined) patch.startsAt = body.startsAt ? String(body.startsAt) : undefined;
  if (body.endsAt !== undefined) patch.endsAt = body.endsAt ? String(body.endsAt) : undefined;

  const updated = await campaignStore.update(id, patch);
  return NextResponse.json({ ok: true, campaign: updated });
}
