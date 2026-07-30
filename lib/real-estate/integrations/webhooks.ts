import { createHash, createHmac, timingSafeEqual, verify } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { realEstateCommunications, realEstateWebhookEvents } from "@/lib/db/schema";
import { db } from "../repositories";
import { enqueueJob } from "../jobs";
const id = (kind: string) => `re_${kind}_${Date.now().toString(36)}${Math.random().toString(36).slice(2,8)}`;
const equal = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
export function verifyWebhookSignature(provider: "resend"|"sendgrid"|"twilio", raw: string, headers: Headers, url: string, env = process.env) {
  if (provider === "resend") { const secret = env.RESEND_WEBHOOK_SECRET?.replace(/^whsec_/, ""); const eventId = headers.get("svix-id"), timestamp = headers.get("svix-timestamp"), signature = headers.get("svix-signature")?.split(" ").find(x => x.startsWith("v1,"))?.slice(3); if (!secret || !eventId || !timestamp || !signature || Math.abs(Date.now()/1000 - Number(timestamp)) > 300) return false; const expected = createHmac("sha256", Buffer.from(secret, "base64")).update(`${eventId}.${timestamp}.${raw}`).digest("base64"); return equal(signature, expected); }
  if (provider === "sendgrid") { const key = env.SENDGRID_WEBHOOK_VERIFICATION_KEY, signature = headers.get("x-twilio-email-event-webhook-signature"), timestamp = headers.get("x-twilio-email-event-webhook-timestamp"); if (!key || !signature || !timestamp || Math.abs(Date.now()/1000 - Number(timestamp)) > 300) return false; try { return verify("sha256", Buffer.from(timestamp + raw), key, Buffer.from(signature, "base64")); } catch { return false; } }
  const token = env.TWILIO_WEBHOOK_AUTH_TOKEN, signature = headers.get("x-twilio-signature"); if (!token || !signature) return false; const params = new URLSearchParams(raw), canonical = url + [...params.entries()].sort(([a],[b]) => a.localeCompare(b)).map(([k,v]) => `${k}${v}`).join(""), expected = createHmac("sha1", token).update(canonical).digest("base64"); return equal(signature, expected);
}
export function normalizeDeliveryEvent(provider: string, payload: Record<string, unknown>) {
  const rawType = String(payload.type || payload.event || payload.EventType || payload.MessageStatus || "").toLowerCase();
  const map: Record<string,string> = { "email.sent":"sent", "email.delivered":"delivered", "email.bounced":"hard_bounce", "email.complained":"complaint", delivered:"delivered", bounce:"hard_bounce", bounced:"hard_bounce", deferred:"deferred", dropped:"failed", processed:"accepted", open:"opened", click:"clicked", unsubscribe:"unsubscribed", sent:"sent", queued:"queued", undelivered:"sms_undelivered", failed:"sms_failed" };
  const optOut = provider === "twilio" && /^(stop|stopall|unsubscribe|cancel|end|quit)$/i.test(String(payload.Body || "").trim());
  const eventType = optOut ? "sms_opt_out" : map[rawType] || rawType || "unknown", providerMessageId = String(payload.message_id || payload.sg_message_id || payload.MessageSid || (payload.data as Record<string,unknown> | undefined)?.email_id || "");
  const providerEventId = String(payload.id || payload.sg_event_id || payload.EventSid || "");
  const occurredAt = new Date(Number(payload.timestamp) > 10_000_000_000 ? Number(payload.timestamp) : Number(payload.timestamp) * 1000 || Date.now()).toISOString();
  return { eventType, providerMessageId, providerEventId, occurredAt, inboundSender: optOut ? String(payload.From || "") : "" };
}
export async function ingestVerifiedWebhook(provider: "resend"|"sendgrid"|"twilio", raw: string) {
  const payloadHash = createHash("sha256").update(raw).digest("hex"), parsed = provider === "twilio" ? Object.fromEntries(new URLSearchParams(raw)) : JSON.parse(raw), events = Array.isArray(parsed) ? parsed : [parsed], accepted: string[] = [];
  for (const item of events) { const normalized = normalizeDeliveryEvent(provider, item); const webhookId = id("webhook"); const inserted = (await db().insert(realEstateWebhookEvents).values({ id: webhookId, provider, providerEventId: normalized.providerEventId || null, eventType: normalized.eventType, signatureVerified: true, payloadHash: events.length > 1 ? createHash("sha256").update(JSON.stringify(item)).digest("hex") : payloadHash, safeMetadata: { providerMessageId: normalized.providerMessageId, occurredAt: normalized.occurredAt } }).onConflictDoNothing().returning())[0]; if (!inserted) continue; accepted.push(inserted.id);
    if (normalized.providerMessageId || normalized.inboundSender) { const communication = (await db().select({ id: realEstateCommunications.id, tenantId: realEstateCommunications.tenantId, senderMembershipId: realEstateCommunications.senderMembershipId }).from(realEstateCommunications).where(normalized.inboundSender ? and(eq(realEstateCommunications.provider, "twilio"), eq(realEstateCommunications.recipient, normalized.inboundSender)) : and(eq(realEstateCommunications.provider, provider), eq(realEstateCommunications.providerMessageId, normalized.providerMessageId))).limit(1))[0]; if (communication) { await db().update(realEstateWebhookEvents).set({ safeMetadata: { providerMessageId: normalized.providerMessageId, communicationId: communication.id, occurredAt: normalized.occurredAt } }).where(eq(realEstateWebhookEvents.id, inserted.id)); await enqueueJob({ tenantId: communication.tenantId, role: "broker_owner", agentId: null }, `tenant:${communication.tenantId}`, communication.senderMembershipId, { jobType: "communication.webhook.process", payload: { webhookEventId: inserted.id }, idempotencyKey: `webhook.process:${inserted.id}` }); } }
  }
  return { accepted: accepted.length };
}
const malformed = new Map<string,{ count:number; reset:number }>();
export function allowMalformedAttempt(key: string) { const time = Date.now(), current = malformed.get(key); if (!current || current.reset < time) { malformed.set(key, { count: 1, reset: time + 60_000 }); return true; } current.count++; return current.count <= 30; }
