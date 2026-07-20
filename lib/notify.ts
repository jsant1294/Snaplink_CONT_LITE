// ---------------------------------------------------------------------------
// Instant lead alerts. Fires an SMS to the contractor's own phone the moment
// a new lead comes in via Twilio. No Twilio env vars set → silent no-op, same
// pattern as lib/ai (offline draft instead of throwing).
// ---------------------------------------------------------------------------

import type { Contractor, Lead } from "./types";

function leadAlertText(contractor: Contractor, lead: Lead): string {
  const appUrl = (process.env.APP_URL ?? "").replace(/\/$/, "");
  const dashboardUrl = `${appUrl}/contractor-admin/${contractor.username}`;
  const budget = lead.budgetRange ? ` · ${lead.budgetRange}` : "";

  return contractor.preferredLanguage === "es"
    ? `Nuevo cliente: ${lead.projectType} de ${lead.clientName} (${lead.phone})${budget}. Ver: ${dashboardUrl}`
    : `New lead: ${lead.projectType} from ${lead.clientName} (${lead.phone})${budget}. View: ${dashboardUrl}`;
}

export async function notifyNewLead(contractor: Contractor, lead: Lead): Promise<void> {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER || !contractor.phone) return;

  try {
    const body = new URLSearchParams({
      To: contractor.phone,
      From: TWILIO_FROM_NUMBER,
      Body: leadAlertText(contractor, lead),
    });
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    if (!res.ok) {
      console.error("Lead alert SMS failed:", res.status, await res.text());
    }
  } catch (err) {
    console.error("Lead alert SMS failed:", err);
  }
}
