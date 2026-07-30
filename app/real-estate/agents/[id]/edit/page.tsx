import CrmDedicatedForm from "@/components/real-estate/CrmDedicatedForm";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { return <CrmDedicatedForm resource="agents" id={(await params).id} />; }
