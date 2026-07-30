export const allowedMergeVariables = new Set([
  "first_name", "last_name", "full_name", "property_title", "property_address",
  "city", "state", "price", "listing_url", "agent_name", "brokerage",
  "organization", "showing_date", "showing_time", "appointment_date",
  "appointment_time", "booking_url", "unsubscribe_url",
]);
export function variablesIn(content) { return [...content.matchAll(/\{\{\s*([a-z_]+)\s*\}\}/g)].map(match => match[1]); }
export function validateTemplateValue(content) { const unknown = [...new Set(variablesIn(content).filter(variable => !allowedMergeVariables.has(variable)))]; return { valid: unknown.length === 0, unknown }; }
export function renderTemplateValue(content, values) { const result = validateTemplateValue(content); if (!result.valid) throw new Error(`Unknown merge variables: ${result.unknown.join(", ")}`); return content.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (_, key) => String(values[key] ?? "")); }
export function canCommunicateValue(preference, channel, purpose) {
  if (!preference) return false;
  if (purpose === "marketing" && !preference.marketingConsent) return false;
  if (purpose === "transactional" && !preference.transactionalConsent) return false;
  return channel === "email" ? preference.emailOptIn && !preference.unsubscribedAt : preference.smsOptIn && !preference.smsStoppedAt;
}
export function uniqueRecipients(recipients) { return [...new Map(recipients.map(item => [`${item.channel}:${item.recipient}`, item])).values()]; }
export function reminderIsDue(remindAt, currentTime, status) { return status === "scheduled" && new Date(remindAt).getTime() <= new Date(currentTime).getTime(); }
export function providerMode(nodeEnv, configuredMode) { if (nodeEnv === "development") return configuredMode === "disabled" ? "disabled" : "preview"; return configuredMode || "disabled"; }
