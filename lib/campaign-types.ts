// ---------------------------------------------------------------------------
// Mini Campaign — a contractor's self-service single-page bilingual promo
// with one CTA. Mirrors lib/flipbook-types.ts conventions. See lib/db/schema.ts
// for the Postgres shape (campaigns table).
// ---------------------------------------------------------------------------

export type CampaignStatus = "draft" | "scheduled" | "active" | "expired" | "archived";
export type CampaignCtaType = "url" | "phone" | "sms" | "whatsapp";

export interface Campaign {
  id: string;
  contractorId: string;
  slug: string;
  status: CampaignStatus;
  titleEn: string;
  titleEs: string;
  bodyEn: string;
  bodyEs: string;
  mediaUrl?: string;
  ctaType: CampaignCtaType;
  ctaValue: string;
  startsAt?: string;
  endsAt?: string;
  createdAt: string;
  updatedAt: string;
}
