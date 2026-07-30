export const MERGE_VARIABLES = [
  "first_name", "last_name", "full_name", "property_title", "property_address",
  "city", "state", "price", "listing_url", "agent_name", "brokerage",
  "organization", "showing_date", "showing_time", "appointment_date",
  "appointment_time", "booking_url", "unsubscribe_url",
] as const;
export const TEMPLATE_TYPES = [
  "lead_welcome", "buyer_follow_up", "seller_follow_up", "showing_confirmation",
  "showing_reminder", "showing_follow_up", "open_house_registration",
  "open_house_reminder", "open_house_follow_up", "property_inquiry",
  "price_reduction", "property_published", "campaign", "appointment",
  "task_reminder", "custom",
] as const;
const allowed = new Set<string>(MERGE_VARIABLES);
export function templateVariables(content: string): string[] {
  return variablesIn(content);
}
export function validateTemplate(content: string) {
  return validateTemplateValue(content);
}
export function renderTemplate(content: string, values: Record<string, string | number | undefined>) {
  return renderTemplateValue(content, values);
}
import { renderTemplateValue, validateTemplateValue, variablesIn } from "./phase5-policy";
