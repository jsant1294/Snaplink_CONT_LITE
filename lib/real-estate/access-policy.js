export function isAgentScopeValue(scope) {
  return scope.role === "listing_agent" && Boolean(scope.agentId);
}
export function ownsAgentRecordValue(scope, assignedAgentId) {
  return !isAgentScopeValue(scope) || assignedAgentId === scope.agentId;
}
export function sameTenantValue(scope, recordTenantId) {
  return recordTenantId === scope.tenantId;
}
