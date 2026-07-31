import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { contractorStore, campaignStore } from "@/lib/store";
import type { Campaign } from "@/lib/campaign-types";
import type { Lang } from "@/lib/southline-i18n";

export const dynamic = "force-dynamic";

function isLive(campaign: Campaign): boolean {
  if (campaign.status !== "active") return false;
  const now = Date.now();
  if (campaign.startsAt && now < Date.parse(campaign.startsAt)) return false;
  if (campaign.endsAt && now > Date.parse(campaign.endsAt)) return false;
  return true;
}

function ctaHref(campaign: Campaign): string {
  switch (campaign.ctaType) {
    case "phone":
      return `tel:${campaign.ctaValue}`;
    case "sms":
      return `sms:${campaign.ctaValue}`;
    case "whatsapp":
      return `https://wa.me/${campaign.ctaValue.replace(/[^0-9]/g, "")}`;
    case "url":
    default:
      return campaign.ctaValue.startsWith("http") ? campaign.ctaValue : `https://${campaign.ctaValue}`;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string; slug: string }>;
}): Promise<Metadata> {
  const { username, slug } = await params;
  const contractor = await contractorStore.getByUsername(username);
  if (!contractor) return {};
  const campaign = await campaignStore.getBySlug(contractor.id, slug);
  if (!campaign || !isLive(campaign)) return {};
  return { title: campaign.titleEn };
}

export default async function CampaignPage({
  params,
}: {
  params: Promise<{ username: string; slug: string }>;
}) {
  const { username, slug } = await params;
  const contractor = await contractorStore.getByUsername(username);
  if (!contractor) notFound();
  const campaign = await campaignStore.getBySlug(contractor.id, slug);
  if (!campaign || !isLive(campaign)) notFound();

  const cookieStore = await cookies();
  const lang = (cookieStore.get("sl_lang")?.value ?? "en") as Lang;
  const title = lang === "es" ? campaign.titleEs || campaign.titleEn : campaign.titleEn;
  const body = lang === "es" ? campaign.bodyEs || campaign.bodyEn : campaign.bodyEn;

  return (
    <div className="relative flex min-h-dvh w-full flex-col items-center justify-end overflow-hidden bg-obsidian">
      {campaign.mediaUrl && (
        <img src={campaign.mediaUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />
      <div className="relative z-10 w-full max-w-lg px-6 pb-16 pt-10 text-center text-cream">
        <p className="text-xs uppercase tracking-[0.3em] text-gold">{contractor.businessName}</p>
        <h1 className="font-display mt-3 text-3xl sm:text-4xl">{title}</h1>
        {body && <p className="mt-3 text-sm text-bone/90 sm:text-base">{body}</p>}
        <a
          href={ctaHref(campaign)}
          target={campaign.ctaType === "url" ? "_blank" : undefined}
          rel={campaign.ctaType === "url" ? "noopener noreferrer" : undefined}
          className="mt-6 inline-block rounded-full bg-gold px-8 py-3 text-sm font-semibold text-obsidian"
        >
          {lang === "es" ? "Contactar" : "Contact"}
        </a>
      </div>
    </div>
  );
}
