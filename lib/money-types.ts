// ---------------------------------------------------------------------------
// Lucio Financial Copilot — types.
// Kept in their own file so lib/types.ts stays untouched.
// All money fields are INTEGER CENTS (see lib/money.ts).
// ---------------------------------------------------------------------------

export type EntityType = "sole_prop" | "llc_single" | "llc_multi" | "s_corp";

export const ENTITY_TYPES: EntityType[] = ["sole_prop", "llc_single", "llc_multi", "s_corp"];

export interface TaxProfile {
  id: string;
  contractorId: string;
  entityType: EntityType;
  /** Percent of net the owner chooses to set aside. Owner-configurable, not advice. */
  setAsidePercent: number;
  businessLegalName?: string;
  taxYearStartMonth: number;
  /** Cents. Owner-configurable 1099 review threshold (default $600). */
  payeeAlertThresholdCents: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseCategory {
  id: string;
  /** undefined = system default (available to everyone); set = custom to one contractor */
  contractorId?: string;
  key: string;
  labelEn: string;
  labelEs: string;
  /** Schedule C line reference. Internal mapping — not surfaced by default. */
  scheduleCLine?: string;
  isJobMaterial: boolean;
  sortOrder: number;
}

export interface Expense {
  id: string;
  contractorId: string;
  /** SET = job material (billable to that lead). UNDEFINED = business overhead (deductible). */
  leadId?: string;
  /** SET when this expense was a payment to a payee tracked for 1099 purposes. */
  payeeId?: string;
  categoryId: string;
  amountCents: number;
  /** YYYY-MM-DD — the date the money was spent, not the date it was entered. */
  spentOn: string;
  vendor: string;
  note: string;
  receiptUrl?: string;
  receiptFilename?: string;
  billedToClient: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryTotal {
  categoryId: string;
  key: string;
  labelEn: string;
  labelEs: string;
  totalCents: number;
}

export interface MoneySummary {
  year: number;
  /** From existing lead payments — no separate income table. */
  incomeCents: number;
  /** Expenses with no leadId. */
  overheadCents: number;
  /** Expenses tied to a leadId. */
  jobMaterialCents: number;
  netCents: number;
  setAsidePercent: number;
  suggestedSetAsideCents: number;
  byCategory: CategoryTotal[];
  /** Job materials not yet marked billed — money the owner may be forgetting to charge. */
  unbilledMaterialCents: number;
}

// --- Delivery 2: 1099 tracking ---------------------------------------------
// SECURITY: full TINs are never stored. Only tinType + last 4, plus the
// uploaded W-9 document. The accountant reads the real number off the W-9.

export type PayeeType = "individual" | "business";
export type TinType = "ssn" | "ein" | "unknown";
export type Form1099Type = "1099-NEC" | "1099-MISC" | "1099-K" | "other";

export const PAYEE_TYPES: PayeeType[] = ["individual", "business"];
export const TIN_TYPES: TinType[] = ["ssn", "ein", "unknown"];
export const FORM_1099_TYPES: Form1099Type[] = ["1099-NEC", "1099-MISC", "1099-K", "other"];

export interface Payee {
  id: string;
  contractorId: string;
  name: string;
  payeeType: PayeeType;
  legalName?: string;
  address?: string;
  tinType: TinType;
  /** Last 4 digits only. Never the full TIN. */
  tinLast4?: string;
  w9OnFile: boolean;
  w9ReceivedOn?: string;
  w9DocUrl?: string;
  w9DocFilename?: string;
  email: string;
  phone: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

/** A payee plus what was paid to them in a given tax year. */
export interface PayeeWithTotal extends Payee {
  paidCents: number;
  /** true when paidCents >= the owner's configured alert threshold */
  overThreshold: boolean;
  /** true when over threshold but no W-9 collected — the thing that bites in January */
  needsW9: boolean;
}

export interface Form1099Received {
  id: string;
  contractorId: string;
  taxYear: number;
  issuerName: string;
  formType: Form1099Type;
  amountCents: number;
  docUrl?: string;
  docFilename?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

/** Compares 1099s received against income recorded in the app for the same year. */
export interface Reconciliation {
  taxYear: number;
  /** Sum of all 1099s received for the year. */
  forms1099TotalCents: number;
  /** Income recorded from lead payments for the year. */
  recordedIncomeCents: number;
  /** recordedIncome - forms1099Total. Positive = you recorded more than was 1099'd. */
  differenceCents: number;
}

// --- Delivery 3: quarterly view + year-end pack -----------------------------

export interface TaxSetAside {
  id: string;
  contractorId: string;
  taxYear: number;
  quarter: number;
  amountCents: number;
  movedOn: string;
  note: string;
  createdAt: string;
}

export interface QuarterSummary {
  quarter: number;
  /** Months covered, e.g. "Jan – Mar" */
  periodLabel: string;
  startDate: string;
  endDate: string;
  /** TYPICAL federal estimated-payment date for this quarter. Informational only. */
  typicalDueDate: string;
  incomeCents: number;
  expenseCents: number;
  netCents: number;
  suggestedSetAsideCents: number;
  /** What the owner recorded actually moving aside. */
  setAsideCents: number;
  /** suggested - actual. Positive = behind. */
  shortfallCents: number;
}

export interface QuarterlyView {
  taxYear: number;
  setAsidePercent: number;
  quarters: QuarterSummary[];
  totals: {
    incomeCents: number;
    expenseCents: number;
    netCents: number;
    suggestedSetAsideCents: number;
    setAsideCents: number;
    shortfallCents: number;
  };
}
