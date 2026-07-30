import { and, asc, desc, eq, ilike, isNull, lte, or, sql } from "drizzle-orm";
import {
  realEstateAgents, realEstateAnalyticsEvents, realEstateAutomationRuns, realEstateBuyers,
  realEstateAutomationWorkflows, realEstateCampaigns, realEstateCommunications,
  realEstateCommunicationPreferences, realEstateCommunicationTemplates,
  realEstateLeads, realEstateNotifications, realEstateNurtureEnrollments,
  realEstateOpenHouseAttendees, realEstateQrLinks, realEstateQrScans, realEstateSellers,
  realEstateReminders, realEstateTasks,
} from "@/lib/db/schema";
import { db } from "./repositories";
import type { DataScope } from "./access";
import { isAgentScope } from "./access";
import { canCommunicate } from "./communications/consent";
import { loadIntegrationConfig } from "./integrations/config";
import { ProductionEmailProvider, ProductionSmsProvider } from "./integrations/providers";
import { renderTemplate, TEMPLATE_TYPES, validateTemplate } from "./communications/templates";
import type { CommunicationChannel } from "./communications/types";
import { isSuppressed } from "./integrations/deliverability";

const newId = (kind: string) => `re_${kind}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`;
const now = () => new Date().toISOString();

export async function listCommunicationHistory(scope: DataScope, options: { search?: string; status?: string; channel?: string; page?: number; pageSize?: number } = {}) {
  const page = Math.max(1, options.page || 1), pageSize = Math.min(100, Math.max(1, options.pageSize || 20));
  const where = and(eq(realEstateCommunications.tenantId, scope.tenantId),
    options.status ? eq(realEstateCommunications.status, options.status) : undefined,
    options.channel ? eq(realEstateCommunications.channel, options.channel) : undefined,
    options.search ? or(ilike(realEstateCommunications.recipient, `%${options.search}%`), ilike(realEstateCommunications.subject, `%${options.search}%`), ilike(realEstateCommunications.body, `%${options.search}%`)) : undefined);
  const [records, count] = await Promise.all([
    db().select().from(realEstateCommunications).where(where).orderBy(desc(realEstateCommunications.createdAt)).limit(pageSize).offset((page - 1) * pageSize),
    db().select({ count: sql<number>`count(*)::int` }).from(realEstateCommunications).where(where),
  ]);
  return { records, total: count[0]?.count || 0, page, pageSize };
}

export async function findPreference(tenantId: string, channel: CommunicationChannel, recipient: string) {
  return (await db().select().from(realEstateCommunicationPreferences).where(and(eq(realEstateCommunicationPreferences.tenantId, tenantId), channel === "email" ? eq(realEstateCommunicationPreferences.email, recipient.toLowerCase()) : eq(realEstateCommunicationPreferences.phone, recipient))).limit(1))[0] ?? null;
}
export async function savePreference(scope: DataScope, input: Record<string, unknown>) {
  const email = input.email ? String(input.email).toLowerCase() : null, phone = input.phone ? String(input.phone) : null;
  const existing = (await db().select().from(realEstateCommunicationPreferences).where(and(eq(realEstateCommunicationPreferences.tenantId, scope.tenantId), email ? eq(realEstateCommunicationPreferences.email, email) : eq(realEstateCommunicationPreferences.phone, phone || ""))).limit(1))[0];
  const values = { contactType: String(input.contactType || "lead"), contactId: input.contactId ? String(input.contactId) : null, email, phone, emailOptIn: input.emailOptIn === true, smsOptIn: input.smsOptIn === true, marketingConsent: input.marketingConsent === true, transactionalConsent: input.transactionalConsent !== false, language: input.language === "es" ? "es" : "en", unsubscribedAt: input.unsubscribe === true ? now() : null, smsStoppedAt: input.stop === true ? now() : null, updatedAt: now() };
  if (existing) return (await db().update(realEstateCommunicationPreferences).set(values).where(and(eq(realEstateCommunicationPreferences.id, existing.id), eq(realEstateCommunicationPreferences.tenantId, scope.tenantId))).returning())[0];
  return (await db().insert(realEstateCommunicationPreferences).values({ id: newId("preference"), tenantId: scope.tenantId, ...values }).returning())[0];
}

