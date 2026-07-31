export interface HeroContent {
  tagline: string;
  titleEs: string;
  titleEn: string;
  subtitleEs: string;
  subtitleEn: string;
  searchPromptEs: string;
  searchPromptEn: string;
  ctaExploreEs: string;
  ctaExploreEn: string;
  ctaPlanEs: string;
  ctaPlanEn: string;
  ctaFindProEs: string;
  ctaFindProEn: string;
}

export interface SectionVisibility {
  hero: boolean;
  categories: boolean;
  featuredPros: boolean;
  trending: boolean;
  recruitment: boolean;
  featuredAgents: boolean;
  featuredHomes: boolean;
  featuredServices: boolean;
  poweredBySnaplink: boolean;
  diyLearning: boolean;
  seasonalIdeas: boolean;
  costEstimator: boolean;
  bookConsultation: boolean;
}

export interface SpotlightItem {
  id: string;
  titleEs: string;
  titleEn: string;
  descEs: string;
  descEn: string;
  imageUrl: string;
  linkUrl: string;
  categoryEs: string;
  categoryEn: string;
}

/** Content for the homepage real estate entry block (property + agents + copy).
 *  Featured agents reuse the top-level featuredAgentProfileIds list; visibility
 *  reuses sections.featuredAgents — both predate this block and gated the same
 *  real estate content before it existed in this combined form. */
export interface RealEstateBlockSettings {
  featuredPropertyId: string | null;
  eyebrowEs: string;
  eyebrowEn: string;
  headlineEs: string;
  headlineEn: string;
  bodyEs: string;
  bodyEn: string;
}

export type LocalizedText = {
  es: string;
  en: string;
};

export interface CmsImage {
  desktopUrl?: string;
  mobileUrl?: string;
  altEs?: string;
  altEn?: string;
}

export interface HomeServicesContent {
  eyebrowEs?: string;
  eyebrowEn?: string;
  titleEs?: string;
  titleEn?: string;
  descriptionEs?: string;
  descriptionEn?: string;
  featuredContractorId?: string;
  featuredImageUrl?: string;
  primaryCtaLabelEs?: string;
  primaryCtaLabelEn?: string;
  primaryCtaUrl?: string;
}

export interface TrendingProjectItem {
  id: string;
  titleEs: string;
  titleEn: string;
  descriptionEs?: string;
  descriptionEn?: string;
  imageUrl: string;
  linkUrl: string;
  visible: boolean;
  sortOrder: number;
}

export interface SeasonalContent {
  eyebrowEs?: string;
  eyebrowEn?: string;
  titleEs?: string;
  titleEn?: string;
  descriptionEs?: string;
  descriptionEn?: string;
  imageUrl?: string;
  mobileImageUrl?: string;
  imageAltEs?: string;
  imageAltEn?: string;
  ctaLabelEs?: string;
  ctaLabelEn?: string;
  ctaUrl?: string;
  enabled?: boolean;
  startAt?: string;
  endAt?: string;
}

export interface SouthlineCategory {
  id: string;
  titleEs: string;
  titleEn: string;
  descriptionEs?: string;
  descriptionEn?: string;
  imageUrl: string;
  linkUrl: string;
  ctaEs?: string;
  ctaEn?: string;
  featured?: boolean;
  visible: boolean;
  sortOrder: number;
}

export type SouthlineFaqItem = {
  id: string;
  questionEn: string;
  questionEs: string;
  answerEn: string;
  answerEs: string;
  visible: boolean;
  sortOrder: number;
};

export type SouthlineFaqContent = {
  enabled: boolean;
  eyebrowEn?: string;
  eyebrowEs?: string;
  titleEn?: string;
  titleEs?: string;
  subtitleEn?: string;
  subtitleEs?: string;
  items: SouthlineFaqItem[];
};

export type SouthlineFooterLink = {
  id: string;
  labelEn: string;
  labelEs: string;
  href: string;
  visible: boolean;
  sortOrder: number;
};

