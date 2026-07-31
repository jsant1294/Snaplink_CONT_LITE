// ---------------------------------------------------------------------------
// Operator-controlled paid module access — enforcement helpers.
// Modules default OFF for every professional until an operator explicitly
// enables them (no row in professional_module_entitlements = disabled).
// ---------------------------------------------------------------------------

import { entitlementStore, newId } from "./store";
import { MODULE_KEYS, type ModuleKey } from "./entitlement-types";

export async function isModuleEnabled(contractorId: string, moduleKey: ModuleKey): Promise<boolean> {
  const row = await entitlementStore.get(contractorId, moduleKey);
  return row?.enabled ?? false;
}

/** Mirrors authorizeContractorId's contract: null = allowed, string = error message. */
export async function requireModuleEnabled(contractorId: string, moduleKey: ModuleKey): Promise<string | null> {
  const enabled = await isModuleEnabled(contractorId, moduleKey);
  return enabled ? null : "This module is not enabled for this account";
}

/** All three gated modules' current state for one contractor, defaulting to false when unset. */
export async function listModuleStates(contractorId: string): Promise<Record<ModuleKey, boolean>> {
  const rows = await entitlementStore.listForProfessional(contractorId);
  const byKey = new Map(rows.map((r) => [r.moduleKey, r.enabled]));
  const result = {} as Record<ModuleKey, boolean>;
  for (const key of MODULE_KEYS) result[key] = byKey.get(key) ?? false;
  return result;
}

/** enabledBy is a free-text label, not an identity — this system has no per-operator accounts, only a shared OPERATOR_PIN. */
export async function setModuleEnabled(
  contractorId: string,
  moduleKey: ModuleKey,
  enabled: boolean,
  enabledBy = "operator",
  notes?: string
) {
  return entitlementStore.setEnabled({
    id: newId("ent"),
    professionalId: contractorId,
    moduleKey,
    enabled,
    enabledBy,
    notes,
  });
}
