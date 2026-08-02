// ---------------------------------------------------------------------------
// Southline Professional Intake — answer normalization.
// Deterministic, server-side. Closes the gaps found in the SnapLink source
// audit (docs/professional-intake/00-snaplink-intake-audit.md item 10):
// that system only trims strings, with no length caps, no HTML stripping,
// and no phone/URL/taxonomy normalization at all.
// ---------------------------------------------------------------------------

import { resolveCategoryId } from "../home-service-taxonomy.ts";
import { getQuestionsFor, questionById } from "./questions.ts";
import type { IntakeAnswers, IntakeOwnerType, IntakeQuestion } from "./types.ts";

const DEFAULT_MAX_LENGTH = 500;
const DEFAULT_MAX_ITEMS = 10;

export function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, "").replace(/[<>]/g, "");
}

export function trimString(value: unknown, maxLength = DEFAULT_MAX_LENGTH): string {
  if (typeof value !== "string") return "";
  return stripHtml(value).trim().slice(0, maxLength);
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function normalizeEmail(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase().slice(0, 254);
}

/** Best-effort E.164-ish normalization: keep a leading "+" and digits only. Never rejects — malformed input is preserved for operator review via the caller's flag. */
export function normalizePhone(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/[^\d]/g, "");
  if (!digits) return "";
  return (hasPlus ? "+" : "") + digits.slice(0, 15);
}

export function isValidPhone(value: string): boolean {
  const digits = value.replace(/[^\d]/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

export function normalizeUrl(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return withScheme.slice(0, 500);
}

export function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function dedupeArray(values: string[]): string[] {
  return Array.from(new Set(values.filter((v) => v.trim().length > 0)));
}

/** Resolves a list of taxonomy-ish strings against the shared category registry. Unknown values are never silently dropped — the caller decides whether to flag or discard. */
export function resolveTaxonomyIds(values: string[]): { resolved: string[]; unknown: string[] } {
  const resolved: string[] = [];
  const unknown: string[] = [];
  for (const raw of dedupeArray(values)) {
    const id = resolveCategoryId(raw);
    if (id) resolved.push(id);
    else unknown.push(raw);
  }
  return { resolved: dedupeArray(resolved), unknown };
}

export interface NormalizeResult {
  answers: IntakeAnswers;
  /** Question ids whose value failed validation but was preserved (not silently dropped). */
  flaggedQuestionIds: string[];
  warnings: string[];
}

const TAXONOMY_QUESTION_IDS = new Set(["primaryService", "additionalServices"]);

function normalizeOneAnswer(
  question: IntakeQuestion,
  raw: unknown
): { value: unknown; flagged: boolean; warning?: string } {
  const maxLength = question.maxLength ?? DEFAULT_MAX_LENGTH;
  const maxItems = question.maxItems ?? DEFAULT_MAX_ITEMS;

  switch (question.type) {
    case "text":
    case "textarea":
      return { value: trimString(raw, maxLength), flagged: false };

    case "boolean":
      return { value: raw === true || raw === "true", flagged: false };

    case "email": {
      const value = normalizeEmail(raw);
      if (value && !isValidEmail(value)) {
        return { value, flagged: true, warning: `${question.id}: invalid email format, kept for review` };
      }
      return { value, flagged: false };
    }

    case "phone": {
      const value = normalizePhone(raw);
      if (value && !isValidPhone(value)) {
        return { value, flagged: true, warning: `${question.id}: invalid phone format, kept for review` };
      }
      return { value, flagged: false };
    }

    case "url": {
      const value = normalizeUrl(raw);
      if (value && !isValidUrl(value)) {
        return { value, flagged: true, warning: `${question.id}: invalid URL format, kept for review` };
      }
      return { value, flagged: false };
    }

    case "select": {
      const value = trimString(raw, 120);
      if (value && question.options && !question.options.some((o) => o.value === value)) {
        return { value, flagged: true, warning: `${question.id}: unrecognized option "${value}", kept for review` };
      }
      return { value, flagged: false };
    }

    case "multiselect":
    case "image": {
      const rawArray = Array.isArray(raw) ? raw.filter((v): v is string => typeof v === "string") : [];
      const deduped = dedupeArray(rawArray).slice(0, maxItems);

      if (question.type === "image") {
        return { value: deduped, flagged: false };
      }

      if (TAXONOMY_QUESTION_IDS.has(question.id)) {
        const { resolved, unknown } = resolveTaxonomyIds(deduped);
        if (unknown.length > 0) {
          return {
            value: resolved,
            flagged: true,
            warning: `${question.id}: unrecognized value(s) ${unknown.join(", ")} dropped, flagged for review`,
          };
        }
        return { value: resolved, flagged: false };
      }

      if (question.options) {
        const validValues = new Set(question.options.map((o) => o.value));
        const known = deduped.filter((v) => validValues.has(v));
        const unknown = deduped.filter((v) => !validValues.has(v));
        if (unknown.length > 0) {
          return {
            value: known,
            flagged: true,
            warning: `${question.id}: unrecognized option(s) ${unknown.join(", ")} dropped, flagged for review`,
          };
        }
        return { value: known, flagged: false };
      }

      return { value: deduped, flagged: false };
    }

    default:
      return { value: raw, flagged: false };
  }
}

/** Normalizes a raw answer bag against every question that applies to this owner type/profession. Never guesses unknown taxonomy values — they are flagged, not silently resolved. */
export function normalizeAnswers(
  ownerType: IntakeOwnerType,
  professionType: string | undefined,
  rawAnswers: IntakeAnswers
): NormalizeResult {
  const questions = getQuestionsFor(ownerType, professionType);
  const answers: IntakeAnswers = {};
  const flaggedQuestionIds: string[] = [];
  const warnings: string[] = [];

  for (const question of questions) {
    if (!(question.id in rawAnswers)) continue;
    const { value, flagged, warning } = normalizeOneAnswer(question, rawAnswers[question.id]);
    answers[question.id] = value;
    if (flagged) flaggedQuestionIds.push(question.id);
    if (warning) warnings.push(warning);
  }

  // Preserve any answers for questions outside the current conditional set
  // (e.g. profession changed mid-session) rather than silently dropping them.
  for (const [id, value] of Object.entries(rawAnswers)) {
    if (id in answers) continue;
    const question = questionById(id);
    if (!question) continue;
    answers[id] = value;
  }

  return { answers, flaggedQuestionIds: dedupeArray(flaggedQuestionIds), warnings };
}

/** Required-question completeness check, used before allowing submit. */
export function missingRequiredQuestions(
  ownerType: IntakeOwnerType,
  professionType: string | undefined,
  answers: IntakeAnswers
): string[] {
  const questions = getQuestionsFor(ownerType, professionType);
  const missing: string[] = [];
  for (const q of questions) {
    if (!q.required) continue;
    const value = answers[q.id];
    const isEmpty =
      value === undefined ||
      value === null ||
      (typeof value === "string" && value.trim().length === 0) ||
      (Array.isArray(value) && value.length === 0);
    if (isEmpty) missing.push(q.id);
  }
  return missing;
}
