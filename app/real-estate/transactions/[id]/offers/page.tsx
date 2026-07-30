import TransactionDetail from "@/components/real-estate/TransactionDetail";
export default async function OffersPage({ params }: { params: Promise<{ id: string }> }) { return <TransactionDetail id={(await params).id} />; }
