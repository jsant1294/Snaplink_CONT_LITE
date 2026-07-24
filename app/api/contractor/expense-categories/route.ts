import { NextRequest, NextResponse } from "next/server";
import { categoryStore, contractorStore, newId } from "@/lib/store";
import { authorizeContractorId } from "@/lib/auth";
import type { ExpenseCategory } from "@/lib/money-types";

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("contractor") ?? "";
  const contractor = await contractorStore.getByUsername(username);
  if (!contractor) return NextResponse.json({ error: "Contractor not found" }, { status: 404 });
  const denied = await authorizeContractorId(req, contractor.id);
  if (denied) return NextResponse.json({ error: denied }, { status: 401 });

  const categories = await categoryStore.list(contractor.id);
  return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const contractor = await contractorStore.getByUsername(String(body.contractorUsername ?? ""));
  if (!contractor) return NextResponse.json({ error: "Contractor not found" }, { status: 404 });
  const denied = await authorizeContractorId(req, contractor.id);
  if (denied) return NextResponse.json({ error: denied }, { status: 401 });

  const labelEn = String(body.labelEn ?? "").trim();
  const labelEs = String(body.labelEs ?? "").trim() || labelEn;
  if (!labelEn) return NextResponse.json({ error: "A label is required" }, { status: 400 });

  const category: ExpenseCategory = {
    id: newId("cat"),
    contractorId: contractor.id,
    key: labelEn.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 40),
    labelEn,
    labelEs,
    scheduleCLine: body.scheduleCLine ? String(body.scheduleCLine) : "27a",
    isJobMaterial: Boolean(body.isJobMaterial),
    sortOrder: 500,
  };

  const created = await categoryStore.create(category);
  return NextResponse.json({ ok: true, category: created });
}
