// ---------------------------------------------------------------------------
// SnapLink Contractor — data model
// MVP persists to file-based JSON (lib/store.ts). These shapes are designed
// to map 1:1 onto Postgres/SQLite tables later (Drizzle-friendly: flat rows,
// FK ids, ISO timestamps).
// ---------------------------------------------------------------------------

/** Canonical EN service name from lib/services.ts SERVICE_LIBRARY. */
export type ProjectType = string;

export type LeadStatus =
  | "New"
  | "Needs Call"
  | "Walkthrough Scheduled"
  | "Estimate Sent"
  | "Approved"
  | "In Progress"
  | "Completed"
  | "Follow Up"
  | "Lost";

export const LEAD_STATUSES: LeadStatus[] = [
  "New",
  "Needs Call",
  "Walkthrough Scheduled",
  "Estimate Sent",
  "Approved",
  "In Progress",
  "Completed",
  "Follow Up",
  "Lost",
];

export type ContactMethod = "Call" | "Text" | "WhatsApp" | "Email";

/** How the lead reached the contractor. Future: QR/NFC tap attribution. */
export type LeadSource = "link" | "qr" | "nfc" | "manual" | "referral";

// --- Tables ---------------------------------------------------------------

/** How this contractor accepts money. All optional; only filled ones show. */
export interface PaymentMethods {
  zelle?: string;        // email or phone
  cashApp?: string;      // $cashtag (with or without $)
  venmo?: string;        // @handle
  paypalMe?: string;     // paypal.me/xxxx  OR full url
  stripeLink?: string;   // a Stripe Payment Link URL
  cash?: boolean;        // accepts cash
  check?: boolean;       // accepts check
  payToName?: string;    // "make checks payable to..."
}

export interface Contractor {
  id: string;
  username: string; // /contractor/[username]
  payments?: PaymentMethods;
  /** 6-digit PIN protecting this contractor's scoped dashboard. */
  pin?: string;
  /** Language the contractor's own dashboard, estimator, and AI scope notes render in. */
  preferredLanguage: "en" | "es";
  businessName: string;
  ownerName: string;
  phone: string; // E.164 preferred
  whatsapp?: string;
  email: string;
  serviceArea: string;
  services: ProjectType[];
  tagline?: string;
  licenseInfo?: string;
  reviewsUrl?: string;
  galleryUrl?: string;
  brandColor?: string;
  createdAt: string;
}

export interface ClientContact {
  id: string;
  name: string;
  phone: string;
  email: string;
  createdAt: string;
}

export interface Photo {
  id: string;
  leadId: string;
  kind: "current" | "inspiration" | "damage" | "other";
  /** MVP: data URL (compressed client-side). Later: blob storage URL. */
  dataUrl: string;
  filename: string;
  createdAt: string;
}

export interface AiSummary {
  summary: string;
  scopeNotes: string[];
  questionsForClient: string[];
  followUpSms: string;
  proposalIntro: string;
  needsConfirmation: string[];
  model: string;
  generatedAt: string;
}

export interface Lead {
  id: string;
  contractorId: string;
  contractorUsername: string;
  source: LeadSource;
  status: LeadStatus;
  /** Language the client used on the intake form. Drives AI follow-ups + proposal PDF language. */
  language: "en" | "es";
  // client contact (denormalized for MVP; split into clients table later)
  clientName: string;
  phone: string;
  email: string;
  projectAddress: string;
  preferredContact: ContactMethod;
  bestTimeToContact: string;
  // project
  projectType: ProjectType;
  timeline: string;
  budgetRange: string;
  notes: string;
  /** Answers to the dynamic, service-specific question set. */
  answers: Record<string, string>;
  photos: Photo[];
  tags: string[];
  ai?: AiSummary;
  payments?: Payment[];
  createdAt: string;
  updatedAt: string;
}

/** Sum of recorded payments on a lead. */
export function totalPaid(lead: { payments?: Payment[] }): number {
  return (lead.payments ?? []).reduce((s, p) => s + (p.amount || 0), 0);
}

export type EstimateStatus = "draft" | "sent" | "approved" | "declined";

export interface EstimateLineItem {
  id: string;
  /** Optional link back to lib/estimate-library.ts item. */
  libraryId?: string;
  description: string;
  descriptionEs?: string;
  qty: number;
  unit: string;
  unitPrice: number;
}

export type PaymentKind = "deposit" | "balance" | "partial" | "full";
export type PaymentVia = "Zelle" | "CashApp" | "Venmo" | "PayPal" | "Stripe" | "Cash" | "Check" | "Other";

export interface Payment {
  id: string;
  leadId: string;
  kind: PaymentKind;
  amount: number;
  via: PaymentVia;
  note?: string;
  receivedAt: string; // ISO date
}

export interface Estimate {
  id: string;
  leadId: string;
  contractorId: string;
  status: EstimateStatus;
  lineItems: EstimateLineItem[];
  /** Percent, e.g. 7 = 7% sales tax on subtotal after discount. */
  taxRate: number;
  /** Flat discount amount in dollars. */
  discount: number;
  /** Percent of total due as deposit, e.g. 30. */
  depositPercent: number;
  notes: string;
  /** Days the estimate remains valid. */
  validDays: number;
  createdAt: string;
  updatedAt: string;
}

export function estimateTotals(e: Pick<Estimate, "lineItems" | "taxRate" | "discount" | "depositPercent">) {
  const subtotal = e.lineItems.reduce((s, li) => s + (li.qty || 0) * (li.unitPrice || 0), 0);
  const afterDiscount = Math.max(0, subtotal - (e.discount || 0));
  const tax = afterDiscount * ((e.taxRate || 0) / 100);
  const total = afterDiscount + tax;
  const deposit = total * ((e.depositPercent || 0) / 100);
  return { subtotal, afterDiscount, tax, total, deposit, balance: total - deposit };
}
