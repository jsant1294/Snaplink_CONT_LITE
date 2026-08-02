// ---------------------------------------------------------------------------
// SnapLink — Shared Home-Service Taxonomy (bridge).
//
// One bilingual home-service catalog shared across the contractor dashboard,
// the agent (professional) dashboard, Southline public discovery, and Local
// Discovery. Canonical values are PRESERVED from the existing sources:
//
//   - lib/services.ts         -> SERVICE_CATEGORIES (10) + SERVICE_LIBRARY (59)
//   - lib/profession-types.ts -> PROFESSION_TYPES + LICENSED_PROFESSION_TYPES
//
// This module only ADDS structure on top of those canonical arrays:
// top-level groups, audience tags, bilingual aliases, and stable slugs. It
// does NOT introduce a second identity system (no professional_profiles, no
// new identity table) and does NOT own dashboards. The `audience` tag only
// documents which provider surface primarily serves a category — contractors
// (contractors table / /contractor/{username}) vs professionals (agent_profiles
// / /agents/{slug}) — it never merges or reroutes a dashboard.
//
// Stable-id rule: every id here is a stable slug. Renaming an id is a breaking
// change for stored data (leads store SERVICE_LIBRARY names) and for URL
// params (e.g. /results?category=roof_exterior).
// ---------------------------------------------------------------------------

import { SERVICE_CATEGORIES, SERVICE_LIBRARY } from "./services.ts";
import { LICENSED_PROFESSION_TYPES, PROFESSION_TYPES } from "./profession-types.ts";
import type { Lang } from "./i18n";

export type HomeServiceAudience = "contractor" | "professional" | "both";

export interface HomeServiceGroup {
  id: string;
  labelEn: string;
  labelEs: string;
  sortOrder: number;
}

export interface HomeServiceCategory {
  id: string;
  parentId: string; // HomeServiceGroup.id
  labelEn: string;
  labelEs: string;
  audience: HomeServiceAudience;
  active: boolean;
  featured: boolean;
  sortOrder: number;
  aliases: string[];
  southlineVisible: boolean;
}

export interface HomeServiceSpecialty {
  /** Canonical EN name — preserved 1:1 from SERVICE_LIBRARY (stored on leads). */
  id: string;
  parentId: string; // HomeServiceCategory.id
  labelEn: string;
  labelEs: string;
  aliases: string[];
}

// ---------------------------------------------------------------------------
// Top-level groups. All 22 groups from the slice brief are present so the
// taxonomy "can represent" them; groups without live categories today are
// valid parents for future/seed categories and are documented as such.
// ---------------------------------------------------------------------------

