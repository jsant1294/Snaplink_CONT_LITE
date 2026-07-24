import { NextRequest, NextResponse } from "next/server";
import { contractorStore, leadStore, expenseStore, setAsideStore, taxProfileStore } from "@/lib/store";
import { authorizeContractorId } from "@/lib/auth";
import { buildQuarterlyView } from "@/lib/quarterly";

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("contractor") ?? "";
  const contractor = await contractorStore.getByUsername(username);
  if (!contractor) return NextResponse.json({ error: "Contractor not found" }, { status: 404 });
  const denied = await authorizeContractorId(req, contractor.id);
  if (denied) return NextResponse.json({ error: denied }, { status: 401 });

  const taxYear = Number(req.nextUrl.searchParams.get("year")) || new Date().getFullYear();
  const langParam = req.nextUrl.searchParams.get("lang");
  const lang = langParam === "es" ? "es" : "en";

  const [leads, expenses, setAsides, profile] = await Promise.all([
    leadStore.list(contractor.username),
    expenseStore.list(contractor.id, { year: taxYear }),
    setAsideStore.list(contractor.id, taxYear),
    taxProfileStore.get(contractor.id),
  ]);

  const view = buildQuarterlyView({
    taxYear,
    setAsidePercent: profile?.setAsidePercent ?? 25,
    leads,
    expenses,
    setAsides,
    lang,
  });

  return NextResponse.json({ view, setAsides });
}
