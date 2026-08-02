// ---------------------------------------------------------------------------
// Southline Professional Intake — shared engine types.
// One question registry, one normalization/mapping/copy engine, used by BOTH
// the contractor identity system (lib/types.ts) and the agent/professional
// identity system (lib/agent-profiles/types.ts). The engine never merges
// those two stores — see lib/professional-intake/profile-map.ts for the two
// separate, explicit field-mapping adapters.
// ---------------------------------------------------------------------------

/** Which identity system owns the profile this session will fill in. */
export type IntakeOwnerType = "contractor" | "agent";

export type IntakeQuestionType =
  | "text"
  | "textarea"
  | "select"
  | "multiselect"
  | "phone"
  | "email"
  | "url"
  | "boolean"
  | "image";

export interface IntakeQuestionOption {
  value: string;
  labelEn: string;
  labelEs: string;
}

export interface IntakeQuestion {
  /** Generic semantic id, shared by both owner types — see profile-map.ts for how it resolves per owner type. */
  id: string;
  /** Wizard step number. Multiple questions may share a step (grouped fields, e.g. city/state/zip). */
  step: number;
  type: IntakeQuestionType;

  labelEn: string;
  labelEs: string;
  helpEn?: string;
  helpEs?: string;

  required: boolean;

  /** Undefined = applies to both owner types. */
  ownerTypes?: IntakeOwnerType[];
  /** Undefined = applies to every profession. Matches Contractor.professionType / AgentProfile.professionType ids. */
  professionTypes?: string[];
  /** Undefined = not taxonomy-gated. Restricts to professions in these home-service-taxonomy category ids. */
  categoryIds?: string[];

  options?: IntakeQuestionOption[];

  /** Generic profile-target hint used only for documentation/preview labeling — the real mapping lives in profile-map.ts. */
  profileTargets?: string[];

  /** Max chars enforced server-side by normalize.ts (text/textarea only). */
  maxLength?: number;
  /** Max items enforced server-side by normalize.ts (multiselect/image only). */
  maxItems?: number;
}

/** Answers are a flat bag keyed by IntakeQuestion.id. Shape is intentionally loose — normalize.ts is the single point of truth for what a "clean" value looks like. */
export type IntakeAnswers = Record<string, unknown>;

export type IntakeSessionStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "applied"
  | "archived";

export interface IntakeSession {
  id: string;
  ownerType: IntakeOwnerType;
  ownerId: string;
  status: IntakeSessionStatus;
  locale: "en" | "es";
  currentStep: number;
  answers: IntakeAnswers;
  /** Ids of questions whose answer failed strict validation but was preserved for operator review rather than silently dropped. */
  flaggedQuestionIds: string[];
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  appliedAt?: string;
  archivedAt?: string;
  /** Content-approval step, distinct from appliedAt — see docs/professional-intake-payment/04-approve-save-publish.md. */
  contentApprovedAt?: string | null;
  contentApprovedBy?: string | null;
}

/** How applying a session's answers interacts with a profile's existing (possibly non-empty) fields. */
export type ProfileApplyMode = "fill_empty" | "replace_selected" | "replace_all";

export interface ProfileFieldPreview {
  /** Generic answer/field id (matches the map key in profile-map.ts). */
  field: string;
  sourceQuestionId?: string;
  currentValue: unknown;
  proposedValue: unknown;
  changed: boolean;
  /** True for fields that touch licenses/insurance/experience claims — surfaced with a review warning, never auto-applied silently. */
  sensitive: boolean;
}
