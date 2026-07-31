// Premium demo content for the homepage's "Featured Services Marketplace" section
// (mirrors lib/real-estate/fixtures.ts's demoProperties pattern). Real contractors
// don't yet have portfolio project photos, years-of-experience, or logo/headshot
// fields — this fixture exists so the section can ship with the rich editorial
// layout the Homes section established, without fabricating those fields on real
// records. Swap for a real query once SnapLink Profiles carry this data; the
// FeaturedServicesEntryBlock component itself doesn't need to change.
export interface FeaturedProfessionalCard {
  id: string;
  companyName: string;
  projectType: string;
  location: string;
  yearsExperience: number;
  heroImage: string;
  logoUrl: string;
  headshotUrl: string;
  specialties: string[];
  languages: string[];
  profileHref: string;
}

// Deliberately a fictional company name — never reuse a real seeded contractor's
// name here, since the rest of this fixture (years, specialties, project) is
// illustrative and would misattribute fabricated claims to a real business.
export const DEMO_FEATURED_PROFESSIONAL: FeaturedProfessionalCard = {
  id: "demo-featured-pro-1",
  companyName: "Hearth & Home Renovations (Demo)",
  projectType: "Whole Home Renovation",
  location: "Alpharetta, GA",
  yearsExperience: 14,
  heroImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=86",
  logoUrl: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=200&q=85",
  headshotUrl: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=200&q=85",
  specialties: ["Whole home renovation", "Kitchen remodeling", "Custom cabinetry"],
  languages: ["English", "Español"],
  // No real profile page exists for demo content — send interested visitors to the
  // real professionals grid rather than a fake dead link.
  profileHref: "/#professionals",
};
