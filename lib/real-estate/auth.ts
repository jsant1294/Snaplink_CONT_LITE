import type { NextRequest } from "next/server";
import { isOperator, pinFromRequest } from "@/lib/auth";
import { demoTenant } from "./fixtures";
import { can, type RealEstatePermission } from "./permissions";
import type { RealEstateRole } from "./types";
import { bootstrapMembership, findMembership } from "./phase4-repositories";

export interface RealEstatePrincipal {
  tenantId: string;
  role: RealEstateRole;
  membershipId: string;
  agentId: string | null;
  userEmail: string;
}

export async function authorizeRealEstate(
  request: NextRequest,
  permission: RealEstatePermission
): Promise<RealEstatePrincipal | null> {
  if (!isOperator(pinFromRequest(request))) return null;
  const tenantId = request.headers.get("x-real-estate-tenant")?.trim() || demoTenant.id;
  if (tenantId !== demoTenant.id) return null;
  const userEmail = (request.headers.get("x-real-estate-member") || "elena@example.com").trim().toLowerCase();
  let membership = await findMembership(tenantId, userEmail);
  const requestedRole = request.headers.get("x-real-estate-role") as RealEstateRole | null;
  const role: RealEstateRole = requestedRole && [
    "broker_owner", "administrator", "office_manager", "listing_agent",
    "marketing_coordinator", "transaction_coordinator",
  ].includes(requestedRole) ? requestedRole : "broker_owner";
  // Existing operator access bootstraps the first durable membership. After that,
  // the stored role and agent relationship are authoritative.
  if (!membership) membership = await bootstrapMembership(tenantId, userEmail, role);
  if (!membership) return null;
  const storedRole = membership.role as RealEstateRole;
  return can(storedRole, permission) ? {
    tenantId, role: storedRole, membershipId: membership.id,
    agentId: membership.agentId, userEmail,
  } : null;
}
