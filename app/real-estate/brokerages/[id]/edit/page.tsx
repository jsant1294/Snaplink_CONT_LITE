import CrmDedicatedForm from "@/components/real-estate/CrmDedicatedForm";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { return <CrmDedicatedForm resource="brokerages" id={(await params).id} />; }
