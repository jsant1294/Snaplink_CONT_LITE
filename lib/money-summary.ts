// ---------------------------------------------------------------------------
// Money summary — Lucio Financial Copilot, Delivery 1.
//
// Rolls a tax year up into income, overhead, job materials, net, and the
// suggested set-aside. Mirrors the per-quarter math in lib/quarterly.ts.
// Not tax advice — see the disclaimer surfaced in the UI.
// ---------------------------------------------------------------------------

import type { CategoryTotal, Expense, ExpenseCategory, MoneySummary } from "./money-types";
import type { Lead } from "./types";
import { toCents } from "./money";

export function buildMoneySummary(args: {
  year: number;
  setAsidePercent: number;
  leads: Lead[];
  expenses: Expense[];
  categories: ExpenseCategory[];
}): MoneySummary {
  const { year, setAsidePercent, leads, expenses, categories } = args;

  let incomeCents = 0;
  for (const lead of leads) {
    for (const p of lead.payments ?? []) {
      const received = String(p.receivedAt ?? "");
      if (!received.startsWith(`${year}`)) continue;
      incomeCents += toCents(p.amount);
    }
  }

  const yearExpenses = expenses.filter((e) => e.spentOn.startsWith(`${year}`));

  let overheadCents = 0;
  let jobMaterialCents = 0;
  let unbilledMaterialCents = 0;
  const totalsByCategory = new Map<string, number>();

  for (const e of yearExpenses) {
    if (e.leadId) {
      jobMaterialCents += e.amountCents;
      if (!e.billedToClient) unbilledMaterialCents += e.amountCents;
    } else {
      overheadCents += e.amountCents;
    }
    totalsByCategory.set(e.categoryId, (totalsByCategory.get(e.categoryId) ?? 0) + e.amountCents);
  }

  const byCategory: CategoryTotal[] = categories
    .filter((c) => totalsByCategory.has(c.id))
    .map((c) => ({
      categoryId: c.id,
      key: c.key,
      labelEn: c.labelEn,
      labelEs: c.labelEs,
      totalCents: totalsByCategory.get(c.id) ?? 0,
    }))
    .sort((a, b) => b.totalCents - a.totalCents);

  const netCents = incomeCents - overheadCents - jobMaterialCents;
  const suggestedSetAsideCents = Math.round(Math.max(0, netCents) * (setAsidePercent / 100));

  return {
    year,
    incomeCents,
    overheadCents,
    jobMaterialCents,
    netCents,
    setAsidePercent,
    suggestedSetAsideCents,
    byCategory,
    unbilledMaterialCents,
  };
}
