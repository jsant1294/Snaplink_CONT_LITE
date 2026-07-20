// ---------------------------------------------------------------------------
// Tenant auth (MVP): 6-digit PINs.
// - Operator PIN (env OPERATOR_PIN, default 777777) unlocks the master admin
//   and every contractor scope — this is Southline's key.
// - Each contractor has their own PIN, set at creation. It unlocks ONLY their
//   scope. They never see that other tenants exist.
// PIN travels as "x-snaplink-pin" header, or "?pin=" for PDF links (new tabs
// can't set headers). Swap for Auth.js sessions when the roster justifies it.
// ---------------------------------------------------------------------------

import type { NextRequest } from "next/server";
import type { Contractor } from "./types";
import { contractorStore } from "./store";

export function operatorPin(): string {
  return process.env.OPERATOR_PIN?.trim() || "777777";
}

export function pinFromRequest(req: NextRequest): string {
  return (
    req.headers.get("x-snaplink-pin") ??
    req.nextUrl.searchParams.get("pin") ??
    ""
  ).trim();
}

export function isOperator(pin: string): boolean {
  return pin.length > 0 && pin === operatorPin();
}

export function canAccessContractor(pin: string, contractor: Contractor): boolean {
  if (isOperator(pin)) return true;
  return Boolean(contractor.pin) && pin === contractor.pin;
}

/** Authorize a request against a contractor id. Returns null when allowed, or an error string. */
export async function authorizeContractorId(
  req: NextRequest,
  contractorId: string
): Promise<string | null> {
  const pin = pinFromRequest(req);
  if (isOperator(pin)) return null;
  const contractor = await contractorStore.getById(contractorId);
  if (!contractor) return "Contractor not found";
  return canAccessContractor(pin, contractor) ? null : "Invalid PIN for this dashboard";
}

/** Strip the PIN before sending a contractor object to any client. */
export function publicContractor<T extends Contractor>(c: T): Omit<T, "pin"> {
  const { pin: _pin, ...rest } = c;
  return rest;
}