export type SouthlineFooterColumn = {
  id: string;
  titleEn: string;
  titleEs: string;
  visible: boolean;
  sortOrder: number;
  links: SouthlineFooterLink[];
};

export type SouthlineFooterContent = {
  visible: boolean;
  taglineEn?: string;
  taglineEs?: string;
  newsletterVisible: boolean;
  newsletterTitleEn?: string;
  newsletterTitleEs?: string;
  newsletterDescEn?: string;
  newsletterDescEs?: string;
  copyrightEn?: string;
  copyrightEs?: string;
  poweredByEn?: string;
  poweredByEs?: string;
  columns: SouthlineFooterColumn[];
};

export type SouthlineBusinessHoursEntry = {
  id: string;
  dayLabel: string;
  hoursLabel: string;
  enabled: boolean;
  sortOrder: number;
};

export type SouthlineContactCtaType =
  | "call"
  | "text"
  | "email"
  | "whatsapp"
  | "directions"
  | "external_link";

export type SouthlineContactContent = {
  enabled: boolean;

  heading: string | null;
  body: string | null;

  businessName: string | null;
  businessDescription: string | null;

  phone: string | null;
  email: string | null;
  whatsapp: string | null;

  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  region: string | null;
  postalCode: string | null;

  directionsUrl: string | null;

  primaryCtaLabel: string | null;
  primaryCtaType: SouthlineContactCtaType | null;
  primaryCtaValue: string | null;

  hours: SouthlineBusinessHoursEntry[];
};

export type SouthlineTestimonialItem = {
  id: string;

  quote: string;
  quoteEs: string | null;

  authorName: string;
  authorNameEs: string | null;

  authorTitle: string | null;
  authorTitleEs: string | null;

  companyName: string | null;
  companyNameEs: string | null;

  imageUrl: string | null;

  rating: number | null;

  sourceLabel: string | null;
  sourceUrl: string | null;

  enabled: boolean;
  featured: boolean;
  sortOrder: number;
};

export type SouthlineTestimonialsContent = {
  enabled: boolean;

  heading: string | null;
  headingEs: string | null;

  body: string | null;
  bodyEs: string | null;

  items: SouthlineTestimonialItem[];

  reviewCtaLabel: string | null;
  reviewCtaLabelEs: string | null;
  reviewCtaUrl: string | null;
};

export type SouthlineLocalCategory = {
  id: string;
  labelEn: string;
  labelEs: string;
  descriptionEn: string | null;
  descriptionEs: string | null;
  icon: string | null;
  imageUrl: string | null;
  snaplinkCategory: string | null;
  visible: boolean;
  featured: boolean;
  order: number;
};

export type SouthlineLocalDiscoveryContent = {
  enabled: boolean;

  eyebrowEn: string | null;
  eyebrowEs: string | null;

  titleEn: string | null;
  titleEs: string | null;

  descriptionEn: string | null;
  descriptionEs: string | null;

  zipPlaceholderEn: string | null;
  zipPlaceholderEs: string | null;

  submitLabelEn: string | null;
  submitLabelEs: string | null;

  poweredByLabelEn: string | null;
  poweredByLabelEs: string | null;

  directoryBaseUrl: string | null;
  defaultCategory: string | null;

  categories: SouthlineLocalCategory[];

  showOnHomepage: boolean;
  showCategoryCards: boolean;
};

export type SouthlineTwitterCardType = "summary" | "summary_large_image";

export type SouthlineRobotsContent = {
  index: boolean;
  follow: boolean;
  noarchive: boolean;
  nosnippet: boolean;
  noimageindex: boolean;
};

