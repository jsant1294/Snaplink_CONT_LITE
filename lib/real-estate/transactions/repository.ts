import { and, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";
import {
  realEstateActivities, realEstateAuditEvents, realEstateBrokerages, realEstateBuyers,
  realEstateLeads, realEstateMemberships, realEstateProperties, realEstateSellers,
  realEstateTransactionMilestones, realEstateTransactions, realEstateTransactionStatusHistory,
} from "@/lib/db/schema";
import { db } from "../repositories";
import type { DataScope } from "../access";
import type { TransactionInput, TransactionListOptions, TransactionStatus } from "./types";
import { assertTransactionTransition, isTransactionReadOnly } from "./status";

const uid = (kind: string) => `re_${kind}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
const now = () => new Date().toISOString();
const privileged = (scope: DataScope) => ["broker_owner", "administrator", "office_manager"].includes(scope.role);
const access = (scope: DataScope) => privileged(scope) ? undefined : or(
  eq(realEstateTransactions.listingAgentMembershipId, scope.membershipId || "__none__"),
  eq(realEstateTransactions.buyerAgentMembershipId, scope.membershipId || "__none__"),
  eq(realEstateTransactions.transactionCoordinatorMembershipId, scope.membershipId || "__none__"),
);

async function organizationForBrokerage(tenantId: string, brokerageId: string) {
  return (await db().select({ organizationId: realEstateBrokerages.organizationId }).from(realEstateBrokerages)
    .where(and(eq(realEstateBrokerages.id, brokerageId), eq(realEstateBrokerages.tenantId, tenantId), isNull(realEstateBrokerages.deletedAt))).limit(1))[0]?.organizationId;
}

async function validateRelation(table: typeof realEstateProperties | typeof realEstateLeads | typeof realEstateBuyers | typeof realEstateSellers, id: string | null | undefined, tenantId: string) {
  if (!id) return;
  const row = await db().select({ id: table.id }).from(table).where(and(eq(table.id, id), eq(table.tenantId, tenantId), isNull(table.deletedAt))).limit(1);
  if (!row[0]) throw new Error("A related record is outside this tenant or unavailable");
}

async function validateMembership(id: string | null | undefined, tenantId: string) {
  if (!id) return;
  const row = await db().select({ id: realEstateMemberships.id }).from(realEstateMemberships).where(and(
    eq(realEstateMemberships.id, id), eq(realEstateMemberships.tenantId, tenantId),
    eq(realEstateMemberships.isActive, true), isNull(realEstateMemberships.deletedAt),
  )).limit(1);
  if (!row[0]) throw new Error("Assigned member is outside this tenant or inactive");
}

async function validateInput(scope: DataScope, input: TransactionInput) {
  const organizationId = await organizationForBrokerage(scope.tenantId, input.brokerageId);
  if (!organizationId) throw new Error("Brokerage is outside this tenant or unavailable");
  await Promise.all([
    validateRelation(realEstateProperties, input.propertyId, scope.tenantId),
    validateRelation(realEstateLeads, input.leadId, scope.tenantId),
    validateRelation(realEstateBuyers, input.buyerId, scope.tenantId),
    validateRelation(realEstateSellers, input.sellerId, scope.tenantId),
    validateMembership(input.listingAgentMembershipId, scope.tenantId),
    validateMembership(input.buyerAgentMembershipId, scope.tenantId),
    validateMembership(input.transactionCoordinatorMembershipId, scope.tenantId),
  ]);
  return organizationId;
}

function milestoneRows(transactionId: string, tenantId: string, organizationId: string, input: TransactionInput) {
  return [
    ["contract", "Contract executed", input.contractDate],
    ["due_diligence", "Due diligence deadline", input.dueDiligenceDeadline],
    ["inspection", "Inspection deadline", input.inspectionDeadline],
    ["financing", "Financing deadline", input.financingDeadline],
    ["appraisal", "Appraisal deadline", input.appraisalDeadline],
    ["closing", "Closing", input.closingDate],
    ["possession", "Possession", input.possessionDate],
  ].filter((row) => row[2]).map(([type, title, dueAt]) => ({
    id: uid("mile"), tenantId, organizationId, transactionId,
    milestoneType: type!, title: title!, dueAt: dueAt!,
  }));
}

async function audit(tx: Parameters<Parameters<ReturnType<typeof db>["transaction"]>[0]>[0], input: {
  scope: DataScope; organizationId: string; membershipId: string; action: string;
  transactionId: string; metadata?: Record<string, unknown>;
}) {
  await tx.insert(realEstateActivities).values({
    id: uid("act"), tenantId: input.scope.tenantId, actorId: input.membershipId,
    entityType: "transaction", entityId: input.transactionId, action: input.action,
    description: `Transaction ${input.action.replaceAll("_", " ")}`, metadata: input.metadata ?? {},
  });
  await tx.insert(realEstateAuditEvents).values({
    id: uid("audit"), tenantId: input.scope.tenantId, organizationId: input.organizationId,
    actorType: "membership", actorMembershipId: input.membershipId, action: input.action,
    resourceType: "transaction", resourceId: input.transactionId, transactionId: input.transactionId,
    safeMetadata: input.metadata ?? {},
  });
}

export async function listTransactions(scope: DataScope, options: TransactionListOptions = {}) {
  const pageSize = Math.min(100, Math.max(1, options.pageSize ?? 25));
  const page = Math.max(1, options.page ?? 1);
  const search = options.search?.trim();
  const where = and(
    eq(realEstateTransactions.tenantId, scope.tenantId), isNull(realEstateTransactions.deletedAt),
    access(scope), options.status ? eq(realEstateTransactions.status, options.status) : undefined,
    search ? or(ilike(realEstateTransactions.transactionNumber, `%${search}%`), ilike(realEstateTransactions.notes, `%${search}%`)) : undefined,
  );
  const [rows, count] = await Promise.all([
    db().select().from(realEstateTransactions).where(where).orderBy(desc(realEstateTransactions.updatedAt)).limit(pageSize).offset((page - 1) * pageSize),
    db().select({ count: sql<number>`count(*)::int` }).from(realEstateTransactions).where(where),
  ]);
  return { records: rows, total: count[0]?.count ?? 0, page, pageSize };
}

export async function findTransaction(scope: DataScope, transactionId: string) {
  return (await db().select().from(realEstateTransactions).where(and(
    eq(realEstateTransactions.id, transactionId), eq(realEstateTransactions.tenantId, scope.tenantId),
    isNull(realEstateTransactions.deletedAt), access(scope),
  )).limit(1))[0] ?? null;
}

export async function createTransaction(scope: DataScope, membershipId: string, input: TransactionInput) {
  const organizationId = await validateInput(scope, input);
  if (!privileged(scope)) {
    if (!scope.membershipId || ![input.listingAgentMembershipId, input.buyerAgentMembershipId, input.transactionCoordinatorMembershipId].includes(scope.membershipId)) {
      throw new Error("Agent-scoped users must assign themselves to the transaction");
    }
  }
  const transactionId = uid("tx");
  const transactionNumber = `TX-${new Date().getUTCFullYear()}-${transactionId.slice(-8).toUpperCase()}`;
  return db().transaction(async tx => {
    const record = (await tx.insert(realEstateTransactions).values({
      id: transactionId, tenantId: scope.tenantId, organizationId, transactionNumber,
      brokerageId: input.brokerageId, transactionType: input.transactionType, priority: input.priority ?? "normal",
      propertyId: input.propertyId, leadId: input.leadId, buyerId: input.buyerId, sellerId: input.sellerId,
      listingAgentMembershipId: input.listingAgentMembershipId, buyerAgentMembershipId: input.buyerAgentMembershipId,
      transactionCoordinatorMembershipId: input.transactionCoordinatorMembershipId,
      purchasePriceCents: input.purchasePriceCents, listPriceCents: input.listPriceCents,
      earnestMoneyAmountCents: input.earnestMoneyAmountCents, dueDiligenceAmountCents: input.dueDiligenceAmountCents,
      financingAmountCents: input.financingAmountCents, downPaymentAmountCents: input.downPaymentAmountCents,
      contractDate: input.contractDate, bindingAgreementDate: input.bindingAgreementDate,
      dueDiligenceDeadline: input.dueDiligenceDeadline, inspectionDeadline: input.inspectionDeadline,
      financingDeadline: input.financingDeadline, appraisalDeadline: input.appraisalDeadline,
      closingDate: input.closingDate, possessionDate: input.possessionDate,
      notes: input.notes ?? "", internalNotes: input.internalNotes ?? "", createdByMembershipId: membershipId,
    }).returning())[0];
    const milestones = milestoneRows(transactionId, scope.tenantId, organizationId, input);
    if (milestones.length) await tx.insert(realEstateTransactionMilestones).values(milestones);
    await tx.insert(realEstateTransactionStatusHistory).values({
      id: uid("status"), tenantId: scope.tenantId, organizationId, transactionId,
      toStatus: "draft", actorMembershipId: membershipId, idempotencyKey: `created:${transactionId}`,
    });
    await audit(tx, { scope, organizationId, membershipId, action: "transaction_created", transactionId });
    return record;
  });
}

export async function transitionTransaction(scope: DataScope, membershipId: string, transactionId: string, toStatus: TransactionStatus, idempotencyKey: string, reason?: string) {
  if (!idempotencyKey.trim()) throw new Error("An idempotency key is required");
  return db().transaction(async tx => {
    const current = (await tx.select().from(realEstateTransactions).where(and(
      eq(realEstateTransactions.id, transactionId), eq(realEstateTransactions.tenantId, scope.tenantId),
      isNull(realEstateTransactions.deletedAt), access(scope),
    )).for("update").limit(1))[0];
    if (!current) return null;
    const prior = (await tx.select().from(realEstateTransactionStatusHistory).where(and(
      eq(realEstateTransactionStatusHistory.transactionId, transactionId),
      eq(realEstateTransactionStatusHistory.idempotencyKey, idempotencyKey),
    )).limit(1))[0];
    if (prior) return current;
    assertTransactionTransition(current.status as TransactionStatus, toStatus);
    const timestamp = now();
    const updated = (await tx.update(realEstateTransactions).set({
      status: toStatus, updatedAt: timestamp, updatedByMembershipId: membershipId,
      ...(toStatus === "closed" ? { closedAt: timestamp, closedByMembershipId: membershipId } : {}),
      ...(toStatus === "cancelled" ? { cancelledAt: timestamp, cancelledByMembershipId: membershipId } : {}),
    }).where(and(eq(realEstateTransactions.id, transactionId), eq(realEstateTransactions.tenantId, scope.tenantId))).returning())[0];
    await tx.insert(realEstateTransactionStatusHistory).values({
      id: uid("status"), tenantId: scope.tenantId, organizationId: current.organizationId,
      transactionId, fromStatus: current.status, toStatus, actorMembershipId: membershipId,
      idempotencyKey, reason,
    });
    await audit(tx, { scope, organizationId: current.organizationId, membershipId, action: "transaction_status_changed", transactionId, metadata: { fromStatus: current.status, toStatus } });
    return updated;
  });
}

export async function updateTransaction(scope: DataScope, membershipId: string, transactionId: string, input: Partial<TransactionInput>) {
  const current = await findTransaction(scope, transactionId);
  if (!current) return null;
  if (isTransactionReadOnly(current.status as TransactionStatus)) throw new Error("Closed transactions are read-only");
  if (input.brokerageId && input.brokerageId !== current.brokerageId) await validateInput(scope, { ...current, ...input } as TransactionInput);
  const allowed = {
    ...(input.priority !== undefined && { priority: input.priority }),
    ...(input.purchasePriceCents !== undefined && { purchasePriceCents: input.purchasePriceCents }),
    ...(input.listPriceCents !== undefined && { listPriceCents: input.listPriceCents }),
    ...(input.contractDate !== undefined && { contractDate: input.contractDate }),
    ...(input.dueDiligenceDeadline !== undefined && { dueDiligenceDeadline: input.dueDiligenceDeadline }),
    ...(input.inspectionDeadline !== undefined && { inspectionDeadline: input.inspectionDeadline }),
    ...(input.financingDeadline !== undefined && { financingDeadline: input.financingDeadline }),
    ...(input.appraisalDeadline !== undefined && { appraisalDeadline: input.appraisalDeadline }),
    ...(input.closingDate !== undefined && { closingDate: input.closingDate }),
    ...(input.possessionDate !== undefined && { possessionDate: input.possessionDate }),
    ...(input.notes !== undefined && { notes: input.notes }),
    ...(input.internalNotes !== undefined && { internalNotes: input.internalNotes }),
    updatedAt: now(), updatedByMembershipId: membershipId,
  };
  return db().transaction(async tx => {
    const updated = (await tx.update(realEstateTransactions).set(allowed).where(and(
      eq(realEstateTransactions.id, transactionId), eq(realEstateTransactions.tenantId, scope.tenantId),
      isNull(realEstateTransactions.deletedAt), access(scope),
    )).returning())[0] ?? null;
    const milestoneUpdates = [
      ["contract", input.contractDate], ["due_diligence", input.dueDiligenceDeadline],
      ["inspection", input.inspectionDeadline], ["financing", input.financingDeadline],
      ["appraisal", input.appraisalDeadline], ["closing", input.closingDate], ["possession", input.possessionDate],
    ] as const;
    for (const [milestoneType, dueAt] of milestoneUpdates) if (dueAt !== undefined) {
      const changed = await tx.update(realEstateTransactionMilestones).set({ dueAt, updatedAt: now() }).where(and(
        eq(realEstateTransactionMilestones.tenantId, scope.tenantId),
        eq(realEstateTransactionMilestones.transactionId, transactionId),
        eq(realEstateTransactionMilestones.milestoneType, milestoneType),
        eq(realEstateTransactionMilestones.manuallyAdjusted, false),
        isNull(realEstateTransactionMilestones.deletedAt),
      )).returning({ id: realEstateTransactionMilestones.id });
      if (!changed.length && dueAt) await tx.insert(realEstateTransactionMilestones).values({
        id: uid("mile"), tenantId: scope.tenantId, organizationId: current.organizationId,
        transactionId, milestoneType, title: milestoneType.replaceAll("_", " "), dueAt,
      });
    }
    if (updated) await audit(tx, { scope, organizationId: current.organizationId, membershipId, action: "transaction_updated", transactionId });
    return updated;
  });
}

export async function archiveTransaction(scope: DataScope, membershipId: string, transactionId: string) {
  const current = await findTransaction(scope, transactionId);
  if (!current) return null;
  if (isTransactionReadOnly(current.status as TransactionStatus)) throw new Error("Closed transactions require an authorized correction workflow");
  return db().transaction(async tx => {
    const timestamp = now();
    const archived = (await tx.update(realEstateTransactions).set({ deletedAt: timestamp, updatedAt: timestamp, updatedByMembershipId: membershipId }).where(and(
      eq(realEstateTransactions.id, transactionId), eq(realEstateTransactions.tenantId, scope.tenantId),
      isNull(realEstateTransactions.deletedAt), access(scope),
    )).returning())[0] ?? null;
    if (archived) await audit(tx, { scope, organizationId: current.organizationId, membershipId, action: "transaction_archived", transactionId });
    return archived;
  });
}
