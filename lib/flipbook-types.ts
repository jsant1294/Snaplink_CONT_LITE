// ---------------------------------------------------------------------------
// Flipbook — a contractor's self-service multi-page swipeable brochure.
// Mirrors lib/money-types.ts conventions. See lib/db/schema.ts for the
// Postgres shape (flipCampaigns/flipPages).
// ---------------------------------------------------------------------------

export type FlipCampaignStatus = "draft" | "published" | "archived";
export type FlipPageType = "cover" | "image" | "text_image" | "offer" | "cta" | "contact";
export type FlipCtaType = "url" | "phone" | "sms" | "whatsapp";

export interface FlipCampaign {
  id: string;
  contractorId: string;
  slug: string;
  publicToken: string;
  title: string;
  status: FlipCampaignStatus;
  shareImageUrl?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface FlipPage {
  id: string;
  campaignId: string;
  sortOrder: number;
  pageType: FlipPageType;
  headline: string;
  body: string;
  mediaUrl?: string;
  ctaType?: FlipCtaType;
  ctaLabel?: string;
  ctaValue?: string;
  createdAt: string;
  updatedAt: string;
}
