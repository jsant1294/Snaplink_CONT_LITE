import type { CommunicationChannel } from "./types";
import { canCommunicateValue } from "./phase5-policy";
export interface ConsentRecord { emailOptIn: boolean; smsOptIn: boolean; marketingConsent: boolean; transactionalConsent: boolean; unsubscribedAt?: string | null; smsStoppedAt?: string | null; }
export function canCommunicate(preference: ConsentRecord | null, channel: CommunicationChannel, purpose: "marketing" | "transactional") {
  return canCommunicateValue(preference, channel, purpose);
}
