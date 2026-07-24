import { NextRequest, NextResponse } from "next/server";
import { contractorStore, expenseStore, categoryStore, payeeStore, leadStore } from "@/lib/store";
import { authorizeContractorId } from "@/lib/auth";
import { fromCents } from "@/lib/money";

/**
 * Raw expense rows for the accountant's spreadsheet or bookkeeping import.
 * One row per expense. Amounts in dollars with two decimals.
 */
function csvCell(v: string | number): string {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("contractor") ?? "";
  const contractor = await contractorStore.getByUsername(username);
  if (!contractor) return NextResponse.json({ error: "Contractor not found" }, { status: 404 });
  const denied = await authorizeContractorId(req, contractor.id);
  if (denied) return NextResponse.json({ error: denied }, { status: 401 });

  const taxYear = Number(req.nextUrl.searchParams.get("year")) || new Date().getFullYear();
  const [expenses, categories, payeeList, leads] = await Promise.all([
    expenseStore.list(contractor.id, { year: taxYear }),
    categoryStore.list(contractor.id),
    payeeStore.list(contractor.id),
    leadStore.list(contractor.username),
  ]);

  const header = [
    "date",
    "amount",
    "category",
    "schedule_c_line",
    "kind",
    "vendor",
    "job_client",
    "payee",
    "billed_to_client",
    "has_receipt",
    "note",
  ];

  const rows = expenses
    .slice()
    .sort((a, b) => a.spentOn.localeCompare(b.spentOn))
    .map((e) => {
      const cat = categories.find((c) => c.id === e.categoryId);
      const lead = e.leadId ? leads.find((l) => l.id === e.leadId) : undefined;
      const payee = e.payeeId ? payeeList.find((p) => p.id === e.payeeId) : undefined;
      return [
        e.spentOn,
        fromCents(e.amountCents).toFixed(2),
        cat?.labelEn ?? "",
        cat?.scheduleCLine ?? "",
        e.leadId ? "job_material" : "overhead",
        e.vendor,
        lead ? `${lead.clientName} — ${lead.projectType}` : "",
        payee?.name ?? "",
        e.leadId ? (e.billedToClient ? "yes" : "no") : "",
        e.receiptUrl ? "yes" : "no",
        e.note,
      ].map(csvCell).join(",");
    });

  const csv = [header.join(","), ...rows].join("\n") + "\n";
  const slug = contractor.businessName.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase();

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="expenses-${taxYear}-${slug}.csv"`,
    },
  });
}
