// ---------------------------------------------------------------------------
// SnapLink Professional — profession type taxonomy.
// Mirrors lib/services.ts's SERVICE_CATEGORIES shape. Additive to the existing
// `contractors` table (professionType column) — every professional category
// still uses the same SnapLink operator/store/profile architecture.
//
// Deliberately excludes "realtor" and "mortgage_broker": those are already
// served by a dedicated, more fully-featured self-service system
// (lib/agent-profiles/*, public profiles at /agents/[slug]). Adding them here
// too would duplicate that system rather than reuse it.
//
// Photo URLs are premium placeholder photography (images.unsplash.com, the
// same CDN/convention used everywhere else in this app) — used only when a
// professional has no uploaded logo/headshot/storefront/portfolio photo,
// which is every professional today since none of those fields exist yet.
// ---------------------------------------------------------------------------

export interface ProfessionType {
  id: string;
  en: string;
  es: string;
}

export const PROFESSION_TYPES: ProfessionType[] = [
  { id: "contractor", en: "General Contractor", es: "Contratista General" },
  { id: "remodeler", en: "Remodeler", es: "Remodelador" },
  { id: "home_builder", en: "Home Builder", es: "Constructor de Casas" },
  { id: "interior_designer", en: "Interior Designer", es: "Diseñador de Interiores" },
  { id: "architect", en: "Architect", es: "Arquitecto" },
  { id: "landscaper", en: "Landscaper", es: "Paisajista" },
  { id: "electrician", en: "Electrician", es: "Electricista" },
  { id: "plumber", en: "Plumber", es: "Plomero" },
  { id: "hvac", en: "HVAC", es: "Climatización (HVAC)" },
  { id: "roofing", en: "Roofing", es: "Techado" },
  { id: "painting", en: "Painting", es: "Pintura" },
  { id: "flooring", en: "Flooring", es: "Pisos" },
  { id: "cabinet_maker", en: "Cabinet Maker", es: "Ebanista" },
  { id: "home_inspector", en: "Home Inspector", es: "Inspector de Casas" },
  { id: "window_company", en: "Windows", es: "Ventanas" },
  { id: "solar", en: "Solar", es: "Energía Solar" },
  { id: "pool_builder", en: "Pool Builder", es: "Constructor de Piscinas" },
];

const PROFESSION_IDS = new Set(PROFESSION_TYPES.map((p) => p.id));
export const DEFAULT_PROFESSION_TYPE = "contractor";

export function isValidProfessionType(id: unknown): id is string {
  return typeof id === "string" && PROFESSION_IDS.has(id);
}

export function professionTypeLabel(id: string, lang: "en" | "es"): string {
  const match = PROFESSION_TYPES.find((p) => p.id === id);
  if (!match) return PROFESSION_TYPES[0][lang];
  return match[lang];
}

// One verified (HTTP 200 as of authoring) Unsplash photo per category, card-scale.
// Best-effort thematic placeholder — not a guarantee of exact subject matter;
// swap freely once real uploaded photos or a curated CMS library exist.
export const PROFESSION_PLACEHOLDER_PHOTOS: Record<string, string> = {
  contractor: "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=900&q=85",
  remodeler: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=85",
  home_builder: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=900&q=85",
  interior_designer: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=900&q=85",
  architect: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=900&q=85",
  landscaper: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=900&q=85",
  electrician: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=900&q=85",
  plumber: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=85",
  hvac: "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=900&q=85",
  roofing: "https://images.unsplash.com/photo-1567016376408-0226e4d0c1ea?w=900&q=85",
  painting: "https://images.unsplash.com/photo-1541123437800-1bb1317badc2?w=900&q=85",
  flooring: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=900&q=85",
  cabinet_maker: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=900&q=85",
  home_inspector: "https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=900&q=85",
  window_company: "https://images.unsplash.com/photo-1613545325278-f24b0cae1224?w=900&q=85",
  solar: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=900&q=85",
  pool_builder: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=900&q=85",
};

export function professionPlaceholderPhoto(id: string): string {
  return PROFESSION_PLACEHOLDER_PHOTOS[id] ?? PROFESSION_PLACEHOLDER_PHOTOS[DEFAULT_PROFESSION_TYPE];
}
