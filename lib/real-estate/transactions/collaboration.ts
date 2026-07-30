import { and, desc, eq, isNull } from "drizzle-orm";
import {
  realEstateAuditEvents, realEstateDocumentRequests, realEstateMessageParticipants,
  realEstateMessages, realEstateMessageThreads, realEstatePortalAccessGrants,
  realEstatePortalUsers,
} from "@/lib/db/schema";
import { db } from "../repositories";
import type { DataScope } from "../access";
import type { PortalPrincipal } from "../portal/auth";
import { portalCanAccess } from "../portal/auth";
import { findTransaction } from "./repository";

const uid = (kind: string) => `re_${kind}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
const now = () => new Date().toISOString();
export async function createClientThread(scope: DataScope, membershipId: string, transactionId: string, input: { title: string; portalUserIds: string[]; body?: string }) {
  const transaction = await findTransaction(scope, transactionId); if (!transaction) throw new Error("Transaction unavailable");
  const portalUsers = input.portalUserIds.length ? await db().select({ id: realEstatePortalUsers.id }).from(realEstatePortalUsers).innerJoin(realEstatePortalAccessGrants, eq(realEstatePortalUsers.id, realEstatePortalAccessGrants.portalUserId)).where(and(eq(realEstatePortalUsers.tenantId, scope.tenantId), eq(realEstatePortalAccessGrants.transactionId, transactionId), isNull(realEstatePortalAccessGrants.revokedAt))) : [];
  if (portalUsers.length !== new Set(input.portalUserIds).size) throw new Error("A portal participant lacks transaction access");
  return db().transaction(async tx => {
    const thread = (await tx.insert(realEstateMessageThreads).values({ id: uid("thread"), tenantId: scope.tenantId, organizationId: transaction.organizationId, transactionId, threadType: "client", title: input.title.trim(), clientVisible: true, createdByMembershipId: membershipId }).returning())[0];
    await tx.insert(realEstateMessageParticipants).values([{ id: uid("participant"), tenantId: scope.tenantId, threadId: thread.id, membershipId }, ...portalUsers.map(user => ({ id: uid("participant"), tenantId: scope.tenantId, threadId: thread.id, portalUserId: user.id }))]);
    if (input.body?.trim()) await tx.insert(realEstateMessages).values({ id: uid("message"), tenantId: scope.tenantId, threadId: thread.id, senderMembershipId: membershipId, body: input.body.trim() });
    await tx.insert(realEstateAuditEvents).values({ id: uid("audit"), tenantId: scope.tenantId, organizationId: transaction.organizationId, actorType: "membership", actorMembershipId: membershipId, action: "message_thread_created", resourceType: "message_thread", resourceId: thread.id, transactionId });
    return thread;
  });
}
export async function sendProfessionalMessage(scope: DataScope, membershipId: string, threadId: string, body: string) {
  if (!body.trim() || body.length > 10_000) throw new Error("Message is required and must be under 10,000 characters");
  const thread = (await db().select().from(realEstateMessageThreads).innerJoin(realEstateMessageParticipants, eq(realEstateMessageThreads.id, realEstateMessageParticipants.threadId)).where(and(eq(realEstateMessageThreads.id, threadId), eq(realEstateMessageThreads.tenantId, scope.tenantId), eq(realEstateMessageParticipants.membershipId, membershipId), isNull(realEstateMessageParticipants.removedAt), isNull(realEstateMessageThreads.deletedAt))).limit(1))[0]?.real_estate_message_threads;
  if (!thread) throw new Error("Thread unavailable");
  const message = (await db().insert(realEstateMessages).values({ id: uid("message"), tenantId: scope.tenantId, threadId, senderMembershipId: membershipId, body: body.trim() }).returning())[0];
  await db().update(realEstateMessageThreads).set({ updatedAt: now() }).where(eq(realEstateMessageThreads.id, threadId));
  return message;
}
export async function sendPortalMessage(principal: PortalPrincipal, threadId: string, body: string) {
  if (!body.trim() || body.length > 10_000) throw new Error("Message is required and must be under 10,000 characters");
  const thread = (await db().select({ thread: realEstateMessageThreads }).from(realEstateMessageThreads).innerJoin(realEstateMessageParticipants, eq(realEstateMessageThreads.id, realEstateMessageParticipants.threadId)).where(and(eq(realEstateMessageThreads.id, threadId), eq(realEstateMessageThreads.tenantId, principal.tenantId), eq(realEstateMessageThreads.clientVisible, true), eq(realEstateMessageParticipants.portalUserId, principal.portalUserId), isNull(realEstateMessageParticipants.removedAt), isNull(realEstateMessageThreads.deletedAt))).limit(1))[0]?.thread;
  if (!thread || !thread.transactionId || !await portalCanAccess(principal, thread.transactionId, "messages:send")) throw new Error("Thread unavailable");
  const message = (await db().insert(realEstateMessages).values({ id: uid("message"), tenantId: principal.tenantId, threadId, senderPortalUserId: principal.portalUserId, body: body.trim() }).returning())[0];
  await db().update(realEstateMessageThreads).set({ updatedAt: now() }).where(eq(realEstateMessageThreads.id, threadId)); return message;
}
export async function createDocumentRequest(scope: DataScope, membershipId: string, transactionId: string, input: { portalUserId: string; title: string; description?: string; category: string; dueAt?: string }) {
  const transaction = await findTransaction(scope, transactionId); if (!transaction) throw new Error("Transaction unavailable");
  const grant = (await db().select().from(realEstatePortalAccessGrants).where(and(eq(realEstatePortalAccessGrants.tenantId, scope.tenantId), eq(realEstatePortalAccessGrants.transactionId, transactionId), eq(realEstatePortalAccessGrants.portalUserId, input.portalUserId), isNull(realEstatePortalAccessGrants.revokedAt))).limit(1))[0];
  if (!grant) throw new Error("Portal recipient lacks transaction access");
  const request = (await db().insert(realEstateDocumentRequests).values({ id: uid("docreq"), tenantId: scope.tenantId, organizationId: transaction.organizationId, transactionId, requestedFromPortalUserId: input.portalUserId, requestedByMembershipId: membershipId, title: input.title.trim(), description: input.description?.trim() || "", category: input.category, dueAt: input.dueAt }).returning())[0];
  await db().insert(realEstateAuditEvents).values({ id: uid("audit"), tenantId: scope.tenantId, organizationId: transaction.organizationId, actorType: "membership", actorMembershipId: membershipId, action: "document_requested", resourceType: "document_request", resourceId: request.id, transactionId });
  return request;
}
export async function reviewDocumentRequest(scope: DataScope, membershipId: string, requestId: string, input: { status: "approved" | "rejected" | "cancelled"; explanation?: string }) {
  if (!["approved", "rejected", "cancelled"].includes(input.status)) throw new Error("Invalid document request status");
  if (input.status === "rejected" && !input.explanation?.trim()) throw new Error("A client-visible explanation is required");
  const request = (await db().select().from(realEstateDocumentRequests).where(and(eq(realEstateDocumentRequests.id, requestId), eq(realEstateDocumentRequests.tenantId, scope.tenantId))).limit(1))[0];
  if (!request || !await findTransaction(scope, request.transactionId)) throw new Error("Document request unavailable");
  const timestamp = now();
  const record = (await db().update(realEstateDocumentRequests).set({ status: input.status, clientExplanation: input.explanation?.trim() || null, updatedAt: timestamp, ...(input.status === "approved" && { completedAt: timestamp }), ...(input.status === "cancelled" && { cancelledAt: timestamp }) }).where(and(eq(realEstateDocumentRequests.id, requestId), eq(realEstateDocumentRequests.tenantId, scope.tenantId))).returning())[0];
  await db().insert(realEstateAuditEvents).values({ id: uid("audit"), tenantId: scope.tenantId, organizationId: request.organizationId, actorType: "membership", actorMembershipId: membershipId, action: `document_request_${input.status}`, resourceType: "document_request", resourceId: request.id, transactionId: request.transactionId });
  return record;
}
export async function listAudit(scope: DataScope, transactionId: string) {
  if (!await findTransaction(scope, transactionId)) return [];
  return db().select().from(realEstateAuditEvents).where(and(eq(realEstateAuditEvents.tenantId, scope.tenantId), eq(realEstateAuditEvents.transactionId, transactionId))).orderBy(desc(realEstateAuditEvents.occurredAt)).limit(250);
}
