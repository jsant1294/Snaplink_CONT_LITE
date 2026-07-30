import { loadIntegrationConfig } from "./config";
export interface RealEstateProviderSendResult { success: boolean; provider: string; providerMessageId?: string | null; providerStatus?: string | null; internalStatus: "queued" | "sent" | "delivered" | "failed" | "blocked"; retryable: boolean; errorCode?: string | null; safeErrorMessage?: string | null; occurredAt: Date; }
export interface ProductionMessage { recipient: string; subject?: string; html?: string; text: string; idempotencyKey: string; sender?: string; purpose: "marketing" | "transactional"; }
const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/, e164 = /^\+[1-9]\d{7,14}$/;
const result = (provider: string, patch: Partial<RealEstateProviderSendResult>): RealEstateProviderSendResult => ({ success: false, provider, internalStatus: "failed", retryable: false, occurredAt: new Date(), ...patch });
async function timedFetch(url: string, init: RequestInit, timeout = 8000) { const controller = new AbortController(), timer = setTimeout(() => controller.abort(), timeout); try { return await fetch(url, { ...init, signal: controller.signal }); } finally { clearTimeout(timer); } }
function classify(provider: string, status: number) { return result(provider, { errorCode: `http_${status}`, safeErrorMessage: status === 401 || status === 403 ? "Provider authentication failed" : status === 429 ? "Provider rate limited request" : "Provider rejected request", retryable: status === 429 || status >= 500 }); }
export class ProductionEmailProvider {
  constructor(private readonly provider: "resend" | "sendgrid", private readonly env: NodeJS.ProcessEnv = process.env) {}
  async send(message: ProductionMessage): Promise<RealEstateProviderSendResult> {
    const c = loadIntegrationConfig(this.env); if (!email.test(message.recipient)) return result(this.provider, { errorCode: "invalid_recipient", safeErrorMessage: "Invalid email recipient" });
    if (message.sender && message.sender !== c.emailFrom) return result(this.provider, { errorCode: "sender_override", safeErrorMessage: "Sender override rejected" });
    if (c.providerTestMode || this.env.NODE_ENV !== "production") return result("preview", { success: true, internalStatus: "sent", providerStatus: "preview", providerMessageId: `preview_${message.idempotencyKey}` });
    try {
      const resend = this.provider === "resend", response = await timedFetch(resend ? "https://api.resend.com/emails" : "https://api.sendgrid.com/v3/mail/send", { method: "POST", headers: { Authorization: `Bearer ${resend ? this.env.RESEND_API_KEY : this.env.SENDGRID_API_KEY}`, "Content-Type": "application/json", ...(resend ? { "Idempotency-Key": message.idempotencyKey } : {}) }, body: JSON.stringify(resend ? { from: c.emailFrom, reply_to: c.emailReplyTo, to: message.recipient, subject: message.subject, html: message.html || message.text, text: message.text } : { personalizations: [{ to: [{ email: message.recipient }], custom_args: { idempotency_key: message.idempotencyKey } }], from: { email: c.emailFrom }, reply_to: c.emailReplyTo ? { email: c.emailReplyTo } : undefined, subject: message.subject, content: [{ type: "text/plain", value: message.text }, { type: "text/html", value: message.html || message.text }] }) });
      if (!response.ok) return classify(this.provider, response.status); const body = resend ? await response.json() as { id?: string } : null;
      return result(this.provider, { success: true, internalStatus: "sent", retryable: false, providerMessageId: body?.id || response.headers.get("x-message-id") });
    } catch (error) { return result(this.provider, { errorCode: error instanceof Error && error.name === "AbortError" ? "timeout" : "network", safeErrorMessage: "Provider request failed", retryable: true }); }
  }
}
export class ProductionSmsProvider {
  constructor(private readonly env: NodeJS.ProcessEnv = process.env) {}
  async send(message: ProductionMessage): Promise<RealEstateProviderSendResult> {
    const c = loadIntegrationConfig(this.env), recipient = message.recipient.replace(/[()\s-]/g, "");
    if (!e164.test(recipient)) return result("twilio", { errorCode: "invalid_recipient", safeErrorMessage: "Invalid E.164 SMS recipient" });
    if (message.sender && message.sender !== c.smsFrom) return result("twilio", { errorCode: "sender_override", safeErrorMessage: "Sender override rejected" });
    let text = message.text; if (message.purpose === "marketing" && !/\b(stop|unsubscribe)\b/i.test(text)) text += "\nReply STOP to opt out.";
    if (c.providerTestMode || this.env.NODE_ENV !== "production") return result("preview", { success: true, internalStatus: "sent", providerMessageId: `preview_${message.idempotencyKey}` });
    const body = new URLSearchParams({ To: recipient, Body: text }); if (this.env.TWILIO_MESSAGING_SERVICE_SID) body.set("MessagingServiceSid", this.env.TWILIO_MESSAGING_SERVICE_SID); else body.set("From", c.smsFrom || "");
    try { const response = await timedFetch(`https://api.twilio.com/2010-04-01/Accounts/${this.env.TWILIO_ACCOUNT_SID}/Messages.json`, { method: "POST", headers: { Authorization: `Basic ${Buffer.from(`${this.env.TWILIO_ACCOUNT_SID}:${this.env.TWILIO_AUTH_TOKEN}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded", "Idempotency-Key": message.idempotencyKey }, body }); if (!response.ok) return classify("twilio", response.status); const data = await response.json() as { sid?: string; status?: string }; return result("twilio", { success: true, internalStatus: "sent", providerMessageId: data.sid, providerStatus: data.status }); } catch (error) { return result("twilio", { errorCode: error instanceof Error && error.name === "AbortError" ? "timeout" : "network", safeErrorMessage: "Provider request failed", retryable: true }); }
  }
}
