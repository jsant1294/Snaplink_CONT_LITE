import { and, asc, desc, eq, gt, isNull, or } from "drizzle-orm";
import {
  realEstateAppointments, realEstateDocumentRequests, realEstateDocuments, realEstateMessageParticipants,
  realEstateMessages, realEstateMessageThreads, realEstatePortalAccessGrants,
  realEstateTransactionMilestones, realEstateTransactions,
} from "@/lib/db/schema";
import { db } from "../repositories";
import type { PortalPrincipal } from "./auth";
import { portalCanAccess } from "./auth";

const now = () => new Date().toISOString();
export async function portalTransactions(principal: PortalPrincipal) {
  return db().select({
    id: realEstateTransactions.id, transactionNumber: realEstateTransactions.transactionNumber,
    transactionType: realEstateTransactions.transactionType, status: realEstateTransactions.status,
    closingDate: realEstateTransactions.closingDate, propertyId: realEstateTransactions.propertyId,
    leadId: realEstateTransactions.leadId,
  }).from(realEstatePortalAccessGrants).innerJoin(realEstateTransactions, eq(realEstatePortalAccessGrants.transactionId, realEstateTransactions.id))
    .where(and(eq(realEstatePortalAccessGrants.tenantId, principal.tenantId), eq(realEstatePortalAccessGrants.portalUserId, principal.portalUserId),
      isNull(realEstatePortalAccessGrants.revokedAt), or(isNull(realEstatePortalAccessGrants.expiresAt), gt(realEstatePortalAccessGrants.expiresAt, now())),
      isNull(realEstateTransactions.deletedAt))).orderBy(desc(realEstateTransactions.updatedAt));
}
export async function portalTransaction(principal: PortalPrincipal, id: string) {
  if (!await portalCanAccess(principal, id, "transaction:view")) return null;
  const transaction = (await db().select({
    id: realEstateTransactions.id, transactionNumber: realEstateTransactions.transactionNumber,
    transactionType: realEstateTransactions.transactionType, status: realEstateTransactions.status,
    closingDate: realEstateTransactions.closingDate, possessionDate: realEstateTransactions.possessionDate,
    propertyId: realEstateTransactions.propertyId,
  }).from(realEstateTransactions).where(and(eq(realEstateTransactions.id, id), eq(realEstateTransactions.tenantId, principal.tenantId), isNull(realEstateTransactions.deletedAt))).limit(1))[0];
  if (!transaction) return null;
  const milestones = await db().select({
    id: realEstateTransactionMilestones.id, title: realEstateTransactionMilestones.title,
    status: realEstateTransactionMilestones.status, dueAt: realEstateTransactionMilestones.dueAt,
  }).from(realEstateTransactionMilestones).where(and(eq(realEstateTransactionMilestones.tenantId, principal.tenantId),
    eq(realEstateTransactionMilestones.transactionId, id), eq(realEstateTransactionMilestones.clientVisible, true),
    isNull(realEstateTransactionMilestones.deletedAt))).orderBy(asc(realEstateTransactionMilestones.dueAt));
  return { transaction, milestones };
}
export async function portalDocuments(principal: PortalPrincipal) {
  const grants = await portalTransactions(principal); const ids = grants.map(item => item.id);
  if (!ids.length) return { documents: [], requests: [] };
  const [documents, requests] = await Promise.all([
    db().select({ id: realEstateDocuments.id, transactionId: realEstateDocuments.transactionId, title: realEstateDocuments.title, category: realEstateDocuments.category, status: realEstateDocuments.status, updatedAt: realEstateDocuments.updatedAt }).from(realEstateDocuments).where(and(eq(realEstateDocuments.tenantId, principal.tenantId), or(...ids.map(id => eq(realEstateDocuments.transactionId, id))), or(eq(realEstateDocuments.visibility, "client"), eq(realEstateDocuments.visibility, "selected_participants")), isNull(realEstateDocuments.deletedAt))).orderBy(desc(realEstateDocuments.updatedAt)),
    db().select().from(realEstateDocumentRequests).where(and(eq(realEstateDocumentRequests.tenantId, principal.tenantId), eq(realEstateDocumentRequests.requestedFromPortalUserId, principal.portalUserId))).orderBy(desc(realEstateDocumentRequests.createdAt)),
  ]);
  return { documents, requests };
}
export async function portalThreads(principal: PortalPrincipal) {
  return db().select({ id: realEstateMessageThreads.id, title: realEstateMessageThreads.title, transactionId: realEstateMessageThreads.transactionId, updatedAt: realEstateMessageThreads.updatedAt }).from(realEstateMessageParticipants)
    .innerJoin(realEstateMessageThreads, eq(realEstateMessageParticipants.threadId, realEstateMessageThreads.id))
    .where(and(eq(realEstateMessageParticipants.tenantId, principal.tenantId), eq(realEstateMessageParticipants.portalUserId, principal.portalUserId), isNull(realEstateMessageParticipants.removedAt), eq(realEstateMessageThreads.clientVisible, true), isNull(realEstateMessageThreads.deletedAt))).orderBy(desc(realEstateMessageThreads.updatedAt));
}
export async function portalMessages(principal: PortalPrincipal, threadId: string) {
  const allowed = (await portalThreads(principal)).some(thread => thread.id === threadId); if (!allowed) return [];
  return db().select({ id: realEstateMessages.id, body: realEstateMessages.body, createdAt: realEstateMessages.createdAt, senderPortalUserId: realEstateMessages.senderPortalUserId }).from(realEstateMessages).where(and(eq(realEstateMessages.tenantId, principal.tenantId), eq(realEstateMessages.threadId, threadId), isNull(realEstateMessages.deletedAt))).orderBy(asc(realEstateMessages.createdAt)).limit(100);
}
export async function portalAppointments(principal: PortalPrincipal) {
  const transactions = await portalTransactions(principal);
  const relationshipFilters = transactions.flatMap(item => item.leadId ? [eq(realEstateAppointments.leadId, item.leadId)] : []);
  if (!relationshipFilters.length) return [];
  return db().select().from(realEstateAppointments).where(and(eq(realEstateAppointments.tenantId, principal.tenantId), isNull(realEstateAppointments.deletedAt), or(...relationshipFilters))).limit(50);
}
