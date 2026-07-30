import { get, put } from "@vercel/blob";
import { and, eq, isNull, sql } from "drizzle-orm";
import {
  realEstateAuditEvents, realEstateDocumentAccessEvents, realEstateDocumentRequests, realEstateDocuments,
  realEstateDocumentShareEvents, realEstateDocumentShareLinks, realEstateDocumentVersions,
  realEstateTransactions,
} from "@/lib/db/schema";
import { db } from "../repositories";
import type { DataScope } from "../access";
import { findTransaction } from "../transactions/repository";
import type { PortalPrincipal } from "../portal/auth";
import { portalCanAccess } from "../portal/auth";
import { safeHash } from "../integrations/crypto";
import {
  ALLOWED_DOCUMENT_TYPES, MAX_DOCUMENT_BYTES, checksum, createOpaqueToken,
  developmentScanner, hashPassword, sanitizeDocumentFilename, verifyPassword,
} from "./security";

const uid = (kind: string) => `re_${kind}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
const now = () => new Date().toISOString();

export async function uploadProfessionalDocument(scope: DataScope, membershipId: string, input: {
  transactionId: string; file: File; title?: string; category: string; visibility: string; documentId?: string;
}) {
  const transaction = await findTransaction(scope, input.transactionId);
  if (!transaction) throw new Error("Transaction unavailable");
  if (!ALLOWED_DOCUMENT_TYPES.has(input.file.type)) throw new Error("File type is not allowed");
  if (input.file.size <= 0 || input.file.size > MAX_DOCUMENT_BYTES) throw new Error("File must be between 1 byte and 20 MB");
  const bytes = await input.file.arrayBuffer();
  const safeFilename = sanitizeDocumentFilename(input.file.name);
  const scanStatus = await developmentScanner.scan(bytes, safeFilename);
  if (scanStatus === "infected") throw new Error("File did not pass security scanning");
  return db().transaction(async tx => {
    let document = input.documentId ? (await tx.select().from(realEstateDocuments).where(and(
      eq(realEstateDocuments.id, input.documentId), eq(realEstateDocuments.tenantId, scope.tenantId),
      eq(realEstateDocuments.transactionId, transaction.id), isNull(realEstateDocuments.deletedAt),
    )).limit(1))[0] : null;
    if (!document) document = (await tx.insert(realEstateDocuments).values({
      id: uid("doc"), tenantId: scope.tenantId, organizationId: transaction.organizationId,
      transactionId: transaction.id, category: input.category, title: input.title?.trim() || safeFilename,
      visibility: input.visibility, status: scanStatus === "clean" ? "available" : "pending_scan",
      uploadedByMembershipId: membershipId,
    }).returning())[0];
    const versionCount = (await tx.select({ count: sql<number>`count(*)::int` }).from(realEstateDocumentVersions).where(and(
      eq(realEstateDocumentVersions.documentId, document.id), eq(realEstateDocumentVersions.tenantId, scope.tenantId),
    )))[0]?.count ?? 0;
    const versionId = uid("version");
    const blobKey = `real-estate/${scope.tenantId}/${transaction.id}/${document.id}/${versionId}-${safeFilename}`;
    const uploaded = await put(blobKey, bytes, { access: "private", contentType: input.file.type, addRandomSuffix: false });
    const version = (await tx.insert(realEstateDocumentVersions).values({
      id: versionId, tenantId: scope.tenantId, documentId: document.id, versionNumber: versionCount + 1,
      blobKey: uploaded.pathname, originalFilename: input.file.name, safeFilename, mimeType: input.file.type,
      byteSize: input.file.size, checksum: checksum(bytes), scanStatus, uploadedByMembershipId: membershipId,
    }).returning())[0];
    await tx.update(realEstateDocuments).set({ currentVersionId: version.id, status: scanStatus === "clean" ? "available" : "pending_scan", updatedAt: now() }).where(eq(realEstateDocuments.id, document.id));
    await tx.insert(realEstateDocumentAccessEvents).values({ id: uid("access"), tenantId: scope.tenantId, documentId: document.id, versionId: version.id, actorMembershipId: membershipId, action: versionCount ? "replacement" : "upload" });
    await tx.insert(realEstateAuditEvents).values({ id: uid("audit"), tenantId: scope.tenantId, organizationId: transaction.organizationId, actorType: "membership", actorMembershipId: membershipId, action: versionCount ? "document_replaced" : "document_uploaded", resourceType: "document", resourceId: document.id, transactionId: transaction.id, safeMetadata: { category: input.category, visibility: input.visibility, scanStatus } });
    return { document: { ...document, currentVersionId: version.id }, version };
  });
}

async function documentVersion(documentId: string) {
  return (await db().select({ document: realEstateDocuments, version: realEstateDocumentVersions }).from(realEstateDocuments)
    .innerJoin(realEstateDocumentVersions, eq(realEstateDocuments.currentVersionId, realEstateDocumentVersions.id))
    .where(and(eq(realEstateDocuments.id, documentId), isNull(realEstateDocuments.deletedAt), isNull(realEstateDocumentVersions.deletedAt))).limit(1))[0] ?? null;
}

export async function downloadProfessionalDocument(scope: DataScope, membershipId: string, documentId: string) {
  const row = await documentVersion(documentId);
  if (!row || row.document.tenantId !== scope.tenantId || row.version.scanStatus !== "clean") return null;
  if (row.document.transactionId && !await findTransaction(scope, row.document.transactionId)) return null;
  const blob = await get(row.version.blobKey, { access: "private", useCache: false });
  if (!blob || blob.statusCode !== 200) return null;
  await db().insert(realEstateDocumentAccessEvents).values({ id: uid("access"), tenantId: scope.tenantId, documentId, versionId: row.version.id, actorMembershipId: membershipId, action: "download" });
  return { blob, filename: row.version.safeFilename, mimeType: row.version.mimeType };
}

export async function downloadPortalDocument(principal: PortalPrincipal, documentId: string) {
  const row = await documentVersion(documentId);
  if (!row || row.document.tenantId !== principal.tenantId || row.document.visibility === "internal" || row.version.scanStatus !== "clean" || !row.document.transactionId) return null;
  if (!await portalCanAccess(principal, row.document.transactionId, "documents:view")) return null;
  const blob = await get(row.version.blobKey, { access: "private", useCache: false });
  if (!blob || blob.statusCode !== 200) return null;
  await db().insert(realEstateDocumentAccessEvents).values({ id: uid("access"), tenantId: principal.tenantId, documentId, versionId: row.version.id, actorPortalUserId: principal.portalUserId, action: "download" });
  return { blob, filename: row.version.safeFilename, mimeType: row.version.mimeType };
}

export async function uploadRequestedPortalDocument(principal: PortalPrincipal, requestId: string, file: File) {
  const request = (await db().select().from(realEstateDocumentRequests).where(and(
    eq(realEstateDocumentRequests.id, requestId), eq(realEstateDocumentRequests.tenantId, principal.tenantId),
    eq(realEstateDocumentRequests.requestedFromPortalUserId, principal.portalUserId),
  )).limit(1))[0];
  if (!request || !["pending", "viewed", "rejected"].includes(request.status) || !await portalCanAccess(principal, request.transactionId, "documents:upload_requested")) throw new Error("Document request unavailable");
  if (!ALLOWED_DOCUMENT_TYPES.has(file.type) || file.size <= 0 || file.size > MAX_DOCUMENT_BYTES) throw new Error("File type or size is not allowed");
  const bytes = await file.arrayBuffer(), safeFilename = sanitizeDocumentFilename(file.name), scanStatus = await developmentScanner.scan(bytes, safeFilename);
  if (scanStatus === "infected") throw new Error("File did not pass security scanning");
  const transaction = (await db().select().from(realEstateTransactions).where(and(eq(realEstateTransactions.id, request.transactionId), eq(realEstateTransactions.tenantId, principal.tenantId), isNull(realEstateTransactions.deletedAt))).limit(1))[0];
  if (!transaction) throw new Error("Document request unavailable");
  return db().transaction(async tx => {
    const document = (await tx.insert(realEstateDocuments).values({ id: uid("doc"), tenantId: principal.tenantId, organizationId: request.organizationId, transactionId: request.transactionId, category: request.category, title: request.title, description: request.description, visibility: "client", status: scanStatus === "clean" ? "available" : "pending_scan", uploadedByPortalUserId: principal.portalUserId }).returning())[0];
    const versionId = uid("version"), blobKey = `real-estate/${principal.tenantId}/${request.transactionId}/${document.id}/${versionId}-${safeFilename}`;
    const uploaded = await put(blobKey, bytes, { access: "private", contentType: file.type, addRandomSuffix: false });
    const version = (await tx.insert(realEstateDocumentVersions).values({ id: versionId, tenantId: principal.tenantId, documentId: document.id, versionNumber: 1, blobKey: uploaded.pathname, originalFilename: file.name, safeFilename, mimeType: file.type, byteSize: file.size, checksum: checksum(bytes), scanStatus, uploadedByPortalUserId: principal.portalUserId }).returning())[0];
    await tx.update(realEstateDocuments).set({ currentVersionId: version.id }).where(eq(realEstateDocuments.id, document.id));
    await tx.update(realEstateDocumentRequests).set({ status: "uploaded", fulfilledDocumentId: document.id, updatedAt: now() }).where(and(eq(realEstateDocumentRequests.id, request.id), eq(realEstateDocumentRequests.requestedFromPortalUserId, principal.portalUserId)));
    await tx.insert(realEstateDocumentAccessEvents).values({ id: uid("access"), tenantId: principal.tenantId, documentId: document.id, versionId: version.id, actorPortalUserId: principal.portalUserId, action: "upload" });
    await tx.insert(realEstateAuditEvents).values({ id: uid("audit"), tenantId: principal.tenantId, organizationId: request.organizationId, actorType: "portal_user", actorPortalUserId: principal.portalUserId, action: "document_request_fulfilled", resourceType: "document_request", resourceId: request.id, transactionId: request.transactionId, safeMetadata: { documentId: document.id, scanStatus } });
    return { document, version };
  });
}

export async function createDocumentShare(scope: DataScope, membershipId: string, documentId: string, input: {
  expiresInHours?: number; password?: string; maxDownloads?: number; oneTime?: boolean; downloadAllowed?: boolean; recipientEmail?: string;
}) {
  const row = await documentVersion(documentId);
  if (!row || row.document.tenantId !== scope.tenantId || (row.document.transactionId && !await findTransaction(scope, row.document.transactionId))) throw new Error("Document unavailable");
  const rawToken = createOpaqueToken();
  const share = (await db().insert(realEstateDocumentShareLinks).values({
    id: uid("share"), tenantId: scope.tenantId, documentId, tokenHash: safeHash(rawToken),
    passwordHash: input.password ? hashPassword(input.password) : null,
    recipientEmailHash: input.recipientEmail ? safeHash(input.recipientEmail.trim().toLowerCase()) : null,
    expiresAt: new Date(Date.now() + Math.min(720, Math.max(1, input.expiresInHours ?? 24)) * 3_600_000).toISOString(),
    maxDownloads: input.oneTime ? 1 : input.maxDownloads, oneTime: Boolean(input.oneTime),
    downloadAllowed: input.downloadAllowed !== false, createdByMembershipId: membershipId,
  }).returning())[0];
  return { share, token: rawToken };
}

export async function accessDocumentShare(rawToken: string, input: { password?: string; recipientEmail?: string; download?: boolean }) {
  const hash = safeHash(rawToken);
  return db().transaction(async tx => {
    const share = (await tx.select().from(realEstateDocumentShareLinks).where(eq(realEstateDocumentShareLinks.tokenHash, hash)).for("update").limit(1))[0];
    const generic = () => null;
    if (!share || share.revokedAt || share.expiresAt <= now()) return generic();
    if (share.passwordHash && !verifyPassword(input.password || "", share.passwordHash)) {
      await tx.insert(realEstateDocumentShareEvents).values({ id: uid("shareevt"), shareLinkId: share.id, action: "failure", safeMetadata: { reason: "credential" } });
      return generic();
    }
    if (share.recipientEmailHash && safeHash((input.recipientEmail || "").trim().toLowerCase()) !== share.recipientEmailHash) return generic();
    if (input.download && !share.downloadAllowed) return generic();
    if (share.maxDownloads !== null && input.download && share.downloadCount >= share.maxDownloads) return generic();
    const row = (await tx.select({ document: realEstateDocuments, version: realEstateDocumentVersions }).from(realEstateDocuments)
      .innerJoin(realEstateDocumentVersions, eq(realEstateDocuments.currentVersionId, realEstateDocumentVersions.id))
      .where(and(eq(realEstateDocuments.id, share.documentId), isNull(realEstateDocuments.deletedAt), isNull(realEstateDocumentVersions.deletedAt))).limit(1))[0];
    if (!row || row.version.scanStatus !== "clean") return generic();
    if (input.download) await tx.update(realEstateDocumentShareLinks).set({ downloadCount: share.downloadCount + 1 }).where(and(eq(realEstateDocumentShareLinks.id, share.id), eq(realEstateDocumentShareLinks.downloadCount, share.downloadCount)));
    await tx.insert(realEstateDocumentShareEvents).values({ id: uid("shareevt"), shareLinkId: share.id, action: input.download ? "download" : "preview" });
    const blob = await get(row.version.blobKey, { access: "private", useCache: false });
    return blob?.statusCode === 200 ? { blob, filename: row.version.safeFilename, mimeType: row.version.mimeType, downloadAllowed: share.downloadAllowed } : null;
  });
}
