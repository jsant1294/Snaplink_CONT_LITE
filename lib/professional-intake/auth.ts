// ---------------------------------------------------------------------------
// Professional Intake — auth. Reuses the existing contractor/agent PIN model
// (lib/auth.ts / lib/agent-profiles/auth.ts) rather than the SnapLink
// source's public-token model — every actor in this repo already
// authenticates by PIN, so a second auth system would be redundant.
//
// Filling out an intake (create/autosave/submit) is allowed for the
// operator OR the owning professional's own PIN. Applying an intake's
// answers onto the live profile is operator-only, always — see apply/
// route.ts and docs/professional-intake/06-review-and-apply.md.
// ---------------------------------------------------------------------------

import type { NextRequest } from "next/server";
import { isOperator, pinFromRequest, canAccessContractor } from "../auth.ts";
import { canAccessAgentProfile } from "../agent-profiles/auth.ts";
import { contractorStore, intakeSessionStore } from "../store.ts";
import { agentProfileStore } from "../agent-profiles/store.ts";
import type { IntakeOwnerType, IntakeSession } from "./types.ts";

export { isOperator, pinFromRequest };

export function isOperatorRequest(req: NextRequest): boolean {
  return isOperator(pinFromRequest(req));
}

/** Null = allowed. Non-null = error message. */
export async function authorizeIntakeOwner(req: NextRequest, ownerType: IntakeOwnerType, ownerId: string): Promise<string | null> {
  const pin = pinFromRequest(req);
  if (isOperator(pin)) return null;
  if (ownerType === "contractor") {
    const contractor = await contractorStore.getById(ownerId);
    if (!contractor) return "Contractor not found";
    return canAccessContractor(pin, contractor) ? null : "Invalid PIN for this contractor";
  }
  const agent = await agentProfileStore.getById(ownerId);
  if (!agent) return "Agent profile not found";
  return canAccessAgentProfile(pin, agent) ? null : "Invalid PIN for this profile";
}

/** Loads a session and authorizes the request against its owner in one step. */
export async function loadAndAuthorizeSession(
  req: NextRequest,
  id: string
): Promise<{ session: IntakeSession; error: null } | { session: null; error: string; status: number }> {
  const session = await intakeSessionStore.get(id);
  if (!session) return { session: null, error: "Intake session not found", status: 404 };
  const authError = await authorizeIntakeOwner(req, session.ownerType, session.ownerId);
  if (authError) return { session: null, error: authError, status: 401 };
  return { session, error: null };
}
