// ---------------------------------------------------------------------------
// Southline Professional Intake — generated profile copy.
// Deterministic templates only, matching the SnapLink source pattern
// (docs/professional-intake/00-*, item 5: its "AI bio" is actually a
// synchronous client-side string template, no LLM call anywhere). Southline
// has no existing AI infrastructure for profile-copy generation to reuse, so
// per Phase 7's own ordering ("deterministic first, AI only if existing
// infra already supports it"), this stays template-only — there is nothing
// to "fall back" from, so profile creation can never be blocked by an AI call
// that was never made.
//
// Hard rule: every generated string is built ONLY from submitted answers.
// Sensitive claims (licenses, insurance, years of experience, certifications)
// are routed to generateOperatorNotes() — an operator-only string — and are
// never included in generateSummary/generateAbout/generateSeoDescription.
// ---------------------------------------------------------------------------

import { getHomeServiceCategory } from "../home-service-taxonomy.ts";
import { questionById, optionLabel } from "./questions.ts";
import type { IntakeAnswers } from "./types.ts";

type Lang = "en" | "es";

function str(answers: IntakeAnswers, key: string): string {
  const v = answers[key];
  return typeof v === "string" ? v.trim() : "";
}

export function generateServiceAreaSentence(answers: IntakeAnswers, lang: Lang): string {
  const city = str(answers, "serviceAreaCity");
  const state = str(answers, "serviceAreaState");
  if (!city && !state) return "";
  const place = [city, state].filter(Boolean).join(", ");
  return lang === "es" ? `Atendemos el área de ${place}.` : `Serving the ${place} area.`;
}

function primaryServiceLabel(answers: IntakeAnswers, lang: Lang): string {
  const id = str(answers, "primaryService");
  if (!id) return "";
  const category = getHomeServiceCategory(id);
  if (!category) return "";
  return lang === "es" ? category.labelEs : category.labelEn;
}

/** Short public summary (~1-2 sentences). Uses only idealCustomer/customerProblem/differentiator — never license/insurance/experience claims. */
export function generateSummary(answers: IntakeAnswers, lang: Lang): string {
  const parts = [str(answers, "idealCustomer"), str(answers, "customerProblem"), str(answers, "differentiator")].filter(Boolean);
  if (parts.length === 0) return "";
  return parts.join(" ").slice(0, 320);
}

/** Longer public About paragraph: service + area + summary, still claim-free. */
export function generateAbout(answers: IntakeAnswers, lang: Lang): string {
  const service = primaryServiceLabel(answers, lang);
  const areaSentence = generateServiceAreaSentence(answers, lang);
  const summary = generateSummary(answers, lang);
  const parts = [service ? (lang === "es" ? `Especialista en ${service}.` : `${service} specialist.`) : "", areaSentence, summary].filter(
    Boolean
  );
  return parts.join(" ");
}

export function generateSeoTitle(displayName: string, answers: IntakeAnswers, lang: Lang): string {
  const service = primaryServiceLabel(answers, lang);
  const city = str(answers, "serviceAreaCity");
  const parts = [displayName, service, city].filter(Boolean);
  return parts.join(" | ").slice(0, 70);
}

export function generateSeoDescription(answers: IntakeAnswers, lang: Lang): string {
  const about = generateAbout(answers, lang);
  return about.slice(0, 160);
}

const CTA_LABELS: Record<string, { en: string; es: string }> = {
  request_quote: { en: "Request a quote", es: "Solicitar una cotización" },
  book_consultation: { en: "Book a consultation", es: "Reservar una consulta" },
  call_now: { en: "Call now", es: "Llamar ahora" },
  view_portfolio: { en: "View portfolio", es: "Ver portafolio" },
  send_message: { en: "Send a message", es: "Enviar un mensaje" },
};

export function recommendCta(answers: IntakeAnswers, lang: Lang): string {
  const value = str(answers, "primaryCta");
  const match = CTA_LABELS[value];
  if (match) return lang === "es" ? match.es : match.en;
  const question = questionById("primaryCta");
  const option = question?.options?.find((o) => o.value === value);
  return option ? optionLabel(option, lang) : "";
}

/**
 * Operator-only note compiling sensitive claims (license/insurance/years/
 * certifications) that must never be published without explicit review —
 * this is deliberately NOT one of the public copy functions above.
 */
export function generateOperatorNotes(answers: IntakeAnswers): string {
  const parts: string[] = [];
  const experience = str(answers, "experienceQualifications");
  if (experience) parts.push(`Experience/qualifications (self-reported): ${experience}`);
  const years = str(answers, "yearsInBusiness");
  if (years) parts.push(`Years in business (self-reported): ${years}`);
  const license = str(answers, "licenseInfo") || str(answers, "licenseNumber");
  if (license) parts.push(`License (self-reported): ${license}`);
  if (answers.insuranceCarried === true) parts.push("Reports carrying liability insurance — verify before publishing.");
  return parts.join("\n");
}

export interface GeneratedCopy {
  summary: string;
  about: string;
  serviceAreaSentence: string;
  seoTitle: string;
  seoDescription: string;
  ctaRecommendation: string;
  operatorNotes: string;
}

export function generateProfileCopy(displayName: string, answers: IntakeAnswers, lang: Lang): GeneratedCopy {
  return {
    summary: generateSummary(answers, lang),
    about: generateAbout(answers, lang),
    serviceAreaSentence: generateServiceAreaSentence(answers, lang),
    seoTitle: generateSeoTitle(displayName, answers, lang),
    seoDescription: generateSeoDescription(answers, lang),
    ctaRecommendation: recommendCta(answers, lang),
    operatorNotes: generateOperatorNotes(answers),
  };
}
