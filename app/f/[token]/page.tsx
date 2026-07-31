import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { flipCampaignStore, flipPageStore } from "@/lib/store";
import FlipbookViewer from "@/components/flipbook/FlipbookViewer";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const campaign = await flipCampaignStore.getByToken(token);
  if (!campaign || campaign.status !== "published") return {};
  return {
    title: campaign.title,
    openGraph: {
      title: campaign.title,
      images: campaign.shareImageUrl ? [{ url: campaign.shareImageUrl }] : undefined,
    },
  };
}

export default async function FlipbookPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const campaign = await flipCampaignStore.getByToken(token);
  if (!campaign || campaign.status !== "published") notFound();
  const pages = await flipPageStore.listByCampaign(campaign.id);
  return <FlipbookViewer campaign={campaign} pages={pages} />;
}