export async function createCommunication(scope: DataScope, membershipId: string, input: Record<string, unknown>) {
  const channel = String(input.channel) as CommunicationChannel;
  const recipient = String(input.recipient || "").trim();
  const purpose = input.purpose === "marketing" ? "marketing" : "transactional";
  const preference = await findPreference(scope.tenantId, channel, recipient);
  const allowed = canCommunicate(preference, channel, purpose) && !await isSuppressed(scope.tenantId, channel, recipient);
  const scheduledAt = input.scheduledAt ? String(input.scheduledAt) : null;
  const status = input.status === "draft" ? "draft" : !allowed ? "blocked" : scheduledAt ? "scheduled" : "queued";
  const communicationId = newId("communication"), idempotencyKey = String(input.idempotencyKey || `communication:${communicationId}`);
  return (await db().insert(realEstateCommunications).values({
    id: communicationId, tenantId: scope.tenantId, senderMembershipId: membershipId,
    sender: String(input.sender || ""), entityType: String(input.entityType || "manual"),
    entityId: String(input.entityId || membershipId), channel, recipient,
    provider: "pending", idempotencyKey, templateId: input.templateId ? String(input.templateId) : null,
    subject: input.subject ? String(input.subject) : null, body: String(input.body || ""),
    renderedContent: { subject: input.subject || null, body: input.body || "" }, status, scheduledAt,
    propertyId: input.propertyId ? String(input.propertyId) : null, leadId: input.leadId ? String(input.leadId) : null,
    buyerId: input.buyerId ? String(input.buyerId) : null, sellerId: input.sellerId ? String(input.sellerId) : null,
    campaignId: input.campaignId ? String(input.campaignId) : null, showingId: input.showingId ? String(input.showingId) : null,
    openHouseId: input.openHouseId ? String(input.openHouseId) : null,
    error: allowed ? null : "Communication blocked by consent preferences",
  }).onConflictDoNothing().returning())[0] ?? (await db().select().from(realEstateCommunications).where(and(eq(realEstateCommunications.tenantId, scope.tenantId), eq(realEstateCommunications.idempotencyKey, idempotencyKey))).limit(1))[0];
}

export async function dispatchCommunication(scope: DataScope, communicationId: string) {
  const message = (await db().select().from(realEstateCommunications).where(and(eq(realEstateCommunications.id, communicationId), eq(realEstateCommunications.tenantId, scope.tenantId))).limit(1))[0];
  if (!message || !["queued", "scheduled", "failed"].includes(message.status)) return null;
  const preference = await findPreference(scope.tenantId, message.channel as CommunicationChannel, message.recipient);
  if (!canCommunicate(preference, message.channel as CommunicationChannel, "transactional") || await isSuppressed(scope.tenantId, message.channel, message.recipient)) return (await db().update(realEstateCommunications).set({ status: "blocked", error: "Communication blocked by consent or suppression", updatedAt: now() }).where(and(eq(realEstateCommunications.id, communicationId), eq(realEstateCommunications.tenantId, scope.tenantId))).returning())[0];
  const config = loadIntegrationConfig(), provider = message.channel === "email" ? new ProductionEmailProvider(config.emailProvider === "sendgrid" ? "sendgrid" : "resend") : new ProductionSmsProvider();
  if ((message.channel === "email" && ["disabled"].includes(config.emailProvider)) || (message.channel === "sms" && ["disabled"].includes(config.smsProvider))) return (await db().update(realEstateCommunications).set({ provider: "disabled", status: "failed", error: "Provider is disabled", updatedAt: now() }).where(and(eq(realEstateCommunications.id, communicationId), eq(realEstateCommunications.tenantId, scope.tenantId))).returning())[0];
  const result = await provider.send({ recipient: message.recipient, subject: message.subject || undefined, html: message.body, text: message.body.replace(/<[^>]*>/g, " "), idempotencyKey: message.idempotencyKey || `communication:${message.id}`, purpose: message.campaignId ? "marketing" : "transactional" });
  return (await db().update(realEstateCommunications).set({ provider: result.provider, providerMessageId: result.providerMessageId || null, status: result.internalStatus, sentAt: result.success ? now() : null, error: result.safeErrorMessage || null, updatedAt: now() }).where(and(eq(realEstateCommunications.id, communicationId), eq(realEstateCommunications.tenantId, scope.tenantId))).returning())[0];
}

