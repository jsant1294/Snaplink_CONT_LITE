import { TRANSACTION_STATUSES, type TransactionInput, type TransactionStatus } from "./types";

const types = ["buyer_purchase", "seller_listing", "dual_agency", "cash_purchase", "financed_purchase"];
const priorities = ["low", "normal", "high", "critical"];
const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
const nullableText = (value: unknown) => text(value) || null;
const nullableCents = (value: unknown) => value == null || value === "" ? null : Number(value);

export function validateTransactionInput(raw: unknown): { data?: TransactionInput; errors?: Record<string, string> } {
  const body = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  const errors: Record<string, string> = {};
  const transactionType = text(body.transactionType);
  const brokerageId = text(body.brokerageId);
  const priority = text(body.priority) || "normal";
  if (!brokerageId) errors.brokerageId = "Brokerage is required";
  if (!types.includes(transactionType)) errors.transactionType = "Select a valid transaction type";
  if (!priorities.includes(priority)) errors.priority = "Select a valid priority";
  const moneyKeys = ["purchasePriceCents", "listPriceCents", "earnestMoneyAmountCents", "dueDiligenceAmountCents", "financingAmountCents", "downPaymentAmountCents"] as const;
  const money = Object.fromEntries(moneyKeys.map(key => [key, nullableCents(body[key])])) as Record<(typeof moneyKeys)[number], number | null>;
  for (const key of moneyKeys) if (money[key] !== null && (!Number.isSafeInteger(money[key]) || money[key]! < 0)) errors[key] = "Use a non-negative amount in cents";
  if (Object.keys(errors).length) return { errors };
  return { data: {
    brokerageId, transactionType: transactionType as TransactionInput["transactionType"],
    priority: priority as TransactionInput["priority"],
    propertyId: nullableText(body.propertyId), leadId: nullableText(body.leadId),
    buyerId: nullableText(body.buyerId), sellerId: nullableText(body.sellerId),
    listingAgentMembershipId: nullableText(body.listingAgentMembershipId),
    buyerAgentMembershipId: nullableText(body.buyerAgentMembershipId),
    transactionCoordinatorMembershipId: nullableText(body.transactionCoordinatorMembershipId),
    ...money,
    contractDate: nullableText(body.contractDate), bindingAgreementDate: nullableText(body.bindingAgreementDate),
    dueDiligenceDeadline: nullableText(body.dueDiligenceDeadline), inspectionDeadline: nullableText(body.inspectionDeadline),
    financingDeadline: nullableText(body.financingDeadline), appraisalDeadline: nullableText(body.appraisalDeadline),
    closingDate: nullableText(body.closingDate), possessionDate: nullableText(body.possessionDate),
    notes: text(body.notes), internalNotes: text(body.internalNotes),
  } };
}

export function parseTransactionStatus(value: unknown): TransactionStatus | null {
  return typeof value === "string" && TRANSACTION_STATUSES.includes(value as TransactionStatus) ? value as TransactionStatus : null;
}
