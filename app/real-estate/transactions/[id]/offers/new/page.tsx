import OfferForm from "@/components/real-estate/OfferForm";
export default async function NewOffer({ params }: { params: Promise<{ id: string }> }) { return <OfferForm transactionId={(await params).id} />; }
