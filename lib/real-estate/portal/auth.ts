import { randomBytes } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import {
  realEstateAuditEvents, realEstatePortalAccessGrants, realEstatePortalInvitations,
  realEstatePortalSessions, realEstatePortalUsers, realEstateTransactions,
} from "@/lib/db/schema";
import { db } from "../repositories";
import { safeHash } from "../integrations/crypto";
import type { DataScope } from "../access";

export const PORTAL_SESSION_COOKIE = "snaplink_portal_session";
const uid = (kind: string) => `re_${kind}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
const token = () => randomBytes(32).toString("base64url");
const now = () => new Date().toISOString();
const roles = ["buyer", "seller", "authorized_client", "external_participant"];

export interface PortalPrincipal {
  tenantId: string;
  portalUserId: string;
  email: string;
  role: string;
  sessionId: string;
}

export async function createPortalInvitation(scope: DataScope, membershipId: string, input: {
  transactionId: string; email: string; role: string; expiresInHours?: number;
}) {
  const email = input.email.trim().toLowerCase();
  if (!email || !roles.includes(input.role)) throw new Error("Valid email and portal role are required");
  const transaction = (await db().select().from(realEstateTransactions).where(and(
    eq(realEstateTransactions.id, input.transactionId), eq(realEstateTransactions.tenantId, scope.tenantId),
    isNull(realEstateTransactions.deletedAt),
  )).limit(1))[0];
  if (!transaction) throw new Error("Transaction unavailable");
  const rawToken = token();
  await db().transaction(async tx => {
    await tx.insert(realEstatePortalInvitations).values({
      id: uid("invite"), tenantId: scope.tenantId, organizationId: transaction.organizationId,
      transactionId: transaction.id, email, role: input.role, tokenHash: safeHash(rawToken),
      invitedByMembershipId: membershipId,
      expiresAt: new Date(Date.now() + Math.min(168, Math.max(1, input.expiresInHours ?? 48)) * 3_600_000).toISOString(),
    });
    await tx.insert(realEstateAuditEvents).values({
      id: uid("audit"), tenantId: scope.tenantId, organizationId: transaction.organizationId,
      actorType: "membership", actorMembershipId: membershipId, action: "portal_invitation_created",
      resourceType: "transaction", resourceId: transaction.id, transactionId: transaction.id,
      safeMetadata: { role: input.role },
    });
  });
  return { token: rawToken, expiresInHours: input.expiresInHours ?? 48 };
}

export async function redeemPortalInvitation(rawToken: string, profile: { firstName: string; lastName: string }) {
  if (!rawToken || !profile.firstName.trim() || !profile.lastName.trim()) return null;
  const timestamp = now();
  return db().transaction(async tx => {
    const invite = (await tx.select().from(realEstatePortalInvitations).where(and(
      eq(realEstatePortalInvitations.tokenHash, safeHash(rawToken)), isNull(realEstatePortalInvitations.acceptedAt),
      isNull(realEstatePortalInvitations.revokedAt), gt(realEstatePortalInvitations.expiresAt, timestamp),
    )).for("update").limit(1))[0];
    if (!invite) return null;
    let user = (await tx.select().from(realEstatePortalUsers).where(and(
      eq(realEstatePortalUsers.tenantId, invite.tenantId), eq(realEstatePortalUsers.email, invite.email),
      isNull(realEstatePortalUsers.deletedAt),
    )).limit(1))[0];
    if (!user) user = (await tx.insert(realEstatePortalUsers).values({
      id: uid("portal"), tenantId: invite.tenantId, email: invite.email,
      firstName: profile.firstName.trim(), lastName: profile.lastName.trim(), role: invite.role,
      emailVerifiedAt: timestamp,
    }).returning())[0];
    const sessionToken = token();
    const session = (await tx.insert(realEstatePortalSessions).values({
      id: uid("session"), tenantId: invite.tenantId, portalUserId: user.id,
      tokenHash: safeHash(sessionToken), expiresAt: new Date(Date.now() + 7 * 86_400_000).toISOString(),
    }).returning())[0];
    await tx.insert(realEstatePortalAccessGrants).values({
      id: uid("grant"), tenantId: invite.tenantId, organizationId: invite.organizationId,
      portalUserId: user.id, transactionId: invite.transactionId,
      permissions: ["transaction:view", "documents:view", "documents:upload_requested", "messages:view", "messages:send", "appointments:view"],
    }).onConflictDoUpdate({
      target: [realEstatePortalAccessGrants.portalUserId, realEstatePortalAccessGrants.transactionId],
      set: { revokedAt: null, permissions: ["transaction:view", "documents:view", "documents:upload_requested", "messages:view", "messages:send", "appointments:view"] },
    });
    await tx.update(realEstatePortalInvitations).set({ acceptedAt: timestamp }).where(eq(realEstatePortalInvitations.id, invite.id));
    await tx.insert(realEstateAuditEvents).values({
      id: uid("audit"), tenantId: invite.tenantId, organizationId: invite.organizationId,
      actorType: "portal_user", actorPortalUserId: user.id, action: "portal_invitation_redeemed",
      resourceType: "transaction", resourceId: invite.transactionId, transactionId: invite.transactionId,
    });
    return { sessionToken, sessionId: session.id, user };
  });
}

export async function portalPrincipalFromToken(rawToken: string | undefined): Promise<PortalPrincipal | null> {
  if (!rawToken) return null;
  const timestamp = now();
  const row = (await db().select({ session: realEstatePortalSessions, user: realEstatePortalUsers })
    .from(realEstatePortalSessions).innerJoin(realEstatePortalUsers, eq(realEstatePortalSessions.portalUserId, realEstatePortalUsers.id))
    .where(and(eq(realEstatePortalSessions.tokenHash, safeHash(rawToken)), gt(realEstatePortalSessions.expiresAt, timestamp),
      isNull(realEstatePortalSessions.revokedAt), eq(realEstatePortalUsers.isActive, true), isNull(realEstatePortalUsers.deletedAt))).limit(1))[0];
  if (!row) return null;
  await db().update(realEstatePortalSessions).set({ lastSeenAt: timestamp }).where(eq(realEstatePortalSessions.id, row.session.id));
  return { tenantId: row.user.tenantId, portalUserId: row.user.id, email: row.user.email, role: row.user.role, sessionId: row.session.id };
}

export async function portalCanAccess(principal: PortalPrincipal, transactionId: string, permission: string) {
  const timestamp = now();
  const grant = (await db().select().from(realEstatePortalAccessGrants).where(and(
    eq(realEstatePortalAccessGrants.tenantId, principal.tenantId),
    eq(realEstatePortalAccessGrants.portalUserId, principal.portalUserId),
    eq(realEstatePortalAccessGrants.transactionId, transactionId),
    isNull(realEstatePortalAccessGrants.revokedAt),
  )).limit(1))[0];
  return Boolean(grant && (!grant.expiresAt || grant.expiresAt > timestamp) && grant.permissions.includes(permission));
}

export async function revokePortalSession(sessionId: string, portalUserId: string) {
  await db().update(realEstatePortalSessions).set({ revokedAt: now() }).where(and(
    eq(realEstatePortalSessions.id, sessionId), eq(realEstatePortalSessions.portalUserId, portalUserId),
  ));
}