export async function listTemplates(scope: DataScope) { return db().select().from(realEstateCommunicationTemplates).where(and(eq(realEstateCommunicationTemplates.tenantId, scope.tenantId), isNull(realEstateCommunicationTemplates.deletedAt))).orderBy(asc(realEstateCommunicationTemplates.name)); }
export async function saveTemplate(scope: DataScope, membershipId: string, input: Record<string, unknown>) {
  const subject = String(input.subject || ""), body = String(input.body || "");
  if (!TEMPLATE_TYPES.includes(String(input.templateType) as typeof TEMPLATE_TYPES[number])) throw new Error("Unsupported template type");
  if (!["en", "es"].includes(String(input.language))) throw new Error("Template language must be en or es");
  if (!["email", "sms"].includes(String(input.channel))) throw new Error("Template channel must be email or sms");
  const validation = validateTemplate(`${subject}\n${body}`); if (!validation.valid) throw new Error(`Unknown variables: ${validation.unknown.join(", ")}`);
  return (await db().insert(realEstateCommunicationTemplates).values({ id: newId("template"), tenantId: scope.tenantId, name: String(input.name), templateType: String(input.templateType), language: input.language === "es" ? "es" : "en", channel: String(input.channel), subject: subject || null, body, createdByMembershipId: membershipId }).returning())[0];
}
export async function templateAction(scope: DataScope, templateId: string, action: string) {
  const existing = (await db().select().from(realEstateCommunicationTemplates).where(and(eq(realEstateCommunicationTemplates.id, templateId), eq(realEstateCommunicationTemplates.tenantId, scope.tenantId), isNull(realEstateCommunicationTemplates.deletedAt))).limit(1))[0];
  if (!existing) return null;
  if (action === "duplicate") return (await db().insert(realEstateCommunicationTemplates).values({ ...existing, id: newId("template"), name: `${existing.name} Copy`, createdAt: now(), updatedAt: now() }).returning())[0];
  const patch = action === "archive" ? { deletedAt: now() } : action === "activate" ? { isActive: true, updatedAt: now() } : action === "deactivate" ? { isActive: false, updatedAt: now() } : null;
  return patch ? (await db().update(realEstateCommunicationTemplates).set(patch).where(and(eq(realEstateCommunicationTemplates.id, templateId), eq(realEstateCommunicationTemplates.tenantId, scope.tenantId))).returning())[0] : null;
}
export function previewTemplate(subject: string, body: string, values: Record<string, string | number | undefined>) { return { subject: renderTemplate(subject, values), body: renderTemplate(body, values) }; }

