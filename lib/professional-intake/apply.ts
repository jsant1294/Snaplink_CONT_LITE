// ---------------------------------------------------------------------------
// Southline Professional Intake — review-before-apply workflow.
// Mirrors the SnapLink source pattern (docs/professional-intake/00-*, item 7):
// intake never publishes automatically. Here specifically: applying answers
// onto the live contractor/agent row is always a separate, explicit,
// operator-authorized step (see app/api/professional-intake/sessions/[id]/
// apply/route.ts) — filling out an intake is never the same action as
// writing to the public profile.
// ---------------------------------------------------------------------------

import type { ProfileApplyMode, ProfileFieldPreview } from "./types.ts";
import { CONTRACTOR_INTAKE_FIELD_MAP, AGENT_INTAKE_FIELD_MAP } from "./profile-map.ts";
import type { IntakeOwnerType } from "./types.ts";

const SENSITIVE_FIELDS = new Set(["licenseInfo", "licenseNumber", "licenseState"]);

function isEmptyValue(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function valuesEqual(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((v, i) => v === b[i]);
  }
  return a === b;
}

function fieldMapFor(ownerType: IntakeOwnerType): Record<string, string[]> {
  return ownerType === "contractor" ? CONTRACTOR_INTAKE_FIELD_MAP : AGENT_INTAKE_FIELD_MAP;
}

/**
 * Builds the operator-facing review preview: every field the intake could
 * touch, its current value, the proposed value, whether it actually changes
 * anything, and whether it's a sensitive (license/insurance) claim.
 */
export function buildReviewPreview(
  ownerType: IntakeOwnerType,
  currentProfile: Record<string, unknown>,
  proposedPatch: Record<string, unknown>
): ProfileFieldPreview[] {
  const fieldMap = fieldMapFor(ownerType);
  return Object.entries(proposedPatch).map(([field, proposedValue]) => {
    const currentValue = currentProfile[field];
    return {
      field,
      sourceQuestionId: fieldMap[field]?.[0],
      currentValue,
      proposedValue,
      changed: !valuesEqual(currentValue, proposedValue),
      sensitive: SENSITIVE_FIELDS.has(field),
    };
  });
}

/**
 * Resolves the final patch actually written to the profile, honoring the
 * requested apply mode. Default ("fill_empty") never overwrites a
 * non-empty existing field — the review preview always shows every proposed
 * change, but only a subset of it may actually get written.
 */
export function resolveApplyPatch(
  mode: ProfileApplyMode,
  currentProfile: Record<string, unknown>,
  proposedPatch: Record<string, unknown>,
  fields?: string[]
): Record<string, unknown> {
  const entries = Object.entries(proposedPatch);
  if (mode === "replace_all") {
    return Object.fromEntries(entries);
  }
  if (mode === "replace_selected") {
    const allowed = new Set(fields ?? []);
    return Object.fromEntries(entries.filter(([field]) => allowed.has(field)));
  }
  // fill_empty (default)
  return Object.fromEntries(entries.filter(([field]) => isEmptyValue(currentProfile[field])));
}