export const HOME_SERVICE_GROUPS: HomeServiceGroup[] = [
  { id: "construction-remodeling", labelEn: "Construction & Remodeling", labelEs: "Construcción y Remodelación", sortOrder: 10 },
  { id: "exterior", labelEn: "Exterior", labelEs: "Exterior", sortOrder: 20 },
  { id: "roofing", labelEn: "Roofing", labelEs: "Techos", sortOrder: 30 },
  { id: "plumbing", labelEn: "Plumbing", labelEs: "Plomería", sortOrder: 40 },
  { id: "electrical", labelEn: "Electrical", labelEs: "Electricidad", sortOrder: 50 },
  { id: "hvac", labelEn: "HVAC", labelEs: "Climatización (HVAC)", sortOrder: 60 },
  { id: "landscaping-outdoor", labelEn: "Landscaping & Outdoor Living", labelEs: "Paisajismo y Vida al Aire Libre", sortOrder: 70 },
  { id: "pools-spas", labelEn: "Pools & Spas", labelEs: "Piscinas y Spas", sortOrder: 80 },
  { id: "cleaning", labelEn: "Cleaning", labelEs: "Limpieza", sortOrder: 90 },
  { id: "pest-environmental", labelEn: "Pest & Environmental", labelEs: "Control de Plagas y Ambiental", sortOrder: 100 },
  { id: "inspection-testing", labelEn: "Inspection & Testing", labelEs: "Inspección y Pruebas", sortOrder: 110 },
  { id: "architecture-design", labelEn: "Architecture & Design", labelEs: "Arquitectura y Diseño", sortOrder: 120 },
  { id: "real-estate", labelEn: "Real Estate", labelEs: "Bienes Raíces", sortOrder: 130 },
  { id: "property-management", labelEn: "Property Management", labelEs: "Administración de Propiedades", sortOrder: 140 },
  { id: "moving-storage", labelEn: "Moving & Storage", labelEs: "Mudanzas y Almacenamiento", sortOrder: 150 },
  { id: "security-smart-home", labelEn: "Security & Smart Home", labelEs: "Seguridad y Hogar Inteligente", sortOrder: 160 },
  { id: "energy-utilities", labelEn: "Energy & Utilities", labelEs: "Energía y Servicios Públicos", sortOrder: 170 },
  { id: "accessibility-senior", labelEn: "Accessibility & Senior Living", labelEs: "Accesibilidad y Vida para Adultos Mayores", sortOrder: 180 },
  { id: "insurance-finance-legal", labelEn: "Insurance, Finance & Legal", labelEs: "Seguros, Finanzas y Legal", sortOrder: 190 },
  { id: "photography-media", labelEn: "Photography & Media", labelEs: "Fotografía y Medios", sortOrder: 200 },
  { id: "rentals-getaways", labelEn: "Rentals & Getaways", labelEs: "Rentas y Escapadas", sortOrder: 210 },
  { id: "specialty", labelEn: "Specialty Home Services", labelEs: "Servicios Especiales para el Hogar", sortOrder: 220 },
];

// ---------------------------------------------------------------------------
// Search aliases: bilingual synonyms beyond the two labels. These extend
// Southline matching only; they are never stored and never route externally.
// ---------------------------------------------------------------------------

const CATEGORY_ALIASES: Record<string, string[]> = {
  remodeling: ["remodeler", "renovation", "renovación", "remodelación", "home improvement", "mejoras al hogar"],
  paint_drywall: ["painter", "pintor", "paint", "drywall", "tablaroca"],
  flooring: ["floor", "pisos", "hardwood", "madera"],
  roof_exterior: ["roofer", "techador", "roof", "techos", "gutter", "canaletas", "siding", "revestimiento", "window", "ventanas", "garage door", "puerta de garaje"],
  plumbing: ["plumber", "plomero", "plomería", "drain", "drenaje"],
  electrical: ["electrician", "electricista", "electricidad", "wiring", "cableado"],
  hvac: ["air conditioning", "heating", "aire acondicionado", "calefacción", "ac", "cooling"],
  outdoor: ["landscaper", "paisajista", "landscaping", "paisajismo", "garden", "jardín", "lawn", "césped", "tree", "árboles", "fence", "cerca", "deck", "terraza"],
  concrete: ["mason", "albañil", "concreto", "masonry", "albañilería", "pavers", "adoquín"],
  handyman: ["handy", "reparaciones", "maintenance", "mantenimiento"],
  "interior-design": ["interior designer", "diseñador de interiores", "diseño de interiores"],
  "architecture-design": ["architect", "arquitecto", "arquitectura", "building design", "diseño de construcción"],
  "home-inspections": ["home inspector", "inspector de casas", "house inspection", "inspección"],
  solar: ["solar panels", "paneles solares", "energía solar"],
  pools: ["pool", "piscina", "swimming pool", "spa", "jacuzzi"],
  photography: ["photographer", "fotógrafo", "photography", "fotografía", "photos", "fotos", "videographer", "videógrafo"],
  "real-estate": ["realtor", "real estate agent", "agente de bienes raíces", "buyer agent", "agente comprador"],
  "mortgage-financing": ["mortgage", "hipoteca", "lender", "prestamista", "financing", "financiamiento", "loan", "préstamo"],
  "property-management": ["property manager", "administrador de propiedades", "landlord services"],
  appraisals: ["appraiser", "avaluador", "home appraisal", "avalúo"],
  surveying: ["surveyor", "agrimensor", "land survey", "agrimensura"],
};

