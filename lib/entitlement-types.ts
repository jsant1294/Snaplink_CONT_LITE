// ---------------------------------------------------------------------------
// Operator-controlled paid module access. See lib/db/schema.ts
// (professionalModuleEntitlements) and lib/entitlements.ts for the
// enforcement helpers built on top of this store.
// ---------------------------------------------------------------------------

/** Only modules that actually exist as gated features today. */
export type ModuleKey = "flipbook" | "mini_campaigns" | "invoices" | "money";

export const MODULE_KEYS: ModuleKey[] = ["flipbook", "mini_campaigns", "invoices", "money"];

/** The only source in use today; kept generic so agent_profiles can join later without a migration. */
export type ProfessionalSource = "contractor";

export interface ModuleEntitlement {
  id: string;
  professionalSource: ProfessionalSource;
  professionalId: string;
  moduleKey: ModuleKey;
  enabled: boolean;
  enabledBy?: string;
  enabledAt?: string;
  disabledAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