export type SouthlinePageSeoOverride = {
  title: string | null;
  titleEs: string | null;

  description: string | null;
  descriptionEs: string | null;

  canonicalPath: string | null;

  openGraphTitle: string | null;
  openGraphTitleEs: string | null;

  openGraphDescription: string | null;
  openGraphDescriptionEs: string | null;

  openGraphImageUrl: string | null;

  twitterTitle: string | null;
  twitterTitleEs: string | null;

  twitterDescription: string | null;
  twitterDescriptionEs: string | null;

  twitterImageUrl: string | null;

  robots: SouthlineRobotsContent | null;
};

export type SouthlineSeoContent = {
  siteName: string | null;

  defaultTitle: string | null;
  defaultTitleEs: string | null;

  titleTemplate: string | null;
  titleTemplateEs: string | null;

  defaultDescription: string | null;
  defaultDescriptionEs: string | null;

  canonicalSiteUrl: string | null;

  defaultOpenGraphTitle: string | null;
  defaultOpenGraphTitleEs: string | null;

  defaultOpenGraphDescription: string | null;
  defaultOpenGraphDescriptionEs: string | null;

  defaultOpenGraphImageUrl: string | null;

  defaultTwitterTitle: string | null;
  defaultTwitterTitleEs: string | null;

  defaultTwitterDescription: string | null;
  defaultTwitterDescriptionEs: string | null;

  defaultTwitterImageUrl: string | null;

  twitterCardType: SouthlineTwitterCardType;

  defaultRobots: SouthlineRobotsContent;

  organizationName: string | null;
  organizationLogoUrl: string | null;

  googleSiteVerification: string | null;
  bingSiteVerification: string | null;

  pages: {
    home: SouthlinePageSeoOverride;
    faq: SouthlinePageSeoOverride;
    contact: SouthlinePageSeoOverride;
  };
};

export interface SouthlineSettings {
  hero: HeroContent;
  heroImage: CmsImage;
  homeServices: HomeServicesContent;
  trendingProjects: TrendingProjectItem[];
  seasonal: SeasonalContent;
  categories: SouthlineCategory[];
  sections: SectionVisibility;
  featuredContractorIds: string[];
  featuredAgentProfileIds: string[];
  realEstateBlock: RealEstateBlockSettings;
  featureFlags: Record<string, boolean>;
  faq: SouthlineFaqContent;
  footer: SouthlineFooterContent;
  contact: SouthlineContactContent;
  testimonials: SouthlineTestimonialsContent;
  localDiscovery: SouthlineLocalDiscoveryContent;
  seo: SouthlineSeoContent;
  navigation: {
    items: { key: string; href: string; labelEs: string; labelEn: string; visible: boolean }[];
  };
  spotlight: SpotlightItem[];
  updatedAt: string;
}

export const DEFAULT_HERO: HeroContent = {
  tagline: "Southline Living",
  titleEs: "Ideas para cada hogar. Profesionales de confianza para hacerlas realidad.",
  titleEn: "Ideas for every home. Trusted professionals to bring them to life.",
  subtitleEs: "Explora espacios inspiradores, planifica tu próximo proyecto y conecta con profesionales locales de Snaplink.",
  subtitleEn: "Explore inspiring spaces, plan your next project, and connect with local Snaplink professionals.",
  searchPromptEs: "¿Qué proyecto estás planeando hoy?",
  searchPromptEn: "What project are you planning today?",
  ctaExploreEs: "Explorar ideas",
  ctaExploreEn: "Explore ideas",
  ctaPlanEs: "Planificar mi proyecto",
  ctaPlanEn: "Plan my project",
  ctaFindProEs: "Encontrar un profesional",
  ctaFindProEn: "Find a professional",
};

export const DEFAULT_SECTIONS: SectionVisibility = {
  hero: true,
  categories: true,
  featuredPros: true,
  trending: true,
  recruitment: true,
  featuredAgents: true,
  featuredHomes: true,
  featuredServices: true,
  poweredBySnaplink: true,
  diyLearning: true,
  seasonalIdeas: true,
  costEstimator: true,
  bookConsultation: true,
};

