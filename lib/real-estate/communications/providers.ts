import type { CommunicationChannel, CommunicationProvider, ProviderMessage, ProviderResult } from "./types";
import { providerMode } from "./phase5-policy";

class DisabledProvider implements CommunicationProvider {
  readonly name = "disabled"; readonly sendsExternally = false;
  constructor(readonly channel: CommunicationChannel) {}
  async send(): Promise<ProviderResult> { return { status: "disabled", provider: this.name, error: `${this.channel} provider is not configured` }; }
}
class PreviewProvider implements CommunicationProvider {
  readonly name = "preview"; readonly sendsExternally = false;
  constructor(readonly channel: CommunicationChannel) {}
  async send(message: ProviderMessage): Promise<ProviderResult> { return { status: "preview", provider: this.name, messageId: `preview_${this.channel}_${message.to.length}_${message.body.length}` }; }
}
export interface ProductionProviderAdapter extends CommunicationProvider {}
export class ResendAdapter implements ProductionProviderAdapter {
  readonly name = "resend"; readonly channel = "email" as const; readonly sendsExternally = true;
  constructor(private readonly apiKey: string, private readonly from: string) {}
  async send(message: ProviderMessage): Promise<ProviderResult> {
    const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: this.from, to: message.to, subject: message.subject || "SnapLink Real Estate", html: message.body }) });
    const data = await response.json() as { id?: string; message?: string };
    return response.ok ? { status: "sent", provider: this.name, messageId: data.id } : { status: "failed", provider: this.name, error: data.message || "Resend failed" };
  }
}
export class SendGridAdapter implements ProductionProviderAdapter {
  readonly name = "sendgrid"; readonly channel = "email" as const; readonly sendsExternally = true;
  constructor(private readonly apiKey: string, private readonly from: string) {}
  async send(message: ProviderMessage): Promise<ProviderResult> {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", { method: "POST", headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ personalizations: [{ to: [{ email: message.to }] }], from: { email: this.from }, subject: message.subject || "SnapLink Real Estate", content: [{ type: "text/html", value: message.body }] }) });
    return response.ok ? { status: "sent", provider: this.name, messageId: response.headers.get("x-message-id") || undefined } : { status: "failed", provider: this.name, error: `SendGrid ${response.status}` };
  }
}
export class TwilioAdapter implements ProductionProviderAdapter {
  readonly name = "twilio"; readonly channel = "sms" as const; readonly sendsExternally = true;
  constructor(private readonly accountSid: string, private readonly authToken: string, private readonly from: string) {}
  async send(message: ProviderMessage): Promise<ProviderResult> {
    const body = new URLSearchParams({ To: message.to, From: this.from, Body: message.body });
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`, { method: "POST", headers: { Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" }, body });
    const data = await response.json() as { sid?: string; message?: string };
    return response.ok ? { status: "sent", provider: this.name, messageId: data.sid } : { status: "failed", provider: this.name, error: data.message || "Twilio failed" };
  }
}

export function communicationProvider(channel: CommunicationChannel): CommunicationProvider {
  const mode = providerMode(process.env.NODE_ENV, process.env.REAL_ESTATE_COMMUNICATION_MODE);
  if (process.env.NODE_ENV === "development") return mode === "disabled" ? new DisabledProvider(channel) : new PreviewProvider(channel);
  if (mode === "preview") return new PreviewProvider(channel);
  if (channel === "email" && mode === "resend" && process.env.RESEND_API_KEY && process.env.REAL_ESTATE_EMAIL_FROM) return new ResendAdapter(process.env.RESEND_API_KEY, process.env.REAL_ESTATE_EMAIL_FROM);
  if (channel === "email" && mode === "sendgrid" && process.env.SENDGRID_API_KEY && process.env.REAL_ESTATE_EMAIL_FROM) return new SendGridAdapter(process.env.SENDGRID_API_KEY, process.env.REAL_ESTATE_EMAIL_FROM);
  if (channel === "sms" && mode === "twilio" && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER) return new TwilioAdapter(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN, process.env.TWILIO_FROM_NUMBER);
  return new DisabledProvider(channel);
}
