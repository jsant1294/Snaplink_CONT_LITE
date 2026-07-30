export type RealEstateEmailProviderType = "disabled" | "preview" | "resend" | "sendgrid";
export type RealEstateSmsProviderType = "disabled" | "preview" | "twilio";
export type RealEstateCalendarProviderType = "none" | "google" | "microsoft";
export interface SafeIntegrationStatus { emailProvider: RealEstateEmailProviderType; smsProvider: RealEstateSmsProviderType; emailConfigured: boolean; smsConfigured: boolean; emailFrom: string | null; emailReplyTo: string | null; smsFrom: string | null; googleConfigured: boolean; microsoftConfigured: boolean; webhookReady: boolean; jobsReady: boolean; encryptionReady: boolean; testMode: boolean; }
const allowedEmail = new Set(["disabled", "preview", "resend", "sendgrid"]);
const allowedSms = new Set(["disabled", "preview", "twilio"]);
const absoluteHttps = (value?: string) => !value || (new URL(value).protocol === "https:" || (process.env.NODE_ENV !== "production" && new URL(value).hostname === "localhost"));
export function loadIntegrationConfig(env: NodeJS.ProcessEnv = process.env) {
  const test = env.NODE_ENV === "test", dev = env.NODE_ENV !== "production";
  const emailProvider = (test ? "preview" : env.REAL_ESTATE_EMAIL_PROVIDER || (dev ? "preview" : "disabled")) as RealEstateEmailProviderType;
  const smsProvider = (test ? "preview" : env.REAL_ESTATE_SMS_PROVIDER || (dev ? "preview" : "disabled")) as RealEstateSmsProviderType;
  if (!allowedEmail.has(emailProvider)) throw new Error("Invalid REAL_ESTATE_EMAIL_PROVIDER");
  if (!allowedSms.has(smsProvider)) throw new Error("Invalid REAL_ESTATE_SMS_PROVIDER");
  const missing: string[] = [];
  if (emailProvider === "resend") for (const key of ["RESEND_API_KEY", "REAL_ESTATE_EMAIL_FROM"]) if (!env[key]) missing.push(key);
  if (emailProvider === "sendgrid") for (const key of ["SENDGRID_API_KEY", "REAL_ESTATE_EMAIL_FROM"]) if (!env[key]) missing.push(key);
  if (smsProvider === "twilio") {
    for (const key of ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN"]) if (!env[key]) missing.push(key);
    if (!env.TWILIO_MESSAGING_SERVICE_SID && !env.TWILIO_PHONE_NUMBER && !env.REAL_ESTATE_SMS_FROM) missing.push("TWILIO_MESSAGING_SERVICE_SID or TWILIO_PHONE_NUMBER");
  }
  for (const key of ["GOOGLE_CALENDAR_REDIRECT_URI", "MICROSOFT_CALENDAR_REDIRECT_URI", "REAL_ESTATE_WEBHOOK_BASE_URL", "REAL_ESTATE_APP_BASE_URL"]) if (!absoluteHttps(env[key])) throw new Error(`${key} must be an approved absolute HTTPS URL`);
  if (env.GOOGLE_CALENDAR_CLIENT_ID && (!env.GOOGLE_CALENDAR_CLIENT_SECRET || !env.GOOGLE_CALENDAR_REDIRECT_URI || !env.REAL_ESTATE_TOKEN_ENCRYPTION_KEY)) missing.push("Google Calendar secret, redirect URI, and encryption key");
  if (env.MICROSOFT_CALENDAR_CLIENT_ID && (!env.MICROSOFT_CALENDAR_CLIENT_SECRET || !env.MICROSOFT_CALENDAR_REDIRECT_URI || !env.REAL_ESTATE_TOKEN_ENCRYPTION_KEY)) missing.push("Microsoft Calendar secret, redirect URI, and encryption key");
  if (missing.length) throw new Error(`Missing required integration configuration: ${[...new Set(missing)].join(", ")}`);
  return { emailProvider, smsProvider, providerTestMode: test || env.REAL_ESTATE_PROVIDER_TEST_MODE === "true", emailFrom: env.REAL_ESTATE_EMAIL_FROM, emailReplyTo: env.REAL_ESTATE_EMAIL_REPLY_TO, smsFrom: env.REAL_ESTATE_SMS_FROM || env.TWILIO_PHONE_NUMBER, googleConfigured: Boolean(env.GOOGLE_CALENDAR_CLIENT_ID), microsoftConfigured: Boolean(env.MICROSOFT_CALENDAR_CLIENT_ID), encryptionKey: env.REAL_ESTATE_TOKEN_ENCRYPTION_KEY, jobSecret: env.REAL_ESTATE_JOB_PROCESSOR_SECRET, appBaseUrl: env.REAL_ESTATE_APP_BASE_URL, webhookBaseUrl: env.REAL_ESTATE_WEBHOOK_BASE_URL };
}
export function safeIntegrationStatus(env: NodeJS.ProcessEnv = process.env): SafeIntegrationStatus {
  try { const c = loadIntegrationConfig(env); return { emailProvider: c.emailProvider, smsProvider: c.smsProvider, emailConfigured: !["disabled"].includes(c.emailProvider), smsConfigured: !["disabled"].includes(c.smsProvider), emailFrom: c.emailFrom || null, emailReplyTo: c.emailReplyTo || null, smsFrom: c.smsFrom || null, googleConfigured: c.googleConfigured, microsoftConfigured: c.microsoftConfigured, webhookReady: Boolean(env.RESEND_WEBHOOK_SECRET || env.SENDGRID_WEBHOOK_VERIFICATION_KEY || env.TWILIO_WEBHOOK_AUTH_TOKEN), jobsReady: Boolean(c.jobSecret), encryptionReady: Boolean(c.encryptionKey), testMode: c.providerTestMode }; }
  catch { return { emailProvider: "disabled", smsProvider: "disabled", emailConfigured: false, smsConfigured: false, emailFrom: null, emailReplyTo: null, smsFrom: null, googleConfigured: false, microsoftConfigured: false, webhookReady: false, jobsReady: false, encryptionReady: false, testMode: true }; }
}