export const DEFAULT_REAL_ESTATE_BLOCK: RealEstateBlockSettings = {
  featuredPropertyId: null,
  eyebrowEs: "BIENES RAÍCES · EXPERTOS LOCALES",
  eyebrowEn: "REAL ESTATE · LOCAL EXPERTS",
  headlineEs: "Encuentra tu próximo hogar con un experto local.",
  headlineEn: "Find your next home with a local expert.",
  bodyEs: "Descubre propiedades destacadas, explora comunidades y conecta directamente con profesionales inmobiliarios a través de sus perfiles Snaplink.",
  bodyEn: "Discover featured properties, explore local communities, and connect directly with real estate professionals through their Snaplink profiles.",
};

export const DEFAULT_HERO_IMAGE: CmsImage = {
  desktopUrl: "/images/southline-living-hero.png",
  mobileUrl: "/images/southline-living-hero.png",
  altEn: "Southline Living — homes and trusted professionals",
  altEs: "Southline Living — hogares y profesionales de confianza",
};

// Empty by design — every field falls back to the i18n dictionary + demo fixture
// until an operator edits it, so the section renders exactly as it does today.
export const DEFAULT_HOME_SERVICES: HomeServicesContent = {};

export const DEFAULT_TRENDING_PROJECTS: TrendingProjectItem[] = [
  {
    id: "trending-seasonal",
    titleEs: "Proyectos de temporada",
    titleEn: "Seasonal Projects",
    descriptionEs: "Prepara tu hogar para la temporada con proyectos oportunos y de alto impacto.",
    descriptionEn: "Get your home ready for the season with timely, high-impact projects.",
    imageUrl: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=900&q=85",
    linkUrl: "/diy",
    visible: true,
    sortOrder: 0,
  },
  {
    id: "trending-budget",
    titleEs: "Mejoras económicas",
    titleEn: "Budget-Friendly Upgrades",
    descriptionEs: "Mejoras con gran impacto visual sin romper el presupuesto.",
    descriptionEn: "High-impact upgrades that won't stretch your budget.",
    imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=85",
    linkUrl: "/diy",
    visible: true,
    sortOrder: 1,
  },
  {
    id: "trending-before-after",
    titleEs: "Antes y después",
    titleEn: "Before & After",
    descriptionEs: "Transformaciones reales de hogares hechas por profesionales de Snaplink.",
    descriptionEn: "Real home transformations completed by Snaplink professionals.",
    imageUrl: "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=900&q=85",
    linkUrl: "/diy",
    visible: true,
    sortOrder: 2,
  },
];

export const DEFAULT_SEASONAL: SeasonalContent = {
  eyebrowEn: "Seasonal",
  eyebrowEs: "De temporada",
  titleEn: "Seasonal ideas for your home",
  titleEs: "Ideas de temporada para tu hogar",
  descriptionEn: "From getting your garden ready to prepping your home for the next season — find inspiration right on time.",
  descriptionEs: "Desde preparar tu jardín hasta acondicionar tu hogar para el próximo cambio de clima — encuentra inspiración a tiempo.",
  imageUrl: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1600&q=85",
  ctaLabelEn: "See seasonal ideas",
  ctaLabelEs: "Ver ideas de temporada",
  ctaUrl: "/diy",
  enabled: true,
};