const SPECIALTY_ALIASES: Record<string, string[]> = {
  "Kitchen Remodel": ["cocina", "kitchen"],
  "Bathroom Remodel": ["baño", "bathroom", "bath"],
  "Room Addition": ["addition", "ampliación"],
  Countertops: ["counters", "encimeras"],
  "Tile Work": ["tiles", "azulejos", "tiling"],
  "Interior Painting": ["interior paint", "pintura interior"],
  "Exterior Painting": ["exterior paint", "pintura exterior"],
  "Cabinet Painting": ["cabinets", "gabinetes"],
  "Drywall Install / Repair": ["drywall", "tablaroca", "sheetrock", "pladur"],
  Flooring: ["floors", "pisos", "hardwood", "laminate", "laminado"],
  "Hardwood Refinishing": ["sanding", "lijado", "polish"],
  Roofing: ["roof", "techos", "roofer", "techador", "roof repair", "techo"],
  "Gutters & Downspouts": ["gutters", "canaletas", "downspouts", "bajantes"],
  Siding: ["revestimiento", "cladding"],
  Windows: ["window", "ventanas", "ventana"],
  "Garage Door": ["garage", "puerta de garaje"],
  "Pressure Washing": ["power washing", "lavado a presión", "power wash"],
  "Plumbing Repair": ["plumber", "plomero", "plumbing", "plomería"],
  "Water Heater": ["hot water heater", "calentador", "boiler"],
  "Faucets & Fixtures": ["faucet", "llaves", "fixtures", "grifo"],
  "Toilet Install / Repair": ["toilet", "inodoro", "w.c."],
  "Drain Cleaning": ["drain", "drenaje", "clogged drain", "destape"],
  "Electrical Repair": ["electrician", "electricista", "electrical", "electricidad"],
  "Panel Upgrade": ["breaker panel", "panel eléctrico", "circuit breaker"],
  "Lighting & Ceiling Fans": ["lighting", "iluminación", "ceiling fan", "ventilador"],
  "EV Charger Install": ["ev charger", "cargador ev", "charger"],
  "Outlets & Switches": ["outlets", "contactos", "switches", "interruptores"],
  "HVAC Repair": ["ac repair", "hvac", "aire acondicionado", "air conditioning"],
  "HVAC Replacement": ["furnace", "calefacción", "heating", "ac replacement"],
  Ductwork: ["ducts", "ductos", "duct cleaning"],
  Landscaping: ["landscape", "paisajismo", "paisajista", "yard", "patio", "gardening", "jardinería"],
  "Tree Service": ["tree trimming", "trees", "árboles", "tree removal", "tala"],
  "Irrigation / Sprinklers": ["sprinklers", "aspersores", "irrigation", "riego"],
  "Sod & Turf": ["sod", "turf", "césped", "pasto", "grass", "lawn"],
  "Fence Install / Repair": ["fence", "cerca", "fencing", "fences"],
  "Deck Build / Repair": ["deck", "terraza", "decks"],
  "Pergola / Patio Cover": ["pergola", "pérgola", "patio cover", "cubierta de patio"],
  "Concrete Driveway / Patio": ["concrete", "concreto", "driveway", "entrada", "patio", "cement", "cemento"],
  "Concrete Repair": ["concrete", "concreto", "cement"],
  "Masonry & Brick": ["masonry", "albañilería", "brick", "ladrillo", "mason", "albañil"],
  "Paver Patio / Walkway": ["pavers", "adoquín", "walkway", "andador"],
  "Retaining Wall": ["retaining", "muro", "retaining wall"],
  "Handyman Repair": ["handyman", "reparaciones", "handy", "repairs"],
  "TV Mounting": ["tv mount", "montaje", "tv installation"],
  "Furniture Assembly": ["assembly", "ensamblaje", "furniture", "muebles"],
  "Door Repair / Adjustment": ["door", "puertas", "door repair"],
  "Caulking & Sealing": ["caulking", "sellado", "caulk", "sealing"],
  Insulation: ["insulate", "aislamiento", "insulation"],
  Demolition: ["demo", "demolición"],
  "Junk Removal": ["junk", "escombro", "hauling", "removal", "basura"],
};

