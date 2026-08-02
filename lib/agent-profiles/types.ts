// ---------------------------------------------------------------------------
// Account / publishing / onboarding are three SEPARATE status axes — never
// overload one field for all three (see docs/architecture/AGENT_MANAGEMENT.md).
//
//  - AgentProfileStatus  → the ACCOUNT: does this professional exist / can
//    they sign in at all.
//  - SnaplinkStatus      → is the SnapLink profile (the client-owned asset,
//    /p/{username}) live.
//  - SouthlineStatus     → is the Southline Living discovery listing
//    (/agents/{slug}) live, and is it featured.
// ---------------------------------------------------------------------------
export type AgentProfileStatus = "pending" | "active" | "suspended" | "archived";
// Canonical since the tier-entitlement automation pass (see lib/agent-profiles/tiers.ts).
// Legacy stored values "basic"/"featured" are never rewritten automatically —
// resolveAgentTier() maps them to "solo"/"growth" for interpretation only.
export type AgentProfileTier = "solo" | "professional" | "business" | "growth" | "enterprise";
export type SnaplinkStatus = "draft" | "published" | "unpublished";
export type SouthlineStatus = "draft" | "published" | "featured" | "hidden";
export type OnboardingStatus =
  | "not_started"
  | "invited"
  | "profile_incomplete"
  | "ready"
  | "approved"
  | "launched";
export type PreferredLanguage = "en" | "es" | "both";

/** SnapLink owns lead/booking/marketing modules. Southline never reads these directly. */
export type AgentModuleKey =
  | "booking"
  | "leads"
  | "campaigns"
  | "flipbooks"
  | "invoices"
  | "money"
  | "analytics"
  | "qr"
  | "nfc";

export const AGENT_MODULE_KEYS: AgentModuleKey[] = [
  "booking",
  "leads",
  "campaigns",
  "flipbooks",
  "invoices",
  "money",
  "analytics",
  "qr",
  "nfc",
];

export type AgentModules = Partial<Record<AgentModuleKey, boolean>>;

export interface AgentProfile {
  id: string;
  slug: string;
  username?: string;
  status: AgentProfileStatus;
  pin?: string;
  /** Canonical profession — any LICENSED_PROFESSION_TYPES id or PROFESSION_TYPES trade id. Default "realtor". */
  professionType: string;
  name: string;
  firstName: string;
  lastName: string;
  displayName: string;
  brokerageName: string;
  officeName: string;
  teamName: string;
  licenseNumber: string;
  licenseState: string;
  phone: string;
  email: string;
  serviceArea: string;
  bio: string;
  tagline?: string;
  photoUrl?: string;
  coverPhotoUrl?: string;
  preferredLanguage: PreferredLanguage;
  smsPhone: string;
  whatsapp: string;
  website: string;
  bookingLink: string;
  facebook: string;
  instagram: string;
  linkedin: string;
  languages: string[];
  specialties: string[];
  serviceAreas: string[];
  categories: string[];
  neighborhoods: string[];
  serviceRadius?: number;
  yearsExperience?: number;
  featured: boolean;
  snaplinkStatus: SnaplinkStatus;
  southlineStatus: SouthlineStatus;
  onboardingStatus: OnboardingStatus;
  seoTitle?: string;
  seoDescription?: string;
  marketplaceSummary?: string;
  modules: AgentModules;
  tier?: AgentProfileTier;
  billingTenantId?: string;
  billingOrganizationId?: string;
  billingSubscriptionId?: string;
  createdAt: string;
  updatedAt: string;
}

/** Fields a public request form may submit. Never includes status/pin/tier/billing/modules. */
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

/**
 * The operator-driven "New Agent" workflow (Phase 3/4 of the Agent Management
 * slice). One transaction: creates the account, the SnapLink profile, and the
 * Southline listing together — see lib/agent-profiles/store.ts `createAgent`.
 */
export interface AgentOperatorCreateInput {
  // Identity
  firstName: string;
  lastName: string;
  displayName?: string;
  username: string;
  slug?: string;
  email: string;
  phone: string;
  photoUrl?: string;
  coverPhotoUrl?: string;
  preferredLanguage?: PreferredLanguage;
  pin: string;

  // Professional
  brokerageName?: string;
  officeName?: string;
  teamName?: string;
  licenseNumber?: string;
  licenseState?: string;
  yearsExperience?: number;
  specialties?: string[];
  serviceArea?: string;
  serviceAreas?: string[];
  bio?: string;
  tagline?: string;
  languages?: string[];

  // Profession
  professionType?: string;

  // Contact
  smsPhone?: string;
  whatsapp?: string;
  website?: string;
  bookingLink?: string;
  facebook?: string;
  instagram?: string;
  linkedin?: string;

  // Marketplace
  featured?: boolean;
  categories?: string[];
  neighborhoods?: string[];
  serviceRadius?: number;
  seoTitle?: string;
  seoDescription?: string;
  marketplaceSummary?: string;

  // SnapLink
  tier?: AgentProfileTier;
  modules?: AgentModules;

  // Publishing
  status?: AgentProfileStatus;
  snaplinkStatus?: SnaplinkStatus;
  southlineStatus?: SouthlineStatus;
}

/** Reserved so a username/slug can never shadow an existing top-level app route. */
export const RESERVED_IDENTIFIERS = [
  "agents",
  "p",
  "admin",
  "api",
  "book",
  "c",
  "contact",
  "contractor",
  "contractor-admin",
  "diy",
  "f",
  "faq",
  "for-contractors",
  "homes",
  "how-it-works",
  "i",
  "ideas",
  "planner",
  "portal",
  "real-estate",
  "results",
  "snaplink",
  "southline",
  "new",
  "edit",
];

/**
 * Fields an agent may edit on their own profile with their own PIN. Kept
 * identical to the original slice — contact-channel fields (whatsapp,
 * website, socials, etc.) are operator-editable only for now via
 * OPERATOR_EDITABLE_FIELDS in app/api/agent-profiles/[id]/route.ts.
 */
export const SELF_EDITABLE_FIELDS = ["bio", "tagline", "photoUrl", "languages", "specialties", "serviceAreas"] as const;
export type SelfEditableField = typeof SELF_EDITABLE_FIELDS[number];