export const DEFAULT_CATEGORIES: SouthlineCategory[] = [
  { id: "cocinas", titleEs: "Cocinas", titleEn: "Kitchens", descriptionEs: "Cocinas de lujo", descriptionEn: "Luxury kitchens", imageUrl: "https://images.unsplash.com/photo-1556911073-38141963c9e0?w=900&q=85", linkUrl: "/ideas/cocinas", ctaEs: "Explorar cocinas", ctaEn: "Explore kitchens", featured: true, visible: true, sortOrder: 0 },
  { id: "banos", titleEs: "Baños", titleEn: "Bathrooms", descriptionEs: "Refugios inspirados en spas", descriptionEn: "Spa-inspired retreats", imageUrl: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=900&q=85", linkUrl: "/ideas/banos", ctaEs: "Explorar baños", ctaEn: "Explore bathrooms", featured: true, visible: true, sortOrder: 1 },
  { id: "patios", titleEs: "Patios", titleEn: "Patios", descriptionEs: "Espacios para compartir", descriptionEn: "Spaces made for gathering", imageUrl: "https://images.unsplash.com/photo-1517581177682-a085bb7ffb15?w=900&q=85", linkUrl: "/ideas/patios", ctaEs: "Explorar patios", ctaEn: "Explore patios", featured: false, visible: true, sortOrder: 2 },
  { id: "vida-al-aire-libre", titleEs: "Vida al aire libre", titleEn: "Outdoor Living", descriptionEs: "Entretenimiento al aire libre", descriptionEn: "Outdoor entertaining", imageUrl: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=900&q=85", linkUrl: "/ideas/vida-al-aire-libre", ctaEs: "Ver ideas", ctaEn: "View ideas", featured: true, visible: true, sortOrder: 3 },
  { id: "jardineria", titleEs: "Jardinería", titleEn: "Gardening", descriptionEs: "Jardines con intención", descriptionEn: "Landscapes with intention", imageUrl: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=900&q=85", linkUrl: "/ideas/jardineria", ctaEs: "Explorar jardines", ctaEn: "Explore gardens", featured: false, visible: true, sortOrder: 4 },
  { id: "oficinas", titleEs: "Oficinas en casa", titleEn: "Home Offices", descriptionEs: "Espacios de trabajo modernos", descriptionEn: "Modern workspaces", imageUrl: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=900&q=85", linkUrl: "/ideas/oficinas", ctaEs: "Ver oficinas", ctaEn: "View offices", featured: false, visible: true, sortOrder: 5 },
  { id: "garajes", titleEs: "Garajes y talleres", titleEn: "Garage & Workshop", descriptionEs: "Talleres organizados", descriptionEn: "Organized workshops", imageUrl: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=900&q=85", linkUrl: "/ideas/garajes", ctaEs: "Explorar talleres", ctaEn: "Explore workshops", featured: false, visible: true, sortOrder: 6 },
  { id: "almacenamiento", titleEs: "Almacenamiento", titleEn: "Storage", descriptionEs: "Orden hecho a medida", descriptionEn: "Custom organization", imageUrl: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=900&q=85", linkUrl: "/ideas/almacenamiento", ctaEs: "Ver soluciones", ctaEn: "View solutions", featured: false, visible: true, sortOrder: 7 },
  { id: "ampliaciones", titleEs: "Ampliaciones", titleEn: "Home Additions", descriptionEs: "Más espacio, bien diseñado", descriptionEn: "More space, beautifully considered", imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=85", linkUrl: "/ideas/ampliaciones", ctaEs: "Explorar ampliaciones", ctaEn: "Explore additions", featured: true, visible: true, sortOrder: 8 },
  { id: "reparaciones", titleEs: "Reparaciones", titleEn: "Repairs", descriptionEs: "Cuidado profesional del hogar", descriptionEn: "Professional home care", imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=900&q=85", linkUrl: "/ideas/reparaciones", ctaEs: "Ver reparaciones", ctaEn: "View repairs", featured: false, visible: true, sortOrder: 9 },
  { id: "diy", titleEs: "Proyectos DIY", titleEn: "DIY", descriptionEs: "Constrúyelo tú mismo", descriptionEn: "Build it yourself", imageUrl: "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=900&q=85", linkUrl: "/ideas/diy", ctaEs: "Explorar proyectos", ctaEn: "Explore projects", featured: false, visible: true, sortOrder: 10 },
];

// Empty by design — an empty FAQ item list falls back to the reviewed seed FAQ
// in lib/faq.ts on the public /faq page, so a fresh settings file renders the
// exact page it does today. Operators add CMS items to take over the content.
export const DEFAULT_FAQ: SouthlineFaqContent = {
  enabled: true,
  items: [],
};

// Empty by design — an empty column list makes the footer fall back to its
// built-in columns (see Footer.tsx), so the default footer is byte-identical
// to today's. Operators add CMS columns to replace them.
export const DEFAULT_FOOTER: SouthlineFooterContent = {
  visible: true,
  newsletterVisible: true,
  columns: [],
};

// Backward-compatible by design — the contact page and footer fall back to the
// reviewed site name, tagline, and i18n copy when every field is null and the
// hours list is empty, so a fresh settings file renders exactly what it does
// today. Operators fill in fields to make the CMS authoritative.
export const DEFAULT_CONTACT: SouthlineContactContent = {
  enabled: true,
  heading: null,
  body: null,
  businessName: null,
  businessDescription: null,
  phone: null,
  email: null,
  whatsapp: null,
  addressLine1: null,
  addressLine2: null,
  city: null,
  region: null,
  postalCode: null,
  directionsUrl: null,
  primaryCtaLabel: null,
  primaryCtaType: null,
  primaryCtaValue: null,
  hours: [],
};

// Empty by design — Southline has no curated testimonials yet, and the platform
// explicitly avoids stating ratings or review counts that aren't real. An empty
// item list keeps the homepage section hidden until an operator adds curated
// testimonials, so a fresh settings file renders exactly what it does today.
export const DEFAULT_TESTIMONIALS: SouthlineTestimonialsContent = {
  enabled: true,
  heading: null,
  headingEs: null,
  body: null,
  bodyEs: null,
  items: [],
  reviewCtaLabel: null,
  reviewCtaLabelEs: null,
  reviewCtaUrl: null,
};

// Category placeholders only — these are entry points into the SnapLink local
// directory, never fabricated merchants, ratings, counts, or availability. The
// SnapLink category slug is left null until an operator maps a real directory
// category; the redirect then forwards the local category id instead.
export const DEFAULT_LOCAL_DISCOVERY_CATEGORIES: SouthlineLocalCategory[] = [
  { id: "builders-remodelers", labelEn: "Builders and Remodelers", labelEs: "Constructores y remodeladores", descriptionEn: "Browse local builders and remodelers", descriptionEs: "Explora constructores y remodeladores locales", icon: null, imageUrl: null, snaplinkCategory: null, visible: true, featured: true, order: 0 },
  { id: "architects", labelEn: "Architects", labelEs: "Arquitectos", descriptionEn: "Browse local architects", descriptionEs: "Explora arquitectos locales", icon: null, imageUrl: null, snaplinkCategory: null, visible: true, featured: true, order: 1 },
  { id: "interior-designers", labelEn: "Interior Designers", labelEs: "Diseñadores de interiores", descriptionEn: "Browse local interior designers", descriptionEs: "Explora diseñadores de interiores locales", icon: null, imageUrl: null, snaplinkCategory: null, visible: true, featured: true, order: 2 },
  { id: "landscaping", labelEn: "Landscaping", labelEs: "Jardinería y paisajismo", descriptionEn: "Browse local landscaping pros", descriptionEs: "Explora profesionales de jardinería locales", icon: null, imageUrl: null, snaplinkCategory: null, visible: true, featured: true, order: 3 },
  { id: "roofing", labelEn: "Roofing", labelEs: "Techos", descriptionEn: "Browse local roofing pros", descriptionEs: "Explora techadores locales", icon: null, imageUrl: null, snaplinkCategory: null, visible: true, featured: false, order: 4 },
  { id: "pools", labelEn: "Pools", labelEs: "Piscinas", descriptionEn: "Browse local pool pros", descriptionEs: "Explora especialistas en piscinas locales", icon: null, imageUrl: null, snaplinkCategory: null, visible: true, featured: false, order: 5 },
  { id: "photography", labelEn: "Photography", labelEs: "Fotografía", descriptionEn: "Browse local photographers", descriptionEs: "Explora fotógrafos locales", icon: null, imageUrl: null, snaplinkCategory: null, visible: true, featured: false, order: 6 },
  { id: "real-estate", labelEn: "Real Estate", labelEs: "Bienes raíces", descriptionEn: "Browse local real estate professionals", descriptionEs: "Explora profesionales inmobiliarios locales", icon: null, imageUrl: null, snaplinkCategory: null, visible: true, featured: false, order: 7 },
];

export const DEFAULT_LOCAL_DISCOVERY: SouthlineLocalDiscoveryContent = {
  enabled: true,
  eyebrowEn: null,
  eyebrowEs: null,
  titleEn: null,
  titleEs: null,
  descriptionEn: null,
  descriptionEs: null,
  zipPlaceholderEn: null,
  zipPlaceholderEs: null,
  submitLabelEn: null,
  submitLabelEs: null,
  poweredByLabelEn: null,
  poweredByLabelEs: null,
  directoryBaseUrl: "https://snaplink.southlineone.com/en/local",
  defaultCategory: null,
  categories: DEFAULT_LOCAL_DISCOVERY_CATEGORIES.map((category) => ({ ...category })),
  showOnHomepage: true,
  showCategoryCards: true,
};

// Deep-merges a stored (possibly partial or absent) local-discovery section onto
// the defaults. Categories are deterministic: the stored array wins verbatim when
// present (its order is authoritative); unknown top-level fields survive via the
// spread. Old settings files without this section get the shipped defaults.
export function mergeLocalDiscoveryContent(
  stored: Partial<SouthlineLocalDiscoveryContent> | null | undefined
): SouthlineLocalDiscoveryContent {
  const defaults = DEFAULT_LOCAL_DISCOVERY;
  const source = stored ?? {};
  const normalized: Partial<SouthlineLocalDiscoveryContent> = {};
  for (const field of [
    "eyebrowEn",
    "eyebrowEs",
    "titleEn",
    "titleEs",
    "descriptionEn",
    "descriptionEs",
    "zipPlaceholderEn",
    "zipPlaceholderEs",
    "submitLabelEn",
    "submitLabelEs",
    "poweredByLabelEn",
    "poweredByLabelEs",
    "directoryBaseUrl",
    "defaultCategory",
  ] as const) {
    const value = source[field];
    if (typeof value === "string" && value.trim().length === 0) {
      normalized[field] = null;
    }
  }
  return {
    ...defaults,
    ...source,
    ...normalized,
    categories: source.categories
      ? source.categories
      : defaults.categories.map((category) => ({ ...category })),
  };
}

export const DEFAULT_FEATURE_FLAGS: Record<string, boolean> = {
  southline_homepage: true,
  consumer_booking: true,
  project_planner: true,
  diy_hub: true,
  diy_premium: false,
  contractor_recruitment: true,
  claim_business: false,
  community_spotlight: false,
};

// Backward-compatible by design — every field defaults to null and robots to a
// fully-open crawl, so the metadata builder falls back to the exact strings and
// images the site ships today when no SEO settings are present. Operators fill
// fields in to make the CMS authoritative.
export const DEFAULT_ROBOTS: SouthlineRobotsContent = {
  index: true,
  follow: true,
  noarchive: false,
  nosnippet: false,
  noimageindex: false,
};

function emptyPageSeoOverride(): SouthlinePageSeoOverride {
  return {
    title: null,
    titleEs: null,
    description: null,
    descriptionEs: null,
    canonicalPath: null,
    openGraphTitle: null,
    openGraphTitleEs: null,
    openGraphDescription: null,
    openGraphDescriptionEs: null,
    openGraphImageUrl: null,
    twitterTitle: null,
    twitterTitleEs: null,
    twitterDescription: null,
    twitterDescriptionEs: null,
    twitterImageUrl: null,
    robots: null,
  };
}

export const DEFAULT_SEO: SouthlineSeoContent = {
  siteName: null,

  defaultTitle: null,
  defaultTitleEs: null,

  titleTemplate: null,
  titleTemplateEs: null,

  defaultDescription: null,
  defaultDescriptionEs: null,

  canonicalSiteUrl: null,

  defaultOpenGraphTitle: null,
  defaultOpenGraphTitleEs: null,

  defaultOpenGraphDescription: null,
  defaultOpenGraphDescriptionEs: null,

  defaultOpenGraphImageUrl: null,

  defaultTwitterTitle: null,
  defaultTwitterTitleEs: null,

  defaultTwitterDescription: null,
  defaultTwitterDescriptionEs: null,

  defaultTwitterImageUrl: null,

  twitterCardType: "summary_large_image",

  defaultRobots: { ...DEFAULT_ROBOTS },

  organizationName: null,
  organizationLogoUrl: null,

  googleSiteVerification: null,
  bingSiteVerification: null,

  pages: {
    home: emptyPageSeoOverride(),
    faq: emptyPageSeoOverride(),
    contact: emptyPageSeoOverride(),
  },
};

export function cloneDefaultSeo(): SouthlineSeoContent {
  return {
    ...DEFAULT_SEO,
    defaultRobots: { ...DEFAULT_SEO.defaultRobots },
    pages: {
      home: { ...DEFAULT_SEO.pages.home },
      faq: { ...DEFAULT_SEO.pages.faq },
      contact: { ...DEFAULT_SEO.pages.contact },
    },
  };
}

export function defaultSouthlineSettings(): SouthlineSettings {
  return {
    hero: { ...DEFAULT_HERO },
    heroImage: { ...DEFAULT_HERO_IMAGE },
    homeServices: { ...DEFAULT_HOME_SERVICES },
    trendingProjects: DEFAULT_TRENDING_PROJECTS.map((item) => ({ ...item })),
    seasonal: { ...DEFAULT_SEASONAL },
    categories: DEFAULT_CATEGORIES.map((category) => ({ ...category })),
    sections: { ...DEFAULT_SECTIONS },
    featuredContractorIds: [],
    featuredAgentProfileIds: [],
    realEstateBlock: { ...DEFAULT_REAL_ESTATE_BLOCK },
    featureFlags: { ...DEFAULT_FEATURE_FLAGS },
    faq: { ...DEFAULT_FAQ, items: [] },
    footer: { ...DEFAULT_FOOTER, columns: [] },
    contact: { ...DEFAULT_CONTACT, hours: [] },
    testimonials: { ...DEFAULT_TESTIMONIALS, items: [] },
    localDiscovery: {
      ...DEFAULT_LOCAL_DISCOVERY,
      categories: DEFAULT_LOCAL_DISCOVERY.categories.map((category) => ({ ...category })),
    },
    seo: cloneDefaultSeo(),
    navigation: {
      items: [
        { key: "navHome", href: "/", labelEs: "Inicio", labelEn: "Home", visible: true },
        { key: "navHomes", href: "/homes", labelEs: "Casas", labelEn: "Homes", visible: true },
        { key: "navIdeas", href: "/#categories", labelEs: "Ideas", labelEn: "Ideas", visible: true },
        { key: "navRealEstate", href: "/#real-estate", labelEs: "Bienes Raíces", labelEn: "Real Estate", visible: true },
        { key: "navProjects", href: "/planner", labelEs: "Proyectos", labelEn: "Projects", visible: true },
        { key: "navDIY", href: "/diy", labelEs: "DIY", labelEn: "DIY", visible: true },
        { key: "navPros", href: "/#professionals", labelEs: "Profesionales", labelEn: "Professionals", visible: true },
        { key: "navBook", href: "/book", labelEs: "Reservar", labelEn: "Book", visible: true },
      ],
    },
    spotlight: [],
    updatedAt: new Date().toISOString(),
  };
}
