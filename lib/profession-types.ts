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

// 2-3 verified (HTTP 200 as of authoring) Unsplash photos per category, card-scale.
// Multiple variants per category exist so that several professionals of the same
// profession type never render the identical placeholder photo side by side.
// Best-effort thematic placeholder — not a guarantee of exact subject matter;
// swap freely once real uploaded photos or a curated CMS library exist.
export const PROFESSION_PLACEHOLDER_PHOTOS: Record<string, string[]> = {
  contractor: [
    "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=900&q=85",
    "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=900&q=85",
    "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=900&q=85",
  ],
  remodeler: [
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=85",
    "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=900&q=85",
    "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=900&q=85",
  ],
  home_builder: [
    "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=900&q=85",
    "https://images.unsplash.com/photo-1541976590-713941681591?w=900&q=85",
    "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=900&q=85",
  ],
  interior_designer: [
    "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=900&q=85",
    "https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?w=900&q=85",
    "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=900&q=85",
  ],
  architect: [
    "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=900&q=85",
    "https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=900&q=85",
    "https://images.unsplash.com/photo-1503387837-b154d5074bd2?w=900&q=85",
  ],
  landscaper: [
    "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=900&q=85",
    "https://images.unsplash.com/photo-1558904541-efa843a96f01?w=900&q=85",
    "https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?w=900&q=85",
  ],
  electrician: [
    "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=900&q=85",
    "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=900&q=85",
    "https://images.unsplash.com/photo-1565608087341-404b25492fee?w=900&q=85",
  ],
  plumber: [
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=85",
    "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=900&q=85",
  ],
  hvac: [
    "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=900&q=85",
    "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=900&q=85",
  ],
  roofing: [
    "https://images.unsplash.com/photo-1567016376408-0226e4d0c1ea?w=900&q=85",
    "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=900&q=85",
    "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=900&q=85",
  ],
  painting: [
    "https://images.unsplash.com/photo-1541123437800-1bb1317badc2?w=900&q=85",
    "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=900&q=85",
    "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=900&q=85",
  ],
  flooring: [
    "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=900&q=85",
    "https://images.unsplash.com/photo-1615873968403-89e068629265?w=900&q=85",
  ],
  cabinet_maker: [
    "https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=900&q=85",
    "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=900&q=85",
  ],
  home_inspector: [
    "https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=900&q=85",
    "https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=900&q=85",
  ],
  window_company: [
    "https://images.unsplash.com/photo-1613545325278-f24b0cae1224?w=900&q=85",
    "https://images.unsplash.com/photo-1615529182904-14819c35db37?w=900&q=85",
  ],
  solar: [
    "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=900&q=85",
    "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=900&q=85",
    "https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=900&q=85",
  ],
  pool_builder: [
    "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=900&q=85",
    "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=900&q=85",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=900&q=85",
  ],
};

export function professionPlaceholderPhotos(id: string): string[] {
  return PROFESSION_PLACEHOLDER_PHOTOS[id] ?? PROFESSION_PLACEHOLDER_PHOTOS[DEFAULT_PROFESSION_TYPE];
}

export function professionPlaceholderPhoto(id: string, variantIndex = 0): string {
  const photos = professionPlaceholderPhotos(id);
  return photos[((variantIndex % photos.length) + photos.length) % photos.length];
}

function stableHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

// Deterministic per-professional variant pick, so the same card always shows the
// same photo across renders, while distinct professionals of the same profession
// type land on different photos as long as variants remain (see dedup pass in
// FeaturedProfessionals.tsx for guaranteeing no repeats within a single render).
export function professionPlaceholderPhotoFor(professionalId: string, professionTypeId: string): string {
  const photos = professionPlaceholderPhotos(professionTypeId);
  return photos[stableHash(professionalId) % photos.length];
}