export async function listWorkflows(scope: DataScope) { return db().select().from(realEstateAutomationWorkflows).where(and(eq(realEstateAutomationWorkflows.tenantId, scope.tenantId), isNull(realEstateAutomationWorkflows.deletedAt))).orderBy(desc(realEstateAutomationWorkflows.updatedAt)); }
export async function listWorkflowRuns(scope: DataScope) { return db().select().from(realEstateAutomationRuns).where(eq(realEstateAutomationRuns.tenantId, scope.tenantId)).orderBy(desc(realEstateAutomationRuns.updatedAt)).limit(100); }
export async function saveWorkflow(scope: DataScope, membershipId: string, input: Record<string, unknown>) {
  return (await db().insert(realEstateAutomationWorkflows).values({ id: newId("workflow"), tenantId: scope.tenantId, name: String(input.name), trigger: String(input.trigger), status: String(input.status || "active"), steps: Array.isArray(input.steps) ? input.steps as Array<Record<string, unknown>> : [], createdByMembershipId: membershipId }).returning())[0];
}
export async function startWorkflow(scope: DataScope, workflowId: string, entityType: string, entityId: string) {
  const workflow = (await db().select().from(realEstateAutomationWorkflows).where(and(eq(realEstateAutomationWorkflows.id, workflowId), eq(realEstateAutomationWorkflows.tenantId, scope.tenantId), eq(realEstateAutomationWorkflows.status, "active"), isNull(realEstateAutomationWorkflows.deletedAt))).limit(1))[0];
  if (!workflow) return null;
  return (await db().insert(realEstateAutomationRuns).values({ id: newId("run"), tenantId: scope.tenantId, workflowId, entityType, entityId, status: "queued", history: [{ at: now(), action: "started" }] }).onConflictDoNothing().returning())[0] ?? null;
}
export async function runAction(scope: DataScope, runId: string, action: "pause" | "resume" | "cancel" | "retry") {
  const status = action === "pause" ? "paused" : action === "cancel" ? "cancelled" : "queued";
  return (await db().update(realEstateAutomationRuns).set({ status, error: action === "retry" ? null : undefined, updatedAt: now() }).where(and(eq(realEstateAutomationRuns.id, runId), eq(realEstateAutomationRuns.tenantId, scope.tenantId))).returning())[0] ?? null;
}
export async function triggerWorkflows(scope: DataScope, trigger: string, entityType: string, entityId: string) {
  const workflows = await db().select().from(realEstateAutomationWorkflows).where(and(eq(realEstateAutomationWorkflows.tenantId, scope.tenantId), eq(realEstateAutomationWorkflows.trigger, trigger), eq(realEstateAutomationWorkflows.status, "active"), isNull(realEstateAutomationWorkflows.deletedAt)));
  const runs = []; for (const workflow of workflows) { const run = await startWorkflow(scope, workflow.id, entityType, entityId); if (run) runs.push(run); } return runs;
}
export async function executeWorkflowRun(scope: DataScope, membershipId: string, runId: string) {
  const run = (await db().select().from(realEstateAutomationRuns).where(and(eq(realEstateAutomationRuns.id, runId), eq(realEstateAutomationRuns.tenantId, scope.tenantId))).limit(1))[0];
  if (!run || !["queued", "running"].includes(run.status)) return null;
  const workflow = (await db().select().from(realEstateAutomationWorkflows).where(and(eq(realEstateAutomationWorkflows.id, run.workflowId), eq(realEstateAutomationWorkflows.tenantId, scope.tenantId))).limit(1))[0];
  if (!workflow) return null;
  const step = workflow.steps[run.currentStep]; if (!step) return (await db().update(realEstateAutomationRuns).set({ status: "completed", updatedAt: now(), history: [...run.history, { at: now(), action: "completed" }] }).where(and(eq(realEstateAutomationRuns.id, runId), eq(realEstateAutomationRuns.tenantId, scope.tenantId))).returning())[0];
  const type = String(step.type);
  try {
    if (type === "wait") {
      const next = new Date(Date.now() + Number(step.minutes || 0) * 60000).toISOString();
      return (await db().update(realEstateAutomationRuns).set({ status: "waiting", nextRunAt: next, currentStep: run.currentStep + 1, updatedAt: now(), history: [...run.history, { at: now(), action: "wait", until: next }] }).where(and(eq(realEstateAutomationRuns.id, runId), eq(realEstateAutomationRuns.tenantId, scope.tenantId))).returning())[0];
    }
    if (type === "send_email" || type === "send_sms") await createCommunication(scope, membershipId, { channel: type === "send_email" ? "email" : "sms", recipient: step.recipient, subject: step.subject, body: step.body || "", purpose: step.purpose || "transactional", entityType: run.entityType, entityId: run.entityId });
    else if (type === "create_task") await db().insert(realEstateTasks).values({ id: newId("task"), tenantId: scope.tenantId, assignedAgentId: isAgentScope(scope) ? scope.agentId : step.assignedAgentId ? String(step.assignedAgentId) : null, title: String(step.title || workflow.name), dueAt: step.dueAt ? String(step.dueAt) : null });
    else if (type === "update_lead_stage") await db().update(realEstateLeads).set({ stage: String(step.stage), updatedAt: now() }).where(and(eq(realEstateLeads.id, run.entityId), eq(realEstateLeads.tenantId, scope.tenantId), isAgentScope(scope) ? eq(realEstateLeads.assignedAgentId, scope.agentId) : undefined));
    else if (type === "assign_agent") await db().update(realEstateLeads).set({ assignedAgentId: isAgentScope(scope) ? scope.agentId : String(step.agentId), updatedAt: now() }).where(and(eq(realEstateLeads.id, run.entityId), eq(realEstateLeads.tenantId, scope.tenantId)));
    else throw new Error(`Unsupported workflow step: ${type}`);
    return (await db().update(realEstateAutomationRuns).set({ status: "queued", currentStep: run.currentStep + 1, updatedAt: now(), history: [...run.history, { at: now(), action: type }] }).where(and(eq(realEstateAutomationRuns.id, runId), eq(realEstateAutomationRuns.tenantId, scope.tenantId))).returning())[0];
  } catch (error) {
    return (await db().update(realEstateAutomationRuns).set({ status: "failed", error: error instanceof Error ? error.message : "Execution failed", updatedAt: now(), history: [...run.history, { at: now(), action: "failed" }] }).where(and(eq(realEstateAutomationRuns.id, runId), eq(realEstateAutomationRuns.tenantId, scope.tenantId))).returning())[0];
  }
}

