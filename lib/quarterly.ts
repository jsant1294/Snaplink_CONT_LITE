// ---------------------------------------------------------------------------
// Quarterly aggregation — Lucio Financial Copilot, Delivery 3.
//
// Splits a tax year into four calendar quarters and rolls up income, expenses,
// net, and what the owner actually set aside.
//
// IMPORTANT: typicalDueDate is INFORMATIONAL. Federal estimated-payment dates
// shift for weekends and holidays and can change. The UI must label these as
// typical and tell the user to confirm with their accountant. This module does
// not compute tax owed and is not tax advice.
// ---------------------------------------------------------------------------

import type { Expense, TaxSetAside, QuarterSummary, QuarterlyView } from "./money-types";
import type { Lead } from "./types";
import { toCents } from "./money";

const QUARTER_DEFS = [
  { quarter: 1, startMonth: 1, endMonth: 3, labelEn: "Jan – Mar", labelEs: "Ene – Mar" },
  { quarter: 2, startMonth: 4, endMonth: 6, labelEn: "Apr – Jun", labelEs: "Abr – Jun" },
  { quarter: 3, startMonth: 7, endMonth: 9, labelEn: "Jul – Sep", labelEs: "Jul – Sep" },
  { quarter: 4, startMonth: 10, endMonth: 12, labelEn: "Oct – Dec", labelEs: "Oct – Dic" },
] as const;

/** Typical federal estimated-payment dates. Informational — always confirm. */
function typicalDueDate(quarter: number, taxYear: number): string {
  switch (quarter) {
    case 1:
      return `${taxYear}-04-15`;
    case 2:
      return `${taxYear}-06-15`;
    case 3:
      return `${taxYear}-09-15`;
    default:
      return `${taxYear + 1}-01-15`;
  }
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function quarterOf(isoDate: string): number {
  const month = Number(isoDate.slice(5, 7));
  if (month <= 3) return 1;
  if (month <= 6) return 2;
  if (month <= 9) return 3;
  return 4;
}

export function buildQuarterlyView(args: {
  taxYear: number;
  setAsidePercent: number;
  leads: Lead[];
  expenses: Expense[];
  setAsides: TaxSetAside[];
  lang: "en" | "es";
}): QuarterlyView {
  const { taxYear, setAsidePercent, leads, expenses, setAsides, lang } = args;

  const incomeByQuarter = [0, 0, 0, 0];
  for (const lead of leads) {
    for (const p of lead.payments ?? []) {
      const received = String(p.receivedAt ?? "");
      if (!received.startsWith(`${taxYear}`)) continue;
      // Payment timestamps are ISO strings; the first 10 chars are YYYY-MM-DD.
      const q = quarterOf(received.slice(0, 10));
      incomeByQuarter[q - 1] += toCents(p.amount);
    }
  }

  const expenseByQuarter = [0, 0, 0, 0];
  for (const e of expenses) {
    if (!e.spentOn.startsWith(`${taxYear}`)) continue;
    const q = quarterOf(e.spentOn);
    expenseByQuarter[q - 1] += e.amountCents;
  }

  const setAsideByQuarter = [0, 0, 0, 0];
  for (const s of setAsides) {
    if (s.taxYear !== taxYear) continue;
    if (s.quarter >= 1 && s.quarter <= 4) setAsideByQuarter[s.quarter - 1] += s.amountCents;
  }

  const quarters: QuarterSummary[] = QUARTER_DEFS.map((def) => {
    const i = def.quarter - 1;
    const incomeCents = incomeByQuarter[i];
    const expenseCents = expenseByQuarter[i];
    const netCents = incomeCents - expenseCents;
    const suggestedSetAsideCents = Math.round(Math.max(0, netCents) * (setAsidePercent / 100));
    const setAsideCents = setAsideByQuarter[i];
    return {
      quarter: def.quarter,
      periodLabel: lang === "es" ? def.labelEs : def.labelEn,
      startDate: `${taxYear}-${pad(def.startMonth)}-01`,
      endDate: `${taxYear}-${pad(def.endMonth)}-${pad(lastDayOfMonth(taxYear, def.endMonth))}`,
      typicalDueDate: typicalDueDate(def.quarter, taxYear),
      incomeCents,
      expenseCents,
      netCents,
      suggestedSetAsideCents,
      setAsideCents,
      shortfallCents: Math.max(0, suggestedSetAsideCents - setAsideCents),
    };
  });

  const totals = quarters.reduce(
    (acc, q) => ({
      incomeCents: acc.incomeCents + q.incomeCents,
      expenseCents: acc.expenseCents + q.expenseCents,
      netCents: acc.netCents + q.netCents,
      suggestedSetAsideCents: acc.suggestedSetAsideCents + q.suggestedSetAsideCents,
      setAsideCents: acc.setAsideCents + q.setAsideCents,
      shortfallCents: acc.shortfallCents + q.shortfallCents,
    }),
    { incomeCents: 0, expenseCents: 0, netCents: 0, suggestedSetAsideCents: 0, setAsideCents: 0, shortfallCents: 0 }
  );

  return { taxYear, setAsidePercent, quarters, totals };
}
