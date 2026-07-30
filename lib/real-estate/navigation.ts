import type { IconName } from "@/components/real-estate/Icon";

export const REAL_ESTATE_SECTIONS = [
  "properties", "agents", "brokerages", "buyers", "sellers", "leads",
  "showings", "open-houses", "campaigns", "marketing-assets", "qr-codes", "reviews",
  "analytics", "settings",
] as const;

export type RealEstateSection = (typeof REAL_ESTATE_SECTIONS)[number];

export const REAL_ESTATE_SECTION_META: Record<RealEstateSection, {
  title: string;
  description: string;
  icon: IconName;
}> = {
  properties: { title: "Properties", description: "Manage listing details, media, publishing, and showing information.", icon: "home" },
  agents: { title: "Agents", description: "Professional profiles, service areas, specialties, and booking availability.", icon: "user" },
  brokerages: { title: "Brokerages", description: "Office profiles, locations, teams, and brand information.", icon: "office" },
  buyers: { title: "Buyers", description: "Buyer criteria, budgets, timelines, tasks, and appointments.", icon: "users" },
  sellers: { title: "Sellers", description: "Seller goals, property details, timelines, tasks, and consultations.", icon: "users" },
  leads: { title: "Lead Pipeline", description: "A future workspace for qualifying and assigning opportunities.", icon: "lead" },
  showings: { title: "Showings", description: "Property showing requests, approvals, assignments, and notes.", icon: "calendar" },
  "open-houses": { title: "Open Houses", description: "Showing schedules, visitor registration, and event follow-up.", icon: "calendar" },
  campaigns: { title: "Campaigns", description: "Property-centered marketing campaign planning.", icon: "campaign" },
  "marketing-assets": { title: "Marketing Assets", description: "Flyers, brochures, social graphics, and signage.", icon: "image" },
  "qr-codes": { title: "QR Codes", description: "Property, agent, open-house, review, and brochure QR experiences.", icon: "qr" },
  reviews: { title: "Reviews", description: "Review collection and testimonial presentation planning.", icon: "star" },
  analytics: { title: "Analytics", description: "Views, scans, appointments, leads, and conversion reporting.", icon: "chart" },
  settings: { title: "Settings", description: "Future brokerage identity, language, role, and integration controls.", icon: "settings" },
};

export function isRealEstateSection(value: string): value is RealEstateSection {
  return REAL_ESTATE_SECTIONS.includes(value as RealEstateSection);
}
