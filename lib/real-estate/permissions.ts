import type { RealEstateRole } from "./types";

export type RealEstatePermission =
  | "dashboard:view"
  | "properties:view"
  | "properties:manage"
  | "agents:view"
  | "agents:manage"
  | "brokerages:manage"
  | "clients:view"
  | "clients:manage"
  | "leads:view"
  | "leads:assign"
  | "campaigns:manage"
  | "open_houses:manage"
  | "analytics:view"
  | "transactions:view"
  | "transactions:manage"
  | "transactions:close"
  | "offers:manage"
  | "documents:manage"
  | "portal:manage"
  | "commissions:view"
  | "commissions:manage"
  | "reports:view"
  | "realEstate.ai.use"
  | "realEstate.ai.configure"
  | "realEstate.ai.review"
  | "realEstate.ai.viewUsage"
  | "realEstate.ai.viewOrganizationUsage"
  | "realEstate.ai.propertyDescription"
  | "realEstate.ai.leadScore"
  | "realEstate.ai.leadSummary"
  | "realEstate.ai.conversationSummary"
  | "realEstate.ai.transactionSummary"
  | "realEstate.ai.documentExtraction"
  | "realEstate.ai.offerComparison"
  | "realEstate.ai.inspectionSummary"
  | "realEstate.ai.brokerageInsights"
  | "realEstate.ai.marketInsights"
  | "settings:manage";

const ALL_PERMISSIONS: RealEstatePermission[] = [
  "dashboard:view", "properties:view", "properties:manage", "agents:view",
  "agents:manage", "brokerages:manage", "clients:view", "clients:manage",
  "leads:view", "leads:assign", "campaigns:manage", "open_houses:manage",
  "analytics:view", "transactions:view", "transactions:manage", "transactions:close",
  "offers:manage", "documents:manage", "portal:manage", "commissions:view",
  "commissions:manage", "reports:view", "settings:manage",
  "realEstate.ai.use", "realEstate.ai.configure", "realEstate.ai.review",
  "realEstate.ai.viewUsage", "realEstate.ai.viewOrganizationUsage",
  "realEstate.ai.propertyDescription", "realEstate.ai.leadScore", "realEstate.ai.leadSummary",
  "realEstate.ai.conversationSummary", "realEstate.ai.transactionSummary",
  "realEstate.ai.documentExtraction", "realEstate.ai.offerComparison",
  "realEstate.ai.inspectionSummary", "realEstate.ai.brokerageInsights", "realEstate.ai.marketInsights",
];

export const REAL_ESTATE_ROLE_PERMISSIONS: Record<
  RealEstateRole,
  readonly RealEstatePermission[]
> = {
  broker_owner: ALL_PERMISSIONS,
  administrator: ALL_PERMISSIONS,
  office_manager: ALL_PERMISSIONS.filter((permission) => !["brokerages:manage", "realEstate.ai.configure", "realEstate.ai.viewOrganizationUsage"].includes(permission)),
  listing_agent: [
    "dashboard:view", "properties:view", "properties:manage", "agents:view",
    "clients:view", "clients:manage", "leads:view", "leads:assign", "campaigns:manage",
    "open_houses:manage", "analytics:view",
    "transactions:view", "transactions:manage", "offers:manage", "documents:manage",
    "portal:manage", "commissions:view", "reports:view",
    "realEstate.ai.use", "realEstate.ai.review", "realEstate.ai.viewUsage",
    "realEstate.ai.propertyDescription", "realEstate.ai.leadScore", "realEstate.ai.leadSummary",
    "realEstate.ai.conversationSummary", "realEstate.ai.transactionSummary",
    "realEstate.ai.documentExtraction", "realEstate.ai.offerComparison",
    "realEstate.ai.inspectionSummary",
  ],
  marketing_coordinator: [
    "dashboard:view", "properties:view", "agents:view", "campaigns:manage",
    "open_houses:manage", "analytics:view",
    "reports:view",
    "realEstate.ai.use", "realEstate.ai.review", "realEstate.ai.viewUsage",
    "realEstate.ai.propertyDescription",
  ],
  transaction_coordinator: [
    "dashboard:view", "properties:view", "clients:view", "clients:manage",
    "leads:view", "open_houses:manage",
    "transactions:view", "transactions:manage", "transactions:close",
    "offers:manage", "documents:manage", "portal:manage", "commissions:view",
    "reports:view",
    "realEstate.ai.use", "realEstate.ai.review", "realEstate.ai.viewUsage",
    "realEstate.ai.leadScore", "realEstate.ai.leadSummary", "realEstate.ai.conversationSummary",
    "realEstate.ai.transactionSummary", "realEstate.ai.documentExtraction",
    "realEstate.ai.offerComparison", "realEstate.ai.inspectionSummary",
  ],
};

export function can(
  role: RealEstateRole,
  permission: RealEstatePermission
): boolean {
  return REAL_ESTATE_ROLE_PERMISSIONS[role].includes(permission);
}

export function canAny(
  role: RealEstateRole,
  permissions: RealEstatePermission[]
): boolean {
  return permissions.some((permission) => can(role, permission));
}

export function canAll(
  role: RealEstateRole,
  permissions: RealEstatePermission[]
): boolean {
  return permissions.every((permission) => can(role, permission));
}
