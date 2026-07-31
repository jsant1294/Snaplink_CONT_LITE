import { NextRequest, NextResponse } from "next/server";
import { flipCampaignStore, flipPageStore, newId } from "@/lib/store";
import { authorizeContractorId } from "@/lib/auth";
import type { FlipPage, FlipPageType, FlipCtaType } from "@/lib/flipbook-types";

const PAGE_TYPES: FlipPageType[] = ["cover", "image", "text_image", "offer", "cta", "contact"];
const CTA_TYPES: FlipCtaType[] = ["url", "phone", "sms", "whatsapp"];

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await flipCampaignStore.get(id);
  if (!campaign) return NextResponse.json({ error: "Flipbook not found" }, { status: 404 });
  const denied = await authorizeContractorId(req, campaign.contractorId);
  if (denied) return NextResponse.json({ error: denied }, { status: 401 });
  const pages = await flipPageStore.listByCampaign(id);
  return NextResponse.json({ pages });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await flipCampaignStore.get(id);
  if (!campaign) return NextResponse.json({ error: "Flipbook not found" }, { status: 404 });
  const denied = await authorizeContractorId(req, campaign.contractorId);
  if (denied) return NextResponse.json({ error: denied }, { status: 401 });

  const body = await req.json();
  const pageType: FlipPageType = PAGE_TYPES.includes(body.pageType) ? body.pageType : "image";
  const ctaType: FlipCtaType | undefined = CTA_TYPES.includes(body.ctaType) ? body.ctaType : undefined;
  const existing = await flipPageStore.listByCampaign(id);
  const now = new Date().toISOString();

  const page: FlipPage = {
    id: newId("fpg"),
    campaignId: id,
    sortOrder: existing.length,
    pageType,
    headline: String(body.headline ?? "").slice(0, 120),
    body: String(body.body ?? "").slice(0, 1000),
    mediaUrl: body.mediaUrl ? String(body.mediaUrl) : undefined,
    ctaType,
    ctaLabel: body.ctaLabel ? String(body.ctaLabel).slice(0, 40) : undefined,
    ctaValue: body.ctaValue ? String(body.ctaValue).slice(0, 300) : undefined,
    createdAt: now,
    updatedAt: now,
  };
  const saved = await flipPageStore.create(page);
  return NextResponse.json({ ok: true, page: saved });
}
