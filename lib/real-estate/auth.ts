import type { NextRequest } from "next/server";
import { isOperator, pinFromRequest } from "@/lib/auth";
import { demoTenant } from "./fixtures";
import { can, type RealEstatePermission } from "./permissions";
import type { RealEstateRole } from "./types";

export interface RealEstatePrincipal {
  tenantId: string;
  role: RealEstateRole;
}

export function authorizeRealEstate(
  request: NextRequest,
  permission: RealEstatePermission
): RealEstatePrincipal | null {
  if (!isOperator(pinFromRequest(request))) return null;
  const tenantId = request.headers.get("x-real-estate-tenant")?.trim() || demoTenant.id;
  if (tenantId !== demoTenant.id) return null;
  const requestedRole = request.headers.get("x-real-estate-role") as RealEstateRole | null;
  const role: RealEstateRole = requestedRole && [
    "broker_owner", "administrator", "office_manager", "listing_agent",
    "marketing_coordinator", "transaction_coordinator",
  ].includes(requestedRole) ? requestedRole : "broker_owner";
  return can(role, permission) ? { tenantId, role } : null;
}
