// ---------------------------------------------------------------------------
// Identity helpers for the Agent Management slice.
//
// SnapLink (username, /p/{username}) and Southline Living (slug, /agents/{slug})
// are deliberately two different identifiers. A professional keeps the same
// SnapLink username even if their Southline discovery slug changes (renamed
// service area, brokerage-driven re-listing, etc.) — see
// docs/architecture/AGENT_MANAGEMENT.md.
// ---------------------------------------------------------------------------

import { RESERVED_IDENTIFIERS } from "./types";

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Same normalization as slugify — usernames and slugs share one identifier grammar. */
export function usernameify(value: string): string {
  return slugify(value);
}

export function isReservedIdentifier(value: string): boolean {
  return RESERVED_IDENTIFIERS.includes(value.toLowerCase());
}

export function suggestUsername(firstName: string, lastName: string): string {
  const base = usernameify(`${firstName} ${lastName}`);
  return base || "agent";
}

/**
 * Appends a short suffix until `candidate` clears both the reserved-word list
 * and the `taken` predicate (a DB/JSON lookup supplied by the caller). Never
 * loops forever — falls back to a fully random suffix after a few short tries.
 */
export async function firstAvailable(
  candidate: string,
  taken: (value: string) => Promise<boolean>,
  fallbackSeed: string
): Promise<string> {
  const base = candidate || "agent";
  if (!isReservedIdentifier(base) && !(await taken(base))) return base;

  for (let n = 2; n <= 9; n++) {
    const attempt = `${base}-${n}`;
    if (!isReservedIdentifier(attempt) && !(await taken(attempt))) return attempt;
  }

  const attempt = `${base}-${fallbackSeed.slice(-6)}`;
  if (!isReservedIdentifier(attempt) && !(await taken(attempt))) return attempt;

  // Last resort: fully random suffix. Practically unreachable — reserved for
  // pathological collision storms.
  return `${base}-${Math.random().toString(36).slice(2, 8)}`;
}

export function isValidUsernameFormat(value: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/.test(value);
}
