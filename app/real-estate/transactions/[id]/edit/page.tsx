import TransactionDetail from "@/components/real-estate/TransactionDetail";
export default async function EditTransactionPage({ params }: { params: Promise<{ id: string }> }) { return <TransactionDetail id={(await params).id} />; }