// ---------------------------------------------------------------------------
// Professional (agent-side) categories. Derived from the profession taxonomy:
// every profession must map to exactly one canonical category (PROFESSION_TYPES
// + LICENSED_PROFESSION_TYPES together — see professionCategoryId below).
// ---------------------------------------------------------------------------

const PROFESSIONAL_CATEGORIES: Omit<HomeServiceCategory, "active" | "featured" | "southlineVisible" | "aliases">[] = [
  { id: "interior-design", parentId: "architecture-design", labelEn: "Interior Design", labelEs: "Diseño de Interiores", audience: "contractor", sortOrder: 1000 },
  { id: "architecture-design", parentId: "architecture-design", labelEn: "Architecture", labelEs: "Arquitectura", audience: "contractor", sortOrder: 1001 },
  { id: "home-inspections", parentId: "inspection-testing", labelEn: "Home Inspections", labelEs: "Inspección de Casas", audience: "both", sortOrder: 1002 },
  { id: "solar", parentId: "energy-utilities", labelEn: "Solar", labelEs: "Energía Solar", audience: "contractor", sortOrder: 1003 },
  { id: "pools", parentId: "pools-spas", labelEn: "Pools & Spas", labelEs: "Piscinas y Spas", audience: "contractor", sortOrder: 1004 },
  { id: "photography", parentId: "photography-media", labelEn: "Photography", labelEs: "Fotografía", audience: "both", sortOrder: 1005 },
  { id: "real-estate", parentId: "real-estate", labelEn: "Real Estate", labelEs: "Bienes Raíces", audience: "professional", sortOrder: 1006 },
  { id: "mortgage-financing", parentId: "insurance-finance-legal", labelEn: "Mortgage & Financing", labelEs: "Hipotecas y Financiamiento", audience: "professional", sortOrder: 1007 },
  { id: "property-management", parentId: "property-management", labelEn: "Property Management", labelEs: "Administración de Propiedades", audience: "professional", sortOrder: 1008 },
  { id: "appraisals", parentId: "inspection-testing", labelEn: "Appraisals", labelEs: "Avalúos", audience: "professional", sortOrder: 1009 },
  { id: "surveying", parentId: "inspection-testing", labelEn: "Surveying", labelEs: "Agrimensura", audience: "professional", sortOrder: 1010 },
];

// Service categories keep their existing ids/labels; only their group parent
// and audience tag are added here. SERVICE_CATEGORIES order is preserved.
const CONTRACTOR_CATEGORY_GROUPS: Record<string, string> = {
  remodeling: "construction-remodeling",
  paint_drywall: "construction-remodeling",
  flooring: "construction-remodeling",
  roof_exterior: "roofing",
  plumbing: "plumbing",
  electrical: "electrical",
  hvac: "hvac",
  outdoor: "landscaping-outdoor",
  concrete: "construction-remodeling",
  handyman: "specialty",
};

export const HOME_SERVICE_CATEGORIES: HomeServiceCategory[] = [
  ...SERVICE_CATEGORIES.map((c, i) => ({
    id: c.id,
    parentId: CONTRACTOR_CATEGORY_GROUPS[c.id],
    labelEn: c.en,
    labelEs: c.es,
    audience: "contractor" as const,
    active: true,
    featured: false,
    sortOrder: (i + 1) * 10,
    aliases: CATEGORY_ALIASES[c.id] ?? [],
    southlineVisible: true,
  })),
  ...PROFESSIONAL_CATEGORIES.map((c) => ({
    ...c,
    active: true,
    featured: false,
    southlineVisible: true,
    aliases: CATEGORY_ALIASES[c.id] ?? [],
  })),
];

export const HOME_SERVICE_SPECIALTIES: HomeServiceSpecialty[] = SERVICE_LIBRARY.map((s) => ({
  id: s.name,
  parentId: s.category,
  labelEn: s.name,
  labelEs: s.es,
  aliases: SPECIALTY_ALIASES[s.name] ?? [],
}));

