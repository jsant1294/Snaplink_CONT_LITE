import ProtectedRealEstate from "@/components/real-estate/ProtectedRealEstate";
import ProfessionalShell from "@/components/real-estate/ProfessionalShell";

export default function RealEstateLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRealEstate><ProfessionalShell>{children}</ProfessionalShell></ProtectedRealEstate>;
}
