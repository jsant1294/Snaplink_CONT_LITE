import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { contractorStore, landingPageStore } from "@/lib/store";
import { isPublicContractor } from "@/lib/southline-search";
import type { Lang } from "@/lib/southline-i18n";
import Header from "@/components/southline/Header";
import Footer from "@/components/southline/Footer";
import ContractorPublicPage from "@/components/intake/ContractorPublicPage";
import LucioMount from "@/components/lucio/LucioMount";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const contractor = await contractorStore.getByUsername(username);
  if (!contractor || !isPublicContractor(contractor)) return {};

  const page = await landingPageStore.get(contractor.id);
  const title = (page?.published && page.headlineEn) || `${contractor.businessName} | SnapLink Contractor`;
  const description = (page?.published && page.subheadlineEn) || contractor.tagline || contractor.serviceArea;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: page?.published && page.heroImageUrl ? [{ url: page.heroImageUrl }] : undefined,
    },
  };
}

export default async function ContractorProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const cookieStore = await cookies();
  const lang = (cookieStore.get("sl_lang")?.value ?? "en") as Lang;
  const contractor = await contractorStore.getByUsername(username);
  if (!contractor || !isPublicContractor(contractor)) notFound();
  const landingPage = await landingPageStore.get(contractor.id);

  return (
    <>
      <Header lang={lang} />
      <div className="bg-[#EEE7DA] py-6">
        <ContractorPublicPage contractor={contractor} landingPage={landingPage} lang={lang} />
      </div>
      <Footer lang={lang} />
      <LucioMount lang={lang} pageContext={{ type: "contractor", ref: contractor.username }} />
    </>
  );
}
