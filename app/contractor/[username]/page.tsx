import { notFound } from "next/navigation";
import { contractorStore } from "@/lib/store";
import ContractorPublicPage from "@/components/intake/ContractorPublicPage";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const contractor = await contractorStore.getByUsername(username);
  if (!contractor) notFound();
  return <ContractorPublicPage contractor={contractor} />;
}