export async function listNurture(scope: DataScope) { return db().select().from(realEstateNurtureEnrollments).where(and(eq(realEstateNurtureEnrollments.tenantId, scope.tenantId), isNull(realEstateNurtureEnrollments.deletedAt), isAgentScope(scope) ? eq(realEstateNurtureEnrollments.assignedAgentId, scope.agentId) : undefined)); }
export async function enrollNurture(scope: DataScope, input: Record<string, unknown>) {
  const leadId = String(input.leadId), lead = (await db().select().from(realEstateLeads).where(and(eq(realEstateLeads.id, leadId), eq(realEstateLeads.tenantId, scope.tenantId), isNull(realEstateLeads.deletedAt), isAgentScope(scope) ? eq(realEstateLeads.assignedAgentId, scope.agentId) : undefined)).limit(1))[0];
  if (!lead) return null;
  return (await db().insert(realEstateNurtureEnrollments).values({ id: newId("nurture"), tenantId: scope.tenantId, leadId, assignedAgentId: lead.assignedAgentId, sequenceType: String(input.sequenceType), nextActionAt: input.nextActionAt ? String(input.nextActionAt) : null }).onConflictDoNothing().returning())[0] ?? null;
}
export async function nurtureAction(scope: DataScope, enrollmentId: string, action: "start" | "pause" | "stop") {
  const status = action === "start" ? "active" : action === "pause" ? "paused" : "stopped";
  return (await db().update(realEstateNurtureEnrollments).set({ status, updatedAt: now(), nextActionAt: action === "start" ? now() : undefined }).where(and(eq(realEstateNurtureEnrollments.id, enrollmentId), eq(realEstateNurtureEnrollments.tenantId, scope.tenantId), isNull(realEstateNurtureEnrollments.deletedAt), isAgentScope(scope) ? eq(realEstateNurtureEnrollments.assignedAgentId, scope.agentId) : undefined)).returning())[0] ?? null;
}

