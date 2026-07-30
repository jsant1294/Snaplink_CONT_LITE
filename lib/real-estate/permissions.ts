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
  | "settings:manage";

const ALL_PERMISSIONS: RealEstatePermission[] = [
  "dashboard:view", "properties:view", "properties:manage", "agents:view",
  "agents:manage", "brokerages:manage", "clients:view", "clients:manage",
  "leads:view", "leads:assign", "campaigns:manage", "open_houses:manage",
  "analytics:view", "settings:manage",
];

export const REAL_ESTATE_ROLE_PERMISSIONS: Record<
  RealEstateRole,
  readonly RealEstatePermission[]
> = {
  broker_owner: ALL_PERMISSIONS,
  administrator: ALL_PERMISSIONS,
  office_manager: ALL_PERMISSIONS.filter((permission) => permission !== "brokerages:manage"),
  listing_agent: [
    "dashboard:view", "properties:view", "properties:manage", "agents:view",
    "clients:view", "clients:manage", "leads:view", "leads:assign", "campaigns:manage",
    "open_houses:manage", "analytics:view",
  ],
  marketing_coordinator: [
    "dashboard:view", "properties:view", "agents:view", "campaigns:manage",
    "open_houses:manage", "analytics:view",
  ],
  transaction_coordinator: [
    "dashboard:view", "properties:view", "clients:view", "clients:manage",
    "leads:view", "open_houses:manage",
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
