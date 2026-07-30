export const TRANSACTION_STATUSES = [
  "draft", "active", "offer_submitted", "offer_accepted", "due_diligence",
  "inspection", "financing", "appraisal", "clear_to_close", "closed", "cancelled",
] as const;

export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];
export type TransactionType = "buyer_purchase" | "seller_listing" | "dual_agency" | "cash_purchase" | "financed_purchase";
export type TransactionPriority = "low" | "normal" | "high" | "critical";

export interface TransactionInput {
  brokerageId: string;
  transactionType: TransactionType;
  priority?: TransactionPriority;
  propertyId?: string | null;
  leadId?: string | null;
  buyerId?: string | null;
  sellerId?: string | null;
  listingAgentMembershipId?: string | null;
  buyerAgentMembershipId?: string | null;
  transactionCoordinatorMembershipId?: string | null;
  purchasePriceCents?: number | null;
  listPriceCents?: number | null;
  earnestMoneyAmountCents?: number | null;
  dueDiligenceAmountCents?: number | null;
  financingAmountCents?: number | null;
  downPaymentAmountCents?: number | null;
  contractDate?: string | null;
  bindingAgreementDate?: string | null;
  dueDiligenceDeadline?: string | null;
  inspectionDeadline?: string | null;
  financingDeadline?: string | null;
  appraisalDeadline?: string | null;
  closingDate?: string | null;
  possessionDate?: string | null;
  notes?: string;
  internalNotes?: string;
}

export interface TransactionListOptions {
  search?: string;
  status?: TransactionStatus;
  page?: number;
  pageSize?: number;
}

export interface OfferRevisionInput {
  offerPriceCents: number;
  earnestMoneyAmountCents?: number | null;
  dueDiligenceAmountCents?: number | null;
  financingType?: string | null;
  financingAmountCents?: number | null;
  downPaymentAmountCents?: number | null;
  closingDate?: string | null;
  expirationAt?: string | null;
  possessionDate?: string | null;
  contingencies?: string[];
  terms?: string;
  notes?: string;
}
