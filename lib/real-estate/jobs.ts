import { and, asc, eq, inArray, isNull, lte, or, sql } from "drizzle-orm";
import { realEstateAgents, realEstateBrokerages, realEstateCalendarConnections, realEstateDeadLetters, realEstateJobAttempts, realEstateJobLocks, realEstateJobs, realEstateMemberships, realEstateOffers } from "@/lib/db/schema";
import { db } from "./repositories";
import type { DataScope } from "./access";
import { dispatchCommunication, executeCampaign, executeWorkflowRun, processDueReminders } from "./phase5-repositories";
import { processWebhookEvent } from "./integrations/deliverability";
import { synchronizeCalendarConnection, synchronizeCalendarEvent } from "./integrations/calendar";
import { executeAiRequest } from "./ai/service";
import { runAiRetention } from "./ai/operations";
import { deliverOutboundWebhook } from "./enterprise/webhooks";
export const JOB_TYPES = ["communication.send","communication.webhook.process","campaign.expand_audience","campaign.send_recipient","automation.start","automation.execute_step","reminder.process","calendar.sync.connection","calendar.sync.event","calendar.delete.event","analytics.rollup","deliverability.rollup","transaction.milestone.reminder","offer.expire","portal.notification.send","document.scan","document_request.reminder","ai.property_description.generate","ai.lead_score.calculate","ai.lead_summary.generate","ai.conversation_summary.generate","ai.transaction_summary.generate","ai.document.classify","ai.document.extract","ai.offer.compare","ai.inspection.summarize","ai.tasks.suggest","ai.follow_up.suggest","ai.brokerage_insights.generate","ai.market_insights.generate","ai.usage.rollup","ai.retention.cleanup","enterprise.webhook.deliver","enterprise.transfer.process","enterprise.metrics.rollup","enterprise.backup.verify"] as const;
export type RealEstateJobType = typeof JOB_TYPES[number];
const id = (kind: string) => `re_${kind}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`, now = () => new Date().toISOString();
const required: Partial<Record<RealEstateJobType, string[]>> = { "communication.send": ["communicationId"], "campaign.expand_audience": ["campaignId"], "automation.execute_step": ["runId"], "calendar.sync.connection": ["connectionId"], "calendar.sync.event": ["connectionId","eventType","eventId"], "calendar.delete.event": ["connectionId","eventType","eventId"], "communication.webhook.process": ["webhookEventId"], "transaction.milestone.reminder":["milestoneId"], "offer.expire":["offerId"], "portal.notification.send":["portalUserId"], "document.scan":["documentVersionId"], "document_request.reminder":["documentRequestId"],"ai.property_description.generate":["requestId"],"ai.lead_score.calculate":["requestId"],"ai.lead_summary.generate":["requestId"],"ai.conversation_summary.generate":["requestId"],"ai.transaction_summary.generate":["requestId"],"ai.document.classify":["requestId"],"ai.document.extract":["requestId"],"ai.offer.compare":["requestId"],"ai.inspection.summarize":["requestId"],"ai.tasks.suggest":["requestId"],"ai.follow_up.suggest":["requestId"],"ai.brokerage_insights.generate":["requestId"],"ai.market_insights.generate":["requestId"],"enterprise.webhook.deliver":["deliveryId"],"enterprise.transfer.process":["transferId"] };
export function validateJobPayload(type: string, payload: unknown): payload is Record<string, unknown> { if (!JOB_TYPES.includes(type as RealEstateJobType) || !payload || typeof payload !== "object" || Array.isArray(payload)) return false; return (required[type as RealEstateJobType] || []).every(key => typeof (payload as Record<string, unknown>)[key] === "string"); }
export async function enqueueJob(scope: DataScope, _clientOrganizationId: string, membershipId: string | null, input: { jobType: RealEstateJobType; payload: Record<string, unknown>; idempotencyKey: string; scheduledAt?: string; priority?: number; maxAttempts?: number }) {
  if (!validateJobPayload(input.jobType, input.payload)) throw new Error("Invalid job payload");
  const member = membershipId ? (await db().select({ agentId: realEstateMemberships.agentId }).from(realEstateMemberships).where(and(eq(realEstateMemberships.id,membershipId),eq(realEstateMemberships.tenantId,scope.tenantId),eq(realEstateMemberships.isActive,true),isNull(realEstateMemberships.deletedAt))).limit(1))[0] : null;
  const agentOrganization = member?.agentId ? (await db().select({ organizationId: realEstateAgents.organizationId }).from(realEstateAgents).where(and(eq(realEstateAgents.id,member.agentId),eq(realEstateAgents.tenantId,scope.tenantId),isNull(realEstateAgents.deletedAt))).limit(1))[0]?.organizationId : null;
  const organizationId = agentOrganization || (await db().select({ organizationId: realEstateBrokerages.organizationId }).from(realEstateBrokerages).where(and(eq(realEstateBrokerages.tenantId,scope.tenantId),isNull(realEstateBrokerages.deletedAt))).limit(1))[0]?.organizationId;
  if (!organizationId) throw new Error("No authorized organization is configured for this tenant");
  return (await db().insert(realEstateJobs).values({ id: id("job"), tenantId: scope.tenantId, organizationId, jobType: input.jobType, payload: input.payload, idempotencyKey: input.idempotencyKey, status: input.scheduledAt && new Date(input.scheduledAt) > new Date() ? "scheduled" : "available", scheduledAt: input.scheduledAt, availableAt: input.scheduledAt || now(), priority: input.priority ?? 100, maxAttempts: input.maxAttempts ?? 5, createdByMembershipId: membershipId }).onConflictDoNothing().returning())[0] ?? null;
}
export async function enqueueCalendarJobs(scope:DataScope,membershipId:string,eventType:"showing"|"open_house"|"appointment"|"inspection"|"transaction_milestone",eventId:string,operation:"sync"|"delete"="sync"){
  const connections=await db().select({id:realEstateCalendarConnections.id}).from(realEstateCalendarConnections).where(and(eq(realEstateCalendarConnections.tenantId,scope.tenantId),eq(realEstateCalendarConnections.memberId,membershipId),eq(realEstateCalendarConnections.syncEnabled,true),isNull(realEstateCalendarConnections.deletedAt)));const jobs=[];for(const connection of connections){const job=await enqueueJob(scope,`tenant:${scope.tenantId}`,membershipId,{jobType:operation==="delete"?"calendar.delete.event":"calendar.sync.event",payload:{connectionId:connection.id,eventType,eventId},idempotencyKey:`calendar.${operation}:${connection.id}:${eventType}:${eventId}:${new Date().toISOString().slice(0,16)}`});if(job)jobs.push(job)}return jobs;
}
export async function claimJobs(workerId: string, limit: number) {
  const bounded = Math.min(25, Math.max(1, limit)), expires = new Date(Date.now() + 2 * 60_000).toISOString(), timestamp = now();
  const result = await db().execute(sql`with claimable as (
    select id from real_estate_jobs where deleted_at is null and cancelled_at is null
    and ((status in ('available','retry_wait') and available_at <= ${timestamp}) or (status='scheduled' and scheduled_at <= ${timestamp}) or (status='processing' and lock_expires_at < ${timestamp}))
    order by priority asc, available_at asc for update skip locked limit ${bounded}
  ) update real_estate_jobs j set status='processing', locked_by=${workerId}, locked_at=${timestamp}, lock_expires_at=${expires}, started_at=coalesce(started_at,${timestamp}), attempt_count=j.attempt_count+1, updated_at=${timestamp}
  from claimable where j.id=claimable.id returning j.*`);
  return result.rows as Array<typeof realEstateJobs.$inferSelect>;
}
const backoff = (attempt: number) => Math.min(3600, 15 * 2 ** Math.max(0, attempt - 1)) + Math.floor(Math.random() * 10);
export async function completeJob(jobId: string, workerId: string) { await db().update(realEstateJobs).set({ status: "completed", completedAt: now(), lockedBy: null, lockedAt: null, lockExpiresAt: null, updatedAt: now() }).where(and(eq(realEstateJobs.id, jobId), eq(realEstateJobs.lockedBy, workerId), eq(realEstateJobs.status, "processing"))); await db().delete(realEstateJobLocks).where(eq(realEstateJobLocks.jobId, jobId)); }
export async function failJob(job: typeof realEstateJobs.$inferSelect, workerId: string, code: string, message: string, retryable: boolean) {
  const safe = message.slice(0, 300), dead = !retryable || job.attemptCount >= job.maxAttempts, availableAt = new Date(Date.now() + backoff(job.attemptCount) * 1000).toISOString();
  await db().transaction(async tx => {
    await tx.update(realEstateJobs).set({ status: dead ? "dead_letter" : "retry_wait", failedAt: dead ? now() : null, availableAt, lockedBy: null, lockedAt: null, lockExpiresAt: null, lastErrorCode: code, lastErrorMessage: safe, updatedAt: now() }).where(and(eq(realEstateJobs.id, job.id), eq(realEstateJobs.lockedBy, workerId)));
    if (dead) await tx.insert(realEstateDeadLetters).values({ id: id("dead"), tenantId: job.tenantId, jobId: job.id, jobType: job.jobType, safeErrorCode: code, safeErrorMessage: safe, attemptCount: job.attemptCount }).onConflictDoNothing();
  });
}
async function currentScope(job: typeof realEstateJobs.$inferSelect): Promise<{ scope: DataScope; membershipId: string } | null> {
  if (!job.createdByMembershipId) return { scope: { tenantId: job.tenantId, role: "broker_owner", agentId: null }, membershipId: "system" };
  const member = (await db().select().from(realEstateMemberships).where(and(eq(realEstateMemberships.id, job.createdByMembershipId), eq(realEstateMemberships.tenantId, job.tenantId), eq(realEstateMemberships.isActive, true), isNull(realEstateMemberships.deletedAt))).limit(1))[0];
  return member ? { scope: { tenantId: job.tenantId, role: member.role as DataScope["role"], agentId: member.agentId }, membershipId: member.id } : null;
}
async function execute(job: typeof realEstateJobs.$inferSelect) {
  const principal = await currentScope(job); if (!principal) throw Object.assign(new Error("Membership no longer authorized"), { permanent: true, code: "membership_revoked" });
  const p = job.payload;
  if (job.jobType === "communication.send") { const result = await dispatchCommunication(principal.scope, String(p.communicationId)); if (!result) throw Object.assign(new Error("Communication unavailable"), { permanent: true, code: "communication_unavailable" }); if (result.status === "failed") throw Object.assign(new Error(result.error || "Provider failed"), { code: "provider_failure" }); }
  else if (job.jobType === "campaign.expand_audience") await executeCampaign(principal.scope, principal.membershipId, String(p.campaignId), "launch");
  else if (job.jobType === "automation.execute_step") await executeWorkflowRun(principal.scope, principal.membershipId, String(p.runId));
  else if (job.jobType === "reminder.process") await processDueReminders(principal.scope);
  else if (job.jobType === "communication.webhook.process") await processWebhookEvent(String(p.webhookEventId));
  else if (job.jobType === "calendar.sync.event") await synchronizeCalendarEvent(principal.scope,String(p.connectionId),String(p.eventType),String(p.eventId),"upsert");
  else if (job.jobType === "calendar.delete.event") await synchronizeCalendarEvent(principal.scope,String(p.connectionId),String(p.eventType),String(p.eventId),"delete");
  else if (job.jobType === "calendar.sync.connection") await synchronizeCalendarConnection(principal.scope,String(p.connectionId));
  else if (job.jobType === "offer.expire") await db().update(realEstateOffers).set({status:"expired",expiredAt:now(),updatedAt:now()}).where(and(eq(realEstateOffers.id,String(p.offerId)),eq(realEstateOffers.tenantId,principal.scope.tenantId),inArray(realEstateOffers.status,["draft","submitted","received","countered"]),isNull(realEstateOffers.deletedAt)));
  else if (job.jobType.startsWith("ai.") && !["ai.usage.rollup","ai.retention.cleanup"].includes(job.jobType)) await executeAiRequest(principal.scope,principal.membershipId,String(p.requestId));
  else if (job.jobType === "ai.retention.cleanup") await runAiRetention(principal.scope);
  else if (job.jobType === "ai.usage.rollup") return;
  else if (job.jobType === "enterprise.webhook.deliver") await deliverOutboundWebhook(String(p.deliveryId),principal.scope.tenantId);
  else if (["enterprise.transfer.process","enterprise.metrics.rollup","enterprise.backup.verify"].includes(job.jobType)) return;
  else if (["transaction.milestone.reminder","portal.notification.send","document.scan","document_request.reminder"].includes(job.jobType)) return;
  else if (["analytics.rollup","deliverability.rollup","campaign.send_recipient","automation.start"].includes(job.jobType)) return;
}
export async function processJobBatch(workerId: string, limit = 10) {
  const jobs = await claimJobs(workerId, limit); let completed = 0, retrying = 0, deadLettered = 0;
  for (const job of jobs) {
    const attemptId = id("attempt"); await db().insert(realEstateJobAttempts).values({ id: attemptId, tenantId: job.tenantId, jobId: job.id, attemptNumber: job.attemptCount, workerId, status: "processing" });
    try { await execute(job); await completeJob(job.id, workerId); await db().update(realEstateJobAttempts).set({ status: "completed", completedAt: now() }).where(eq(realEstateJobAttempts.id, attemptId)); completed++; }
    catch (error) { const e = error as Error & { permanent?: boolean; code?: string }; await failJob(job, workerId, e.code || "job_failed", e.message, !e.permanent); const dead = Boolean(e.permanent || job.attemptCount >= job.maxAttempts); await db().update(realEstateJobAttempts).set({ status: dead ? "dead_letter" : "retry_wait", safeErrorCode: e.code || "job_failed", safeErrorMessage: e.message.slice(0,300), completedAt: now() }).where(eq(realEstateJobAttempts.id, attemptId)); if (dead) deadLettered++; else retrying++; }
  }
  return { claimed: jobs.length, completed, retrying, deadLettered };
}
export async function listJobs(scope: DataScope, status?: string) { return db().select({ id: realEstateJobs.id, jobType: realEstateJobs.jobType, status: realEstateJobs.status, priority: realEstateJobs.priority, attemptCount: realEstateJobs.attemptCount, maxAttempts: realEstateJobs.maxAttempts, availableAt: realEstateJobs.availableAt, createdAt: realEstateJobs.createdAt, lastErrorCode: realEstateJobs.lastErrorCode, lastErrorMessage: realEstateJobs.lastErrorMessage }).from(realEstateJobs).where(and(eq(realEstateJobs.tenantId, scope.tenantId), isNull(realEstateJobs.deletedAt), status ? eq(realEstateJobs.status, status) : undefined)).orderBy(asc(realEstateJobs.availableAt)).limit(200); }
export async function jobAction(scope: DataScope, jobId: string, action: "retry" | "cancel" | "requeue") {
  const job = (await db().select().from(realEstateJobs).where(and(eq(realEstateJobs.id, jobId), eq(realEstateJobs.tenantId, scope.tenantId), isNull(realEstateJobs.deletedAt))).limit(1))[0]; if (!job) return null;
  if (action === "cancel" && ["processing","completed","dead_letter"].includes(job.status)) return null;
  if (action !== "cancel" && !["failed","retry_wait","dead_letter"].includes(job.status)) return null;
  const patch = action === "cancel" ? { status: "cancelled", cancelledAt: now(), updatedAt: now() } : { status: "available", availableAt: now(), failedAt: null, lastErrorCode: null, lastErrorMessage: null, updatedAt: now() };
  const updated = (await db().update(realEstateJobs).set(patch).where(and(eq(realEstateJobs.id, jobId), eq(realEstateJobs.tenantId, scope.tenantId))).returning())[0]; if (action === "requeue") await db().update(realEstateDeadLetters).set({ requeuedAt: now() }).where(and(eq(realEstateDeadLetters.jobId, jobId), eq(realEstateDeadLetters.tenantId, scope.tenantId))); return updated;
}
