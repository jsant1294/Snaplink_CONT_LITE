import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { contractorStore } from "@/lib/store";
import type { Lang } from "@/lib/southline-i18n";
import Header from "@/components/southline/Header";
import Footer from "@/components/southline/Footer";
import ContractorPublicPage from "@/components/intake/ContractorPublicPage";
import LucioMount from "@/components/lucio/LucioMount";

export const dynamic = "force-dynamic";

export default async function ContractorProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const cookieStore = await cookies();
  const lang = (cookieStore.get("sl_lang")?.value ?? "en") as Lang;
  const contractor = await contractorStore.getByUsername(username);
  if (!contractor) notFound();

  return (
    <>
      <Header lang={lang} />
      <div className="bg-[#EEE7DA] py-6">
        <ContractorPublicPage contractor={contractor} />
      </div>
      <Footer lang={lang} />
      <LucioMount lang={lang} pageContext={{ type: "contractor", ref: contractor.username }} />
    </>
  );
}
