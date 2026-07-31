import { NextRequest, NextResponse } from "next/server";
import { flipCampaignStore } from "@/lib/store";
import { authorizeContractorId } from "@/lib/auth";
import { requireModuleEnabled } from "@/lib/entitlements";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await flipCampaignStore.get(id);
  if (!campaign) return NextResponse.json({ error: "Flipbook not found" }, { status: 404 });
  const denied = await authorizeContractorId(req, campaign.contractorId);
  if (denied) return NextResponse.json({ error: denied }, { status: 401 });
  const moduleDenied = await requireModuleEnabled(campaign.contractorId, "flipbook");
  if (moduleDenied) return NextResponse.json({ error: moduleDenied }, { status: 403 });
  return NextResponse.json({ campaign });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await flipCampaignStore.get(id);
  if (!existing) return NextResponse.json({ error: "Flipbook not found" }, { status: 404 });
  const denied = await authorizeContractorId(req, existing.contractorId);
  if (denied) return NextResponse.json({ error: denied }, { status: 401 });
  const moduleDenied = await requireModuleEnabled(existing.contractorId, "flipbook");
  if (moduleDenied) return NextResponse.json({ error: moduleDenied }, { status: 403 });

  const body = await req.json();
  const patch: Record<string, unknown> = {};
  if (body.title !== undefined) patch.title = String(body.title).slice(0, 120);
  if (body.slug !== undefined) patch.slug = String(body.slug).slice(0, 80);
  if (body.shareImageUrl !== undefined) patch.shareImageUrl = String(body.shareImageUrl);

  const updated = await flipCampaignStore.update(id, patch);
  return NextResponse.json({ ok: true, campaign: updated });
}
