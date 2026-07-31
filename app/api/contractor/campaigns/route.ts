import { NextRequest, NextResponse } from "next/server";
import { campaignStore, newId } from "@/lib/store";
import { authorizeContractorId } from "@/lib/auth";
import { slugify } from "@/lib/slugify";
import type { Campaign, CampaignCtaType } from "@/lib/campaign-types";

const CTA_TYPES: CampaignCtaType[] = ["url", "phone", "sms", "whatsapp"];

export async function GET(req: NextRequest) {
  const contractorId = req.nextUrl.searchParams.get("contractorId") ?? "";
  if (!contractorId) return NextResponse.json({ error: "contractorId is required" }, { status: 400 });
  const denied = await authorizeContractorId(req, contractorId);
  if (denied) return NextResponse.json({ error: denied }, { status: 401 });
  const campaigns = await campaignStore.list(contractorId);
  return NextResponse.json({ campaigns });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const contractorId = String(body.contractorId ?? "");
  if (!contractorId) return NextResponse.json({ error: "contractorId is required" }, { status: 400 });
  const denied = await authorizeContractorId(req, contractorId);
  if (denied) return NextResponse.json({ error: denied }, { status: 401 });

  const titleEn = String(body.titleEn ?? "").slice(0, 120) || "Untitled Campaign";
  const ctaType: CampaignCtaType = CTA_TYPES.includes(body.ctaType) ? body.ctaType : "phone";
  const now = new Date().toISOString();
  const campaign: Campaign = {
    id: newId("camp"),
    contractorId,
    slug: slugify(titleEn),
    status: "draft",
    titleEn,
    titleEs: String(body.titleEs ?? "").slice(0, 120),
    bodyEn: String(body.bodyEn ?? "").slice(0, 600),
    bodyEs: String(body.bodyEs ?? "").slice(0, 600),
    ctaType,
    ctaValue: String(body.ctaValue ?? "").slice(0, 300),
    createdAt: now,
    updatedAt: now,
  };
  const saved = await campaignStore.create(campaign);
  return NextResponse.json({ ok: true, campaign: saved });
}
