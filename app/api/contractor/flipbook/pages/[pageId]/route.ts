import { NextRequest, NextResponse } from "next/server";
import { flipCampaignStore, flipPageStore } from "@/lib/store";
import { authorizeContractorId } from "@/lib/auth";
import type { FlipPageType, FlipCtaType } from "@/lib/flipbook-types";

const PAGE_TYPES: FlipPageType[] = ["cover", "image", "text_image", "offer", "cta", "contact"];
const CTA_TYPES: FlipCtaType[] = ["url", "phone", "sms", "whatsapp"];

async function authorizeForPage(req: NextRequest, pageId: string) {
  const page = await flipPageStore.get(pageId);
  if (!page) return { error: NextResponse.json({ error: "Page not found" }, { status: 404 }) };
  const campaign = await flipCampaignStore.get(page.campaignId);
  if (!campaign) return { error: NextResponse.json({ error: "Flipbook not found" }, { status: 404 }) };
  const denied = await authorizeContractorId(req, campaign.contractorId);
  if (denied) return { error: NextResponse.json({ error: denied }, { status: 401 }) };
  return { page };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ pageId: string }> }) {
  const { pageId } = await params;
  const auth = await authorizeForPage(req, pageId);
  if (auth.error) return auth.error;

  const body = await req.json();
  const patch: Record<string, unknown> = {};
  if (body.pageType !== undefined && PAGE_TYPES.includes(body.pageType)) patch.pageType = body.pageType;
  if (body.headline !== undefined) patch.headline = String(body.headline).slice(0, 120);
  if (body.body !== undefined) patch.body = String(body.body).slice(0, 1000);
  if (body.mediaUrl !== undefined) patch.mediaUrl = String(body.mediaUrl);
  if (body.ctaType !== undefined) patch.ctaType = CTA_TYPES.includes(body.ctaType) ? body.ctaType : undefined;
  if (body.ctaLabel !== undefined) patch.ctaLabel = String(body.ctaLabel).slice(0, 40);
  if (body.ctaValue !== undefined) patch.ctaValue = String(body.ctaValue).slice(0, 300);

  const updated = await flipPageStore.update(pageId, patch);
  return NextResponse.json({ ok: true, page: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ pageId: string }> }) {
  const { pageId } = await params;
  const auth = await authorizeForPage(req, pageId);
  if (auth.error) return auth.error;
  await flipPageStore.remove(pageId);
  return NextResponse.json({ ok: true });
}
