export const PROVIDER_CATEGORIES=["mls","idx","esignature","accounting","crm","marketing","analytics"]as const;
export type ProviderCategory=typeof PROVIDER_CATEGORIES[number];
export interface ProviderDefinition{key:string;category:ProviderCategory;displayName:string;version:string;capabilities:string[];requiredScopes:string[];configFields:string[]}
// Provider-neutral foundation only: no named MLS/IDX vendor is wired in. Real vendor adapters are
// registered at runtime via registerMlsAdapter() (lib/real-estate/marketplace/mls.ts) and never
// ship in this catalog, so the platform stays uncoupled from any single MLS/IDX provider.
export const PROVIDER_CATALOG:ProviderDefinition[]=[
  {key:"generic_mls",category:"mls",displayName:"Generic MLS Adapter",version:"1.0.0",capabilities:["listing_sync","media_sync","status_sync","agent_mapping","office_mapping"],requiredScopes:["mls:read"],configFields:["baseUrl","feedKey"]},
  {key:"generic_idx",category:"idx",displayName:"Generic IDX Adapter",version:"1.0.0",capabilities:["listing_sync","media_sync"],requiredScopes:["idx:read"],configFields:["baseUrl","feedKey"]},
  {key:"generic_esignature",category:"esignature",displayName:"Generic E-Signature Adapter",version:"1.0.0",capabilities:["envelope_send","envelope_status"],requiredScopes:["esignature:write"],configFields:["apiBaseUrl"]},
  {key:"generic_accounting",category:"accounting",displayName:"Generic Accounting Adapter",version:"1.0.0",capabilities:["commission_export","invoice_sync"],requiredScopes:["accounting:write"],configFields:["apiBaseUrl"]},
  {key:"generic_crm",category:"crm",displayName:"Generic CRM Adapter",version:"1.0.0",capabilities:["contact_sync","lead_sync"],requiredScopes:["crm:sync"],configFields:["apiBaseUrl"]},
  {key:"generic_marketing",category:"marketing",displayName:"Generic Marketing Adapter",version:"1.0.0",capabilities:["campaign_sync","audience_sync"],requiredScopes:["marketing:sync"],configFields:["apiBaseUrl"]},
  {key:"generic_analytics",category:"analytics",displayName:"Generic Analytics Adapter",version:"1.0.0",capabilities:["event_export"],requiredScopes:["analytics:export"],configFields:["apiBaseUrl"]},
];
export const LICENSE_FEATURES=["crm","transactions","ai","portal","documents","reporting","apis","marketplace","enterprise"]as const;
export type LicenseFeature=typeof LICENSE_FEATURES[number];
export const MLS_SYNC_TYPES=["listing","media","status","agent","office"]as const;
export type MlsSyncType=typeof MLS_SYNC_TYPES[number];
export const MLS_ENTITY_TYPES=["listing","agent","office"]as const;
export const ROLLOUT_STRATEGIES=["off","percentage","allowlist","all"]as const;
export type RolloutStrategy=typeof ROLLOUT_STRATEGIES[number];
