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

export interface SouthlineSettings {
  hero: HeroContent;
  sections: SectionVisibility;
  featuredContractorIds: string[];
  featureFlags: Record<string, boolean>;
  seo: {
    titleEs: string;
    titleEn: string;
    descriptionEs: string;
    descriptionEn: string;
    ogTitleEs: string;
    ogTitleEn: string;
    ogDescriptionEs: string;
    ogDescriptionEn: string;
  };
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
};

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

export const DEFAULT_SEO = {
  titleEs: "Southline Living — Ideas para tu hogar y profesionales de confianza",
  titleEn: "Southline Living — Home ideas and trusted professionals",
  descriptionEs: "Explora espacios inspiradores, planifica tu próximo proyecto y conecta con profesionales locales de Snaplink.",
  descriptionEn: "Explore inspiring spaces, plan your next project, and connect with local Snaplink professionals.",
  ogTitleEs: "Southline Living — Ideas para cada hogar",
  ogTitleEn: "Southline Living — Ideas for every home",
  ogDescriptionEs: "Explora, planifica y conecta con profesionales de confianza para tu hogar.",
  ogDescriptionEn: "Explore, plan, and connect with trusted home professionals.",
};

export function defaultSouthlineSettings(): SouthlineSettings {
  return {
    hero: { ...DEFAULT_HERO },
    sections: { ...DEFAULT_SECTIONS },
    featuredContractorIds: [],
    featureFlags: { ...DEFAULT_FEATURE_FLAGS },
    seo: { ...DEFAULT_SEO },
    navigation: {
      items: [
        { key: "navHome", href: "/", labelEs: "Inicio", labelEn: "Home", visible: true },
        { key: "navIdeas", href: "#", labelEs: "Ideas", labelEn: "Ideas", visible: true },
        { key: "navProjects", href: "#", labelEs: "Proyectos", labelEn: "Projects", visible: true },
        { key: "navDIY", href: "#", labelEs: "DIY", labelEn: "DIY", visible: true },
        { key: "navPros", href: "#", labelEs: "Profesionales", labelEn: "Professionals", visible: true },
        { key: "navBook", href: "#", labelEs: "Reservar", labelEn: "Book", visible: true },
      ],
    },
    spotlight: [],
    updatedAt: new Date().toISOString(),
  };
}