export async function listNotifications(scope: DataScope, membershipId: string, filter?: string) { return db().select().from(realEstateNotifications).where(and(eq(realEstateNotifications.tenantId, scope.tenantId), or(eq(realEstateNotifications.membershipId, membershipId), isNull(realEstateNotifications.membershipId)), filter === "unread" ? isNull(realEstateNotifications.readAt) : filter === "archived" ? sql`${realEstateNotifications.archivedAt} is not null` : isNull(realEstateNotifications.archivedAt))).orderBy(desc(realEstateNotifications.createdAt)); }
export async function notificationAction(scope: DataScope, membershipId: string, notificationId: string, action: "read" | "unread" | "archive") {
  const patch = action === "read" ? { readAt: now() } : action === "unread" ? { readAt: null } : { archivedAt: now() };
  return (await db().update(realEstateNotifications).set(patch).where(and(eq(realEstateNotifications.id, notificationId), eq(realEstateNotifications.tenantId, scope.tenantId), or(eq(realEstateNotifications.membershipId, membershipId), isNull(realEstateNotifications.membershipId)))).returning())[0] ?? null;
}

export async function processDueReminders(scope: DataScope) {
  const due = await db().select().from(realEstateReminders).where(and(eq(realEstateReminders.tenantId, scope.tenantId), eq(realEstateReminders.status, "scheduled"), lte(realEstateReminders.remindAt, now()), isNull(realEstateReminders.deletedAt), isAgentScope(scope) ? eq(realEstateReminders.assignedAgentId, scope.agentId) : undefined)).limit(100);
  for (const reminder of due) {
    await db().transaction(async tx => {
      await tx.update(realEstateReminders).set({ status: "completed", completedAt: now(), updatedAt: now() }).where(and(eq(realEstateReminders.id, reminder.id), eq(realEstateReminders.tenantId, scope.tenantId), eq(realEstateReminders.status, "scheduled")));
      await tx.insert(realEstateNotifications).values({ id: newId("notification"), tenantId: scope.tenantId, type: "reminder", priority: "normal", title: reminder.title, message: `${reminder.entityType} reminder is due`, href: `/real-estate/${reminder.entityType}` });
    });
  }
  return due.length;
}
export async function reminderAction(scope: DataScope, reminderId: string, action: "cancel" | "complete" | "retry") {
  const patch = action === "cancel" ? { status: "cancelled", updatedAt: now() } : action === "complete" ? { status: "completed", completedAt: now(), updatedAt: now() } : { status: "scheduled", retryCount: sql`${realEstateReminders.retryCount} + 1`, updatedAt: now() };
  return (await db().update(realEstateReminders).set(patch).where(and(eq(realEstateReminders.id, reminderId), eq(realEstateReminders.tenantId, scope.tenantId), isNull(realEstateReminders.deletedAt), isAgentScope(scope) ? eq(realEstateReminders.assignedAgentId, scope.agentId) : undefined)).returning())[0] ?? null;
}

export async function createQrLink(scope: DataScope, input: Record<string, unknown>) { return (await db().insert(realEstateQrLinks).values({ id: newId("qr"), tenantId: scope.tenantId, destinationType: String(input.destinationType), destinationId: String(input.destinationId), destinationUrl: String(input.destinationUrl), campaignId: input.campaignId ? String(input.campaignId) : null }).onConflictDoNothing().returning())[0] ?? null; }
export async function trackQrScan(qrId: string, input: Record<string, unknown>) {
  const link = (await db().select().from(realEstateQrLinks).where(and(eq(realEstateQrLinks.id, qrId), eq(realEstateQrLinks.isActive, true), isNull(realEstateQrLinks.deletedAt))).limit(1))[0]; if (!link) return null;
  const scan = (await db().insert(realEstateQrScans).values({ id: newId("scan"), tenantId: link.tenantId, qrLinkId: link.id, campaignId: link.campaignId, anonymousSessionId: input.anonymousSessionId ? String(input.anonymousSessionId) : null, device: input.device ? String(input.device) : null, referrer: input.referrer ? String(input.referrer) : null }).returning())[0];
  await db().insert(realEstateAnalyticsEvents).values({ id: newId("event"), tenantId: link.tenantId, eventName: "qr_scan", entityType: link.destinationType, entityId: link.destinationId, anonymousId: scan.anonymousSessionId, source: "qr", metadata: { qrLinkId: link.id, campaignId: link.campaignId, device: scan.device } });
  return { scan, destinationUrl: link.destinationUrl };
}

