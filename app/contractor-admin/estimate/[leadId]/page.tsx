import Estimator from "@/components/admin/Estimator";

export const metadata = { title: "Estimator · SnapLink Contractor" };

export default async function EstimatePage({
  params,
}: {
  params: Promise<{ leadId: string }>;
}) {
  const { leadId } = await params;
  return <Estimator leadId={leadId} />;
}
