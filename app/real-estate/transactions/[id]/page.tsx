import TransactionDetail from "@/components/real-estate/TransactionDetail";
export default async function TransactionPage({ params }: { params: Promise<{ id: string }> }) { return <TransactionDetail id={(await params).id} />; }
