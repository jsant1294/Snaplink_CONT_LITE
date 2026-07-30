import PropertyForm from "@/components/real-estate/PropertyForm";

export default async function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  return <PropertyForm propertyId={(await params).id} />;
}
