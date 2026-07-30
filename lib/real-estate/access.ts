import type { RealEstateRole } from "./types";
import { isAgentScopeValue, ownsAgentRecordValue, sameTenantValue } from "./access-policy";

export interface DataScope {
  tenantId: string;
  role: RealEstateRole;
  agentId: string | null;
}

export function isAgentScope(scope: DataScope): scope is DataScope & { agentId: string } {
  return isAgentScopeValue(scope);
}

export function ownsAgentRecord(scope: DataScope, assignedAgentId: unknown): boolean {
  return ownsAgentRecordValue(scope, assignedAgentId);
}

export function sameTenant(scope: DataScope, recordTenantId: unknown): boolean {
  return sameTenantValue(scope, recordTenantId);
}