export async function analyticsSummary(scope: DataScope) {
  const group = async (table: typeof realEstateAnalyticsEvents, column: typeof realEstateAnalyticsEvents.eventName) => db().select({ key: column, count: sql<number>`count(*)::int` }).from(table).where(eq(table.tenantId, scope.tenantId)).groupBy(column);
  const [events, communications, campaigns, qrScans, automation] = await Promise.all([
    group(realEstateAnalyticsEvents, realEstateAnalyticsEvents.eventName),
    db().select({ key: realEstateCommunications.status, count: sql<number>`count(*)::int` }).from(realEstateCommunications).where(eq(realEstateCommunications.tenantId, scope.tenantId)).groupBy(realEstateCommunications.status),
    db().select({ key: realEstateCampaigns.status, count: sql<number>`count(*)::int` }).from(realEstateCampaigns).where(and(eq(realEstateCampaigns.tenantId, scope.tenantId), isNull(realEstateCampaigns.deletedAt))).groupBy(realEstateCampaigns.status),
    db().select({ count: sql<number>`count(*)::int` }).from(realEstateQrScans).where(eq(realEstateQrScans.tenantId, scope.tenantId)),
    db().select({ key: realEstateAutomationRuns.status, count: sql<number>`count(*)::int` }).from(realEstateAutomationRuns).where(eq(realEstateAutomationRuns.tenantId, scope.tenantId)).groupBy(realEstateAutomationRuns.status),
  ]);
  return { events, communications, campaigns, qrScans: qrScans[0]?.count || 0, automation };
}

export async function agentPerformance(scope: DataScope) {
  return db().select({ id: realEstateAgents.id, name: sql<string>`${realEstateAgents.firstName} || ' ' || ${realEstateAgents.lastName}`, activeListings: sql<number>`(select count(*)::int from real_estate_properties p where p.tenant_id=${scope.tenantId} and p.listing_agent_id=${realEstateAgents.id} and p.deleted_at is null)`, assignedLeads: sql<number>`(select count(*)::int from real_estate_leads l where l.tenant_id=${scope.tenantId} and l.assigned_agent_id=${realEstateAgents.id} and l.deleted_at is null)`, convertedLeads: sql<number>`(select count(*)::int from real_estate_leads l where l.tenant_id=${scope.tenantId} and l.assigned_agent_id=${realEstateAgents.id} and l.stage='closed' and l.deleted_at is null)`, averageResponseMinutes: sql<number>`coalesce((select avg(extract(epoch from (l.updated_at-l.created_at))/60)::int from real_estate_leads l where l.tenant_id=${scope.tenantId} and l.assigned_agent_id=${realEstateAgents.id}),0)`, appointments: sql<number>`(select count(*)::int from real_estate_appointments a where a.tenant_id=${scope.tenantId} and a.assigned_agent_id=${realEstateAgents.id} and a.deleted_at is null)`, showings: sql<number>`(select count(*)::int from real_estate_showings s where s.tenant_id=${scope.tenantId} and s.assigned_agent_id=${realEstateAgents.id} and s.deleted_at is null)`, openHouses: sql<number>`(select count(*)::int from real_estate_open_houses o where o.tenant_id=${scope.tenantId} and o.assigned_agent_id=${realEstateAgents.id} and o.deleted_at is null)`, tasksCompleted: sql<number>`(select count(*)::int from real_estate_tasks t where t.tenant_id=${scope.tenantId} and t.assigned_agent_id=${realEstateAgents.id} and t.status='completed' and t.deleted_at is null)`, communicationDelivery: sql<number>`(select count(*)::int from real_estate_communications c where c.tenant_id=${scope.tenantId} and c.sender_membership_id in (select m.id from real_estate_memberships m where m.agent_id=${realEstateAgents.id}) and c.status in ('sent','delivered'))` }).from(realEstateAgents).where(and(eq(realEstateAgents.tenantId, scope.tenantId), isNull(realEstateAgents.deletedAt), isAgentScope(scope) ? eq(realEstateAgents.id, scope.agentId) : undefined));
}