// ---------------------------------------------------------------------------
// Local Discovery legacy map — faithful to the shipped internalSlug values in
// lib/southline-local-discovery.ts (Phase 9: Local Discovery is NOT refactored;
// this table documents its compat surface and is the fallback for slug
// resolution when the input is not already a canonical category id).
// ---------------------------------------------------------------------------

export const LOCAL_DISCOVERY_LEGACY_MAP: Record<string, string> = {
  "builders-remodelers": "remodeling",
  architects: "remodeling",
  "interior-designers": "remodeling",
  landscaping: "outdoor",
  roofing: "roof_exterior",
  pools: "outdoor",
  photography: "photography",
  "real-estate": "real-estate",
};

// ---------------------------------------------------------------------------
// Profession -> canonical category. Every valid profession id (trades +
// licensed) maps to exactly one category so a professional listing is always
// filterable by the shared taxonomy.
// ---------------------------------------------------------------------------

const PROFESSION_CATEGORY_MAP: Record<string, string> = {
  contractor: "remodeling",
  remodeler: "remodeling",
  home_builder: "remodeling",
  cabinet_maker: "remodeling",
  interior_designer: "interior-design",
  architect: "architecture-design",
  landscaper: "outdoor",
  electrician: "electrical",
  plumber: "plumbing",
  hvac: "hvac",
  roofing: "roof_exterior",
  painting: "paint_drywall",
  flooring: "flooring",
  home_inspector: "home-inspections",
  window_company: "roof_exterior",
  solar: "solar",
  pool_builder: "pools",
  photographer: "photography",
  realtor: "real-estate",
  mortgage_broker: "mortgage-financing",
  property_manager: "property-management",
  appraiser: "appraisals",
  surveyor: "surveying",
};

export function professionCategoryId(professionId: string): string | undefined {
  return PROFESSION_CATEGORY_MAP[professionId];
}

// ---------------------------------------------------------------------------
// Display-only professional filtering (Professional Discovery slices).
// Contractors and agents keep their own stores; this only normalizes display.
// ---------------------------------------------------------------------------

export interface ProfessionalTaxonomyFilter {
  /** Canonical id, Local Discovery legacy slug, bilingual label, or alias. */
  category?: string;
  audience?: HomeServiceAudience;
  professionType?: string;
}

/** The canonical taxonomy category for a profession id, if mapped. */
export function professionalTaxonomyCategory(professionType: string): HomeServiceCategory | undefined {
  const id = professionCategoryId(professionType);
  return id ? getHomeServiceCategory(id) : undefined;
}

/**
 * Filter professionals by taxonomy. An unknown category resolves to a safe
 * EMPTY result (never a guess, never a crash). With no filter options the
 * input is returned unchanged — display normalization only.
 */
export function filterProfessionalsByTaxonomy<P extends { professionType?: string }>(
  professionals: P[],
  filter: ProfessionalTaxonomyFilter = {}
): P[] {
  const hasFilter = filter.category != null || filter.audience != null || filter.professionType != null;
  if (!hasFilter) return professionals;
  const resolvedCategory = filter.category != null ? resolveCategoryId(filter.category) : undefined;
  if (filter.category != null && !resolvedCategory) return [];
  return professionals.filter((p) => {
    if (!p.professionType) return false;
    const cat = professionalTaxonomyCategory(p.professionType);
    if (!cat) return false;
    if (resolvedCategory && cat.id !== resolvedCategory) return false;
    if (filter.audience && cat.audience !== filter.audience) return false;
    if (filter.professionType && p.professionType !== filter.professionType) return false;
    return true;
  });
}

// ---------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------

export function getHomeServiceGroup(id: string): HomeServiceGroup | undefined {
  return HOME_SERVICE_GROUPS.find((g) => g.id === id);
}

export function getHomeServiceCategory(id: string): HomeServiceCategory | undefined {
  return HOME_SERVICE_CATEGORIES.find((c) => c.id === id);
}

export function getHomeServiceSpecialty(id: string): HomeServiceSpecialty | undefined {
  return HOME_SERVICE_SPECIALTIES.find((s) => s.id === id);
}

