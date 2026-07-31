import { NextRequest, NextResponse } from "next/server";
import { flipCampaignStore, newId } from "@/lib/store";
import { authorizeContractorId } from "@/lib/auth";
import { requireModuleEnabled } from "@/lib/entitlements";
import { slugify } from "@/lib/slugify";
import type { FlipCampaign } from "@/lib/flipbook-types";

export async function GET(req: NextRequest) {
  const contractorId = req.nextUrl.searchParams.get("contractorId") ?? "";
  if (!contractorId) return NextResponse.json({ error: "contractorId is required" }, { status: 400 });
  const denied = await authorizeContractorId(req, contractorId);
  if (denied) return NextResponse.json({ error: denied }, { status: 401 });
  const moduleDenied = await requireModuleEnabled(contractorId, "flipbook");
  if (moduleDenied) return NextResponse.json({ error: moduleDenied }, { status: 403 });
  const campaigns = await flipCampaignStore.list(contractorId);
  return NextResponse.json({ campaigns });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const contractorId = String(body.contractorId ?? "");
  if (!contractorId) return NextResponse.json({ error: "contractorId is required" }, { status: 400 });
  const denied = await authorizeContractorId(req, contractorId);
  if (denied) return NextResponse.json({ error: denied }, { status: 401 });
  const moduleDenied = await requireModuleEnabled(contractorId, "flipbook");
  if (moduleDenied) return NextResponse.json({ error: moduleDenied }, { status: 403 });

  const title = String(body.title ?? "").slice(0, 120) || "Untitled Flipbook";
  const now = new Date().toISOString();
  const campaign: FlipCampaign = {
    id: newId("flip"),
    contractorId,
    slug: slugify(title),
    publicToken: newId("tok"),
    title,
    status: "draft",
    createdAt: now,
    updatedAt: now,
  };
  const saved = await flipCampaignStore.create(campaign);
  return NextResponse.json({ ok: true, campaign: saved });
}