export async function executeCampaign(scope: DataScope, membershipId: string, campaignId: string, action: "launch" | "pause" | "resume" | "cancel" | "test", testRecipient?: string) {
  const campaign = (await db().select().from(realEstateCampaigns).where(and(eq(realEstateCampaigns.id, campaignId), eq(realEstateCampaigns.tenantId, scope.tenantId), isNull(realEstateCampaigns.deletedAt))).limit(1))[0];
  if (!campaign) return null;
  if (action !== "launch" && action !== "test") return (await db().update(realEstateCampaigns).set({ status: action === "resume" ? "active" : action === "pause" ? "paused" : "cancelled", updatedAt: now() }).where(and(eq(realEstateCampaigns.id, campaignId), eq(realEstateCampaigns.tenantId, scope.tenantId))).returning())[0];
  const recipients: Array<{ email?: string | null; phone?: string | null; id: string }> = [];
  if (action === "test") recipients.push({ email: testRecipient, id: "test" });
  else if (campaign.audienceType === "buyers") recipients.push(...await db().select({ id: realEstateBuyers.id, email: realEstateBuyers.email, phone: realEstateBuyers.phone }).from(realEstateBuyers).where(and(eq(realEstateBuyers.tenantId, scope.tenantId), isNull(realEstateBuyers.deletedAt), isAgentScope(scope) ? eq(realEstateBuyers.assignedAgentId, scope.agentId) : undefined)));
  else if (campaign.audienceType === "sellers") recipients.push(...await db().select({ id: realEstateSellers.id, email: realEstateSellers.email, phone: realEstateSellers.phone }).from(realEstateSellers).where(and(eq(realEstateSellers.tenantId, scope.tenantId), isNull(realEstateSellers.deletedAt), isAgentScope(scope) ? eq(realEstateSellers.assignedAgentId, scope.agentId) : undefined)));
  else if (campaign.audienceType === "open_house_attendees") recipients.push(...await db().select({ id: realEstateOpenHouseAttendees.id, email: realEstateOpenHouseAttendees.email, phone: realEstateOpenHouseAttendees.phone }).from(realEstateOpenHouseAttendees).where(and(eq(realEstateOpenHouseAttendees.tenantId, scope.tenantId), eq(realEstateOpenHouseAttendees.consent, true))));
  else recipients.push(...await db().select({ id: realEstateLeads.id, email: realEstateLeads.email, phone: realEstateLeads.phone }).from(realEstateLeads).where(and(eq(realEstateLeads.tenantId, scope.tenantId), isNull(realEstateLeads.deletedAt), isAgentScope(scope) ? eq(realEstateLeads.assignedAgentId, scope.agentId) : undefined)));
  const unique = new Set<string>(); let queued = 0;
  for (const recipient of recipients) for (const channel of campaign.channels) {
    const address = channel === "email" ? recipient.email : recipient.phone;
    if (!address || unique.has(`${channel}:${address}`)) continue; unique.add(`${channel}:${address}`);
    const message = await createCommunication(scope, membershipId, { channel, recipient: address, purpose: "marketing", entityType: "campaign", entityId: campaign.id, campaignId: campaign.id, subject: campaign.content.subject || campaign.name, body: campaign.content.body || "", status: action === "test" ? "queued" : undefined });
    if (message.status !== "blocked") queued++;
  }
  if (action === "launch") await db().update(realEstateCampaigns).set({ status: "active", launchedAt: now(), updatedAt: now() }).where(and(eq(realEstateCampaigns.id, campaignId), eq(realEstateCampaigns.tenantId, scope.tenantId)));
  await db().insert(realEstateAnalyticsEvents).values({ id: newId("event"), tenantId: scope.tenantId, eventName: action === "test" ? "campaign_test" : "campaign_launched", entityType: "campaign", entityId: campaignId, source: "automation", metadata: { queued, audienceType: campaign.audienceType } });
  return { campaign, queued, duplicatesPrevented: recipients.length * campaign.channels.length - unique.size };
}