export function homeServiceCategoriesByAudience(
  audience: HomeServiceAudience | HomeServiceAudience[]
): HomeServiceCategory[] {
  const wanted = Array.isArray(audience) ? new Set(audience) : new Set([audience]);
  return HOME_SERVICE_CATEGORIES.filter((c) => c.active && wanted.has(c.audience));
}

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

/**
 * Resolve a category id from a canonical id, a Local Discovery legacy slug, or
 * a bilingual label/alias. Returns undefined for anything unknown — callers
 * must NOT fall back to a guessed or unrelated category.
 */
export function resolveCategoryId(input: string): string | undefined {
  const key = normalize(input);
  if (!key) return undefined;
  const direct = getHomeServiceCategory(key);
  if (direct) return direct.id;
  if (LOCAL_DISCOVERY_LEGACY_MAP[key]) return LOCAL_DISCOVERY_LEGACY_MAP[key];
  const viaAlias = HOME_SERVICE_CATEGORIES.find((c) =>
    [c.labelEn, c.labelEs, ...c.aliases].some((t) => normalize(t) === key)
  );
  return viaAlias?.id;
}

/** All searchable terms for a category: labels, id, aliases, group labels. */
export function categoryMatchTerms(id: string): string[] {
  const cat = getHomeServiceCategory(id);
  if (!cat) return [];
  const group = getHomeServiceGroup(cat.parentId);
  return [
    cat.labelEn,
    cat.labelEs,
    cat.id,
    ...cat.aliases,
    ...(group ? [group.labelEn, group.labelEs] : []),
  ];
}

/** All searchable terms for a specialty: labels, aliases, parent category terms. */
export function specialtyMatchTerms(id: string): string[] {
  const sp = getHomeServiceSpecialty(id);
  if (!sp) return [];
  return [sp.labelEn, sp.labelEs, ...sp.aliases, ...categoryMatchTerms(sp.parentId)];
}

// ---------------------------------------------------------------------------
// Southline adapter (Phase 5). Pure and store-free, like lib/southline-search.ts.
// Southline may consume categories of ANY audience — the default list mixes
// contractor + professional categories; callers opt into a narrower audience.
// ---------------------------------------------------------------------------

export interface SouthlineHomeServiceCategory {
  id: string;
  parentId: string;
  label: string; // resolved to the requested locale
  labelEn: string;
  labelEs: string;
  audience: HomeServiceAudience;
  active: boolean;
  featured: boolean;
  sortOrder: number;
  aliases: string[];
  southlineVisible: boolean;
}

export interface SouthlineHomeServicesOptions {
  locale?: Lang;
  /** "both" = all audiences combined; a tag name filters to that tag; an array unions the listed tags. */
  audience?: HomeServiceAudience | HomeServiceAudience[];
  featuredOnly?: boolean;
  parentId?: string;
  search?: string;
}

export function listSouthlineHomeServices(
  options: SouthlineHomeServicesOptions = {}
): SouthlineHomeServiceCategory[] {
  const locale = options.locale === "es" ? "es" : "en";
  // "both" is a sentinel for "every audience" (contractor + professional + both-tagged)
  // so public surfaces can list the full catalog with one argument.
  const audiences =
    options.audience && options.audience !== "both"
      ? new Set(Array.isArray(options.audience) ? options.audience : [options.audience])
      : null;
  const needle = options.search?.trim().toLowerCase() ?? "";

  return [...HOME_SERVICE_GROUPS]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .flatMap((group) => {
      if (options.parentId && group.id !== options.parentId) return [];
      return HOME_SERVICE_CATEGORIES.filter((c) => c.parentId === group.id)
        .filter((c) => c.active)
        .filter((c) => (audiences ? audiences.has(c.audience) : true))
        .filter((c) => (options.featuredOnly ? c.featured : true))
        .filter((c) => (needle ? categoryMatchTerms(c.id).some((t) => t.toLowerCase().includes(needle)) : true))
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map<SouthlineHomeServiceCategory>((c) => ({
          ...c,
          label: locale === "es" ? c.labelEs : c.labelEn,
        }));
    });
}
