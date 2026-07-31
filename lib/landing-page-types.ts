// ---------------------------------------------------------------------------
// Contractor landing page — a marketing layer on top of the existing public
// contractor page (see lib/db/schema.ts contractorLandingPages for the why).
// ---------------------------------------------------------------------------

export interface ContractorLandingPage {
  id: string;
  contractorId: string;
  templateKey?: string;
  published: boolean;
  headlineEn?: string;
  headlineEs?: string;
  subheadlineEn?: string;
  subheadlineEs?: string;
  ctaLabelEn?: string;
  ctaLabelEs?: string;
  ctaUrl?: string;
  locationText?: string;
  hoursText?: string;
  noteText?: string;
  heroImageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type LandingPagePatch = Partial<
  Pick<
    ContractorLandingPage,
    | "templateKey"
    | "published"
    | "headlineEn"
    | "headlineEs"
    | "subheadlineEn"
    | "subheadlineEs"
    | "ctaLabelEn"
    | "ctaLabelEs"
    | "ctaUrl"
    | "locationText"
    | "hoursText"
    | "noteText"
    | "heroImageUrl"
  >
>;
