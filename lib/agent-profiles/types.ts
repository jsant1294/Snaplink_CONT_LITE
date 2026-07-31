export type AgentProfileStatus = "pending" | "active" | "suspended";
export type AgentProfileTier = "basic" | "professional" | "featured";

export interface AgentProfile {
  id: string;
  slug: string;
  status: AgentProfileStatus;
  pin?: string;
  name: string;
  brokerageName: string;
  licenseNumber: string;
  phone: string;
  email: string;
  serviceArea: string;
  bio: string;
  tagline?: string;
  photoUrl?: string;
  languages: string[];
  specialties: string[];
  serviceAreas: string[];
  yearsExperience?: number;
  tier?: AgentProfileTier;
  billingTenantId?: string;
  billingOrganizationId?: string;
  billingSubscriptionId?: string;
  createdAt: string;
  updatedAt: string;
}

/** Fields a public request form may submit. Never includes status/pin/tier/billing. */
export interface AgentProfileRequestInput {
  name: string;
  email: string;
  phone: string;
  serviceArea: string;
  brokerageName?: string;
  licenseNumber?: string;
  bio?: string;
  tagline?: string;
  photoUrl?: string;
  languages?: string[];
  specialties?: string[];
  serviceAreas?: string[];
  yearsExperience?: number;
}

/** Fields an agent may edit on their own profile with their own PIN. */
export const SELF_EDITABLE_FIELDS = ["bio", "tagline", "photoUrl", "languages", "specialties", "serviceAreas"] as const;
export type SelfEditableField = typeof SELF_EDITABLE_FIELDS[number];
