// ---------------------------------------------------------------------------
// Auth for Snaplink Profile (self-service agent profiles). Reuses the same
// PIN model as lib/auth.ts (contractor auth) without modifying that file —
// operator PIN unlocks every profile; an agent's own PIN unlocks only theirs.
// ---------------------------------------------------------------------------

import type { NextRequest } from "next/server";
import { isOperator, pinFromRequest } from "@/lib/auth";
import type { AgentProfile } from "./types";

export { isOperator, pinFromRequest };

export function canAccessAgentProfile(pin: string, profile: AgentProfile): boolean {
  if (isOperator(pin)) return true;
  return Boolean(profile.pin) && pin === profile.pin;
}

export async function authorizeAgentProfileId(
  req: NextRequest,
  profile: AgentProfile | undefined
): Promise<string | null> {
  const pin = pinFromRequest(req);
  if (!profile) return "Agent profile not found";
  return canAccessAgentProfile(pin, profile) ? null : "Invalid PIN for this profile";
}

/** Strip the PIN before sending a profile to any client. */
export function publicAgentProfile<T extends AgentProfile>(profile: T): Omit<T, "pin"> {
  const { pin: _pin, ...rest } = profile;
  return rest;
}
