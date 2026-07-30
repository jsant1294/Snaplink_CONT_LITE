import { and, asc, desc, eq, isNull } from "drizzle-orm";
import {
  realEstateActivities, realEstateAuditEvents, realEstateEscrowEvents, realEstateEscrowRecords,
  realEstateInspections, realEstateMessageThreads, realEstateOffers, realEstateOfferRevisions,
  realEstateOfferStatusHistory, realEstateTransactionMilestones, realEstateTransactionParticipants,
  realEstateTransactionStatusHistory, realEstateTransactions,
} from "@/lib/db/schema";
import { db } from "../repositories";
import type { DataScope } from "../access";
import { findTransaction, transitionTransaction } from "./repository";
import type { OfferRevisionInput } from "./types";

const uid = (kind: string) => `re_${kind}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
const now = () => new Date().toISOString();
const offerStatuses = ["draft", "submitted", "received", "countered", "accepted", "rejected", "withdrawn", "expired"];

async function material(scope: DataScope, membershipId: string, organizationId: string, transactionId: string, resourceType: string, resourceId: string, action: string, metadata: Record<string, unknown> = {}) {
  await Promise.all([
    db().insert(realEstateActivities).values({ id: uid("act"), tenantId: scope.tenantId, actorId: membershipId, entityType: resourceType, entityId: resourceId, action, description: action.replaceAll("_", " "), metadata: { transactionId, ...metadata } }),
    db().insert(realEstateAuditEvents).values({ id: uid("audit"), tenantId: scope.tenantId, organizationId, actorType: "membership", actorMembershipId: membershipId, action, resourceType, resourceId, transactionId, safeMetadata: metadata }),
  ]);
}

export async function transactionWorkspace(scope: DataScope, transactionId: string) {
  const transaction = await findTransaction(scope, transactionId);
  if (!transaction) return null;
  const [participants, offers, milestones, statusHistory, inspections, escrow, threads] = await Promise.all([
    db().select().from(realEstateTransactionParticipants).where(and(eq(realEstateTransactionParticipants.tenantId, scope.tenantId), eq(realEstateTransactionParticipants.transactionId, transactionId), isNull(realEstateTransactionParticipants.deletedAt))),
    db().select().from(realEstateOffers).where(and(eq(realEstateOffers.tenantId, scope.tenantId), eq(realEstateOffers.transactionId, transactionId), isNull(realEstateOffers.deletedAt))).orderBy(desc(realEstateOffers.updatedAt)),
    db().select().from(realEstateTransactionMilestones).where(and(eq(realEstateTransactionMilestones.tenantId, scope.tenantId), eq(realEstateTransactionMilestones.transactionId, transactionId), isNull(realEstateTransactionMilestones.deletedAt))).orderBy(asc(realEstateTransactionMilestones.dueAt)),
    db().select().from(realEstateTransactionStatusHistory).where(and(eq(realEstateTransactionStatusHistory.tenantId, scope.tenantId), eq(realEstateTransactionStatusHistory.transactionId, transactionId))).orderBy(desc(realEstateTransactionStatusHistory.createdAt)),
    db().select().from(realEstateInspections).where(and(eq(realEstateInspections.tenantId, scope.tenantId), eq(realEstateInspections.transactionId, transactionId), isNull(realEstateInspections.deletedAt))),
    db().select().from(realEstateEscrowRecords).where(and(eq(realEstateEscrowRecords.tenantId, scope.tenantId), eq(realEstateEscrowRecords.transactionId, transactionId), isNull(realEstateEscrowRecords.deletedAt))),
    db().select().from(realEstateMessageThreads).where(and(eq(realEstateMessageThreads.tenantId, scope.tenantId), eq(realEstateMessageThreads.transactionId, transactionId), isNull(realEstateMessageThreads.deletedAt))).orderBy(desc(realEstateMessageThreads.updatedAt)),
  ]);
  return { transaction, participants, offers, milestones, statusHistory, inspections, escrow, threads };
}

export async function createOffer(scope: DataScope, membershipId: string, transactionId: string, input: OfferRevisionInput & { direction?: "submitted" | "received" }) {
  const transaction = await findTransaction(scope, transactionId);
  if (!transaction) throw new Error("Transaction unavailable");
  if (!Number.isSafeInteger(input.offerPriceCents) || input.offerPriceCents <= 0) throw new Error("Offer price must be positive integer cents");
  const offerId = uid("offer");
  const offerNumber = `O-${Date.now().toString(36).toUpperCase()}`;
  return db().transaction(async tx => {
    const offer = (await tx.insert(realEstateOffers).values({
      id: offerId, tenantId: scope.tenantId, organizationId: transaction.organizationId, transactionId,
      propertyId: transaction.propertyId, offerNumber, status: "draft", buyerId: transaction.buyerId,
      sellerId: transaction.sellerId, submittedByMembershipId: input.direction !== "received" ? membershipId : null,
      receivedByMembershipId: input.direction === "received" ? membershipId : null,
    }).returning())[0];
    const revision = (await tx.insert(realEstateOfferRevisions).values({
      id: uid("revision"), tenantId: scope.tenantId, organizationId: transaction.organizationId,
      offerId, revisionNumber: 1, offerPriceCents: input.offerPriceCents,
      earnestMoneyAmountCents: input.earnestMoneyAmountCents, dueDiligenceAmountCents: input.dueDiligenceAmountCents,
      financingType: input.financingType, financingAmountCents: input.financingAmountCents,
      downPaymentAmountCents: input.downPaymentAmountCents, closingDate: input.closingDate,
      expirationAt: input.expirationAt, possessionDate: input.possessionDate,
      contingencies: input.contingencies ?? [], terms: input.terms ?? "", notes: input.notes ?? "",
      createdByMembershipId: membershipId,
    }).returning())[0];
    return { offer, revision };
  }).then(async result => { await material(scope, membershipId, transaction.organizationId, transactionId, "offer", result.offer.id, "offer_created"); return result; });
}

export async function reviseOffer(scope: DataScope, membershipId: string, transactionId: string, offerId: string, input: OfferRevisionInput) {
  const transaction = await findTransaction(scope, transactionId);
  if (!transaction) throw new Error("Transaction unavailable");
  return db().transaction(async tx => {
    const offer = (await tx.select().from(realEstateOffers).where(and(eq(realEstateOffers.id, offerId), eq(realEstateOffers.tenantId, scope.tenantId), eq(realEstateOffers.transactionId, transactionId), isNull(realEstateOffers.deletedAt))).for("update").limit(1))[0];
    if (!offer || offer.status === "accepted") throw new Error("Offer is unavailable or accepted");
    const number = offer.currentRevisionNumber + 1;
    const revision = (await tx.insert(realEstateOfferRevisions).values({ id: uid("revision"), tenantId: scope.tenantId, organizationId: transaction.organizationId, offerId, revisionNumber: number, status: "draft", offerPriceCents: input.offerPriceCents, earnestMoneyAmountCents: input.earnestMoneyAmountCents, dueDiligenceAmountCents: input.dueDiligenceAmountCents, financingType: input.financingType, financingAmountCents: input.financingAmountCents, downPaymentAmountCents: input.downPaymentAmountCents, closingDate: input.closingDate, expirationAt: input.expirationAt, possessionDate: input.possessionDate, contingencies: input.contingencies ?? [], terms: input.terms ?? "", notes: input.notes ?? "", createdByMembershipId: membershipId }).returning())[0];
    await tx.update(realEstateOffers).set({ currentRevisionNumber: number, status: "countered", updatedAt: now() }).where(eq(realEstateOffers.id, offerId));
    return revision;
  }).then(async revision => { await material(scope, membershipId, transaction.organizationId, transactionId, "offer", offerId, "offer_countered", { revisionNumber: revision.revisionNumber }); return revision; });
}

export async function changeOfferStatus(scope: DataScope, membershipId: string, transactionId: string, offerId: string, status: string) {
  if (!offerStatuses.includes(status) || status === "draft") throw new Error("Invalid offer status");
  const transaction = await findTransaction(scope, transactionId);
  if (!transaction) throw new Error("Transaction unavailable");
  const result = await db().transaction(async tx => {
    const offer = (await tx.select().from(realEstateOffers).where(and(eq(realEstateOffers.id, offerId), eq(realEstateOffers.tenantId, scope.tenantId), eq(realEstateOffers.transactionId, transactionId), isNull(realEstateOffers.deletedAt))).for("update").limit(1))[0];
    if (!offer || ["accepted", "rejected", "withdrawn", "expired"].includes(offer.status)) throw new Error("Offer is final or unavailable");
    const revision = (await tx.select().from(realEstateOfferRevisions).where(and(eq(realEstateOfferRevisions.offerId, offerId), eq(realEstateOfferRevisions.revisionNumber, offer.currentRevisionNumber))).limit(1))[0];
    if (!revision) throw new Error("Offer revision unavailable");
    const stamp = now();
    const updated = (await tx.update(realEstateOffers).set({ status, updatedAt: stamp, ...(status === "submitted" && { submittedAt: stamp }), ...(status === "accepted" && { acceptedAt: stamp }), ...(status === "rejected" && { rejectedAt: stamp }), ...(status === "withdrawn" && { withdrawnAt: stamp }), ...(status === "expired" && { expiredAt: stamp }) }).where(eq(realEstateOffers.id, offerId)).returning())[0];
    await tx.update(realEstateOfferRevisions).set({ status }).where(eq(realEstateOfferRevisions.id, revision.id));
    await tx.insert(realEstateOfferStatusHistory).values({ id: uid("offerstatus"), tenantId: scope.tenantId, offerId, revisionId: revision.id, fromStatus: offer.status, toStatus: status, actorMembershipId: membershipId });
    if (status === "accepted") await tx.update(realEstateTransactions).set({ purchasePriceCents: revision.offerPriceCents, earnestMoneyAmountCents: revision.earnestMoneyAmountCents, dueDiligenceAmountCents: revision.dueDiligenceAmountCents, financingAmountCents: revision.financingAmountCents, downPaymentAmountCents: revision.downPaymentAmountCents, closingDate: revision.closingDate, updatedAt: stamp }).where(eq(realEstateTransactions.id, transactionId));
    return updated;
  });
  await material(scope, membershipId, transaction.organizationId, transactionId, "offer", offerId, `offer_${status}`);
  if (status === "accepted" && ["active", "offer_submitted"].includes(transaction.status)) {
    if (transaction.status === "active") await transitionTransaction(scope, membershipId, transactionId, "offer_submitted", `offer-submit:${offerId}`);
    await transitionTransaction(scope, membershipId, transactionId, "offer_accepted", `offer-accept:${offerId}`);
  }
  return result;
}
