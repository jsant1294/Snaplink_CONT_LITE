// ---------------------------------------------------------------------------
// Store driver switch.
// - DATABASE_URL set  → Postgres via Drizzle (Neon-ready). PRODUCTION MODE.
// - DATABASE_URL unset → file-based JSON in .data/. Local demos only; never
//   deploy this mode to serverless (ephemeral filesystem = data loss).
// API routes import from here and never know which backend is live.
// ---------------------------------------------------------------------------

import {
  jsonLeadStore,
  jsonContractorStore,
  jsonEstimateStore,
} from "./store-json";
import { pgLeadStore, pgContractorStore, pgEstimateStore } from "./store-pg";
import { pgExpenseStore, pgCategoryStore, pgTaxProfileStore, pgPayeeStore, pgForm1099Store, pgSetAsideStore } from "./store-money-pg";
import { jsonExpenseStore, jsonCategoryStore, jsonTaxProfileStore, jsonPayeeStore, jsonForm1099Store, jsonSetAsideStore } from "./store-money-json";

import { usePg } from "./db-url";

export const leadStore = usePg ? pgLeadStore : jsonLeadStore;
export const contractorStore = usePg ? pgContractorStore : jsonContractorStore;
export const estimateStore = usePg ? pgEstimateStore : jsonEstimateStore;

// Lucio Financial Copilot
export const expenseStore = usePg ? pgExpenseStore : jsonExpenseStore;
export const categoryStore = usePg ? pgCategoryStore : jsonCategoryStore;
export const taxProfileStore = usePg ? pgTaxProfileStore : jsonTaxProfileStore;
export const payeeStore = usePg ? pgPayeeStore : jsonPayeeStore;
export const form1099Store = usePg ? pgForm1099Store : jsonForm1099Store;
export const setAsideStore = usePg ? pgSetAsideStore : jsonSetAsideStore;

export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
