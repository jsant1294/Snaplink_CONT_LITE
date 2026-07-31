import type { Metadata } from "next";
import type { Lang } from "./southline-i18n";
import type {
  SouthlinePageSeoOverride,
  SouthlineRobotsContent,
  SouthlineSeoContent,
} from "./southline-types";

const SITE_NAME = "Southline Living";
const DEFAULT_OG_IMAGE = "/og-image.jpg";
const DEFAULT_TITLE_TEMPLATE = "%s | Southline Living";
const DEFAULT_APP_URL = "http://localhost:3000";

// Mirrors the fully-open crawl default in lib/southline-types.ts (kept local so
// this module stays a leaf that node --test can import without extension
// resolution; mergeSeoContent(undefined) is asserted to deep-equal DEFAULT_SEO).
const DEFAULT_ROBOTS: SouthlineRobotsContent = {
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

function createDefaultSeo(): SouthlineSeoContent {
  return {
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
}

export type SouthlinePageKey = "home" | "faq" | "contact";

type FallbackPair = { en: string; es: string };
type NullablePair = { en: string | null; es: string | null };

type PageFallbacks = {
  title: FallbackPair;
  description: FallbackPair;
  ogTitle: NullablePair;
  ogDescription: NullablePair;
  path: string;
};

// Exact strings the site has always shipped with, so absent SEO settings keep
// today's metadata byte-for-byte.
const PAGE_FALLBACKS: Record<SouthlinePageKey, PageFallbacks> = {
  home: {
    title: {
      en: "Southline Living — Home ideas and trusted professionals",
      es: "Southline Living — Ideas para tu hogar y profesionales de confianza",
    },
    description: {
      en: "Explore inspiring spaces, plan your next project, and connect with local Snaplink professionals.",
      es: "Explora espacios inspiradores, planifica tu próximo proyecto y conecta con profesionales locales de Snaplink.",
    },
    ogTitle: {
      en: "Southline Living — Ideas for every home",
      es: "Southline Living — Ideas para cada hogar",
    },
    ogDescription: {
      en: "Explore, plan, and connect with trusted home professionals.",
      es: "Explora, planifica y conecta con profesionales de confianza para tu hogar.",
    },
    path: "/",
  },
  faq: {
    title: { en: "FAQ", es: "Preguntas frecuentes" },
    description: {
      en: "Answers about Southline Living, SnapLink, homes, professionals, quotes, booking, and more.",
      es: "Respuestas sobre Southline Living, SnapLink, casas, profesionales, cotizaciones, reservas y más.",
    },
    ogTitle: { en: null, es: null },
    ogDescription: { en: null, es: null },
    path: "/faq",
  },
  contact: {
    title: { en: "Contact", es: "Contacto" },
    description: {
      en: "Contact Southline Living — phone, email, WhatsApp, address, and business hours.",
      es: "Contacta con Southline Living — teléfono, correo, WhatsApp, dirección y horario de atención.",
    },
    ogTitle: { en: null, es: null },
    ogDescription: { en: null, es: null },
    path: "/contact",
  },
};

function pick(lang: Lang, en: string | null, es: string | null): string {
  return lang === "es" ? (es ?? en) ?? "" : (en ?? es) ?? "";
}

function applyTitleTemplate(title: string, template: string | null, lang: Lang): string {
  const tmpl = lang === "es" ? template : template ?? DEFAULT_TITLE_TEMPLATE;
  if (tmpl && tmpl.includes("%s")) return tmpl.replace("%s", title);
  return title;
}

export function isDefaultRobots(robots: SouthlineRobotsContent | null | undefined): boolean {
  return (
    !!robots &&
    robots.index === DEFAULT_ROBOTS.index &&
    robots.follow === DEFAULT_ROBOTS.follow &&
    robots.noarchive === DEFAULT_ROBOTS.noarchive &&
    robots.nosnippet === DEFAULT_ROBOTS.nosnippet &&
    robots.noimageindex === DEFAULT_ROBOTS.noimageindex
  );
}

function stringOr(value: unknown, fallback: string | null): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function mergeRobots(raw: unknown): SouthlineRobotsContent | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Partial<SouthlineRobotsContent>;
  return { ...DEFAULT_ROBOTS, ...r };
}

function mergePageOverride(
  defaults: SouthlinePageSeoOverride,
  raw: unknown
): SouthlinePageSeoOverride {
  if (!raw || typeof raw !== "object") return { ...defaults };
  const r = raw as Record<string, unknown>;
  return {
    title: stringOr(r.title, defaults.title),
    titleEs: stringOr(r.titleEs, defaults.titleEs),
    description: stringOr(r.description, defaults.description),
    descriptionEs: stringOr(r.descriptionEs, defaults.descriptionEs),
    canonicalPath: stringOr(r.canonicalPath, defaults.canonicalPath),
    openGraphTitle: stringOr(r.openGraphTitle, defaults.openGraphTitle),
    openGraphTitleEs: stringOr(r.openGraphTitleEs, defaults.openGraphTitleEs),
    openGraphDescription: stringOr(r.openGraphDescription, defaults.openGraphDescription),
    openGraphDescriptionEs: stringOr(r.openGraphDescriptionEs, defaults.openGraphDescriptionEs),
    openGraphImageUrl: stringOr(r.openGraphImageUrl, defaults.openGraphImageUrl),
    twitterTitle: stringOr(r.twitterTitle, defaults.twitterTitle),
    twitterTitleEs: stringOr(r.twitterTitleEs, defaults.twitterTitleEs),
    twitterDescription: stringOr(r.twitterDescription, defaults.twitterDescription),
    twitterDescriptionEs: stringOr(r.twitterDescriptionEs, defaults.twitterDescriptionEs),
    twitterImageUrl: stringOr(r.twitterImageUrl, defaults.twitterImageUrl),
    robots: mergeRobots(r.robots),
  };
}

// Deep-merges a stored (possibly legacy or partial) seo object onto the current
// defaults. The Slice 1 settings shape used flat `titleEn/titleEs/...` fields;
// those are mapped onto the new `default*` fields so previously customized SEO
// text keeps applying after the refactor.
export function mergeSeoContent(stored: SouthlineSeoContent | null | undefined): SouthlineSeoContent {
  const defaults = createDefaultSeo();
  const raw = (stored ?? {}) as Record<string, unknown>;
  return {
    ...defaults,
    siteName: stringOr(raw.siteName, defaults.siteName),
    defaultTitle: stringOr(raw.defaultTitle, stringOr(raw.titleEn, defaults.defaultTitle)),
    defaultTitleEs: stringOr(
      raw.defaultTitleEs,
      stringOr(raw.titleEs, stringOr(raw.defaultTitle, stringOr(raw.titleEn, defaults.defaultTitleEs)))
    ),
    titleTemplate: stringOr(raw.titleTemplate, defaults.titleTemplate),
    titleTemplateEs: stringOr(raw.titleTemplateEs, stringOr(raw.titleTemplate, defaults.titleTemplateEs)),
    defaultDescription: stringOr(
      raw.defaultDescription,
      stringOr(raw.descriptionEn, defaults.defaultDescription)
    ),
    defaultDescriptionEs: stringOr(
      raw.defaultDescriptionEs,
      stringOr(
        raw.descriptionEs,
        stringOr(raw.defaultDescription, stringOr(raw.descriptionEn, defaults.defaultDescriptionEs))
      )
    ),
    canonicalSiteUrl: stringOr(raw.canonicalSiteUrl, defaults.canonicalSiteUrl),
    defaultOpenGraphTitle: stringOr(
      raw.defaultOpenGraphTitle,
      stringOr(raw.ogTitleEn, defaults.defaultOpenGraphTitle)
    ),
    defaultOpenGraphTitleEs: stringOr(
      raw.defaultOpenGraphTitleEs,
      stringOr(
        raw.ogTitleEs,
        stringOr(raw.defaultOpenGraphTitle, stringOr(raw.ogTitleEn, defaults.defaultOpenGraphTitleEs))
      )
    ),
    defaultOpenGraphDescription: stringOr(
      raw.defaultOpenGraphDescription,
      stringOr(raw.ogDescriptionEn, defaults.defaultOpenGraphDescription)
    ),
    defaultOpenGraphDescriptionEs: stringOr(
      raw.defaultOpenGraphDescriptionEs,
      stringOr(
        raw.ogDescriptionEs,
        stringOr(
          raw.defaultOpenGraphDescription,
          stringOr(raw.ogDescriptionEn, defaults.defaultOpenGraphDescriptionEs)
        )
      )
    ),
    defaultOpenGraphImageUrl: stringOr(raw.defaultOpenGraphImageUrl, defaults.defaultOpenGraphImageUrl),
    defaultTwitterTitle: stringOr(raw.defaultTwitterTitle, defaults.defaultTwitterTitle),
    defaultTwitterTitleEs: stringOr(raw.defaultTwitterTitleEs, defaults.defaultTwitterTitleEs),
    defaultTwitterDescription: stringOr(raw.defaultTwitterDescription, defaults.defaultTwitterDescription),
    defaultTwitterDescriptionEs: stringOr(
      raw.defaultTwitterDescriptionEs,
      defaults.defaultTwitterDescriptionEs
    ),
    defaultTwitterImageUrl: stringOr(raw.defaultTwitterImageUrl, defaults.defaultTwitterImageUrl),
    twitterCardType:
      raw.twitterCardType === "summary" || raw.twitterCardType === "summary_large_image"
        ? raw.twitterCardType
        : defaults.twitterCardType,
    defaultRobots: {
      ...defaults.defaultRobots,
      ...(typeof raw.defaultRobots === "object" && raw.defaultRobots !== null
        ? (raw.defaultRobots as Partial<SouthlineRobotsContent>)
        : {}),
    },
    organizationName: stringOr(raw.organizationName, defaults.organizationName),
    organizationLogoUrl: stringOr(raw.organizationLogoUrl, defaults.organizationLogoUrl),
    googleSiteVerification: stringOr(raw.googleSiteVerification, defaults.googleSiteVerification),
    bingSiteVerification: stringOr(raw.bingSiteVerification, defaults.bingSiteVerification),
    pages: {
      home: mergePageOverride(defaults.pages.home, (raw.pages as Record<string, unknown> | undefined)?.home),
      faq: mergePageOverride(defaults.pages.faq, (raw.pages as Record<string, unknown> | undefined)?.faq),
      contact: mergePageOverride(defaults.pages.contact, (raw.pages as Record<string, unknown> | undefined)?.contact),
    },
  };
}

export type BuildSeoMetadataArgs = {
  lang: Lang;
  seo: SouthlineSeoContent | null | undefined;
  pageKey: SouthlinePageKey;
  appUrl?: string;
};

export function buildSeoMetadata({
  lang,
  seo,
  pageKey,
  appUrl = process.env.APP_URL ?? DEFAULT_APP_URL,
}: BuildSeoMetadataArgs): Metadata {
  const page = seo?.pages?.[pageKey] ?? null;
  const fallback = PAGE_FALLBACKS[pageKey];

  const titleEn = page?.title ?? seo?.defaultTitle ?? fallback.title.en;
  const titleEs =
    page?.titleEs ?? page?.title ?? seo?.defaultTitleEs ?? seo?.defaultTitle ?? fallback.title.es;
  const templatedTitleEn =
    pageKey !== "home" ? applyTitleTemplate(titleEn, seo?.titleTemplate ?? null, "en") : titleEn;
  const templatedTitleEs =
    pageKey !== "home"
      ? applyTitleTemplate(titleEs, seo?.titleTemplateEs ?? seo?.titleTemplate ?? null, "es")
      : titleEs;
  const title = pick(lang, templatedTitleEn, templatedTitleEs);

  const descriptionEn = page?.description ?? seo?.defaultDescription ?? fallback.description.en;
  const descriptionEs =
    page?.descriptionEs ??
    page?.description ??
    seo?.defaultDescriptionEs ??
    seo?.defaultDescription ??
    fallback.description.es;
  const description = pick(lang, descriptionEn, descriptionEs);

  const ogTitleEn =
    page?.openGraphTitle ?? seo?.defaultOpenGraphTitle ?? fallback.ogTitle.en ?? templatedTitleEn;
  const ogTitleEs =
    page?.openGraphTitleEs ??
    page?.openGraphTitle ??
    seo?.defaultOpenGraphTitleEs ??
    seo?.defaultOpenGraphTitle ??
    fallback.ogTitle.es ??
    templatedTitleEs;
  const ogTitle = pick(lang, ogTitleEn, ogTitleEs);

  const ogDescriptionEn =
    page?.openGraphDescription ??
    seo?.defaultOpenGraphDescription ??
    fallback.ogDescription.en ??
    descriptionEn;
  const ogDescriptionEs =
    page?.openGraphDescriptionEs ??
    page?.openGraphDescription ??
    seo?.defaultOpenGraphDescriptionEs ??
    seo?.defaultOpenGraphDescription ??
    fallback.ogDescription.es ??
    descriptionEs;
  const ogDescription = pick(lang, ogDescriptionEn, ogDescriptionEs);

  const siteName = seo?.siteName ?? SITE_NAME;
  const ogImage = page?.openGraphImageUrl ?? seo?.defaultOpenGraphImageUrl ?? DEFAULT_OG_IMAGE;

  const base = (seo?.canonicalSiteUrl ?? appUrl).replace(/\/+$/, "");
  const rawPath = page?.canonicalPath ?? fallback.path;
  const canonicalPath = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
  const canonical = canonicalPath === "/" ? base : `${base}${canonicalPath}`;

  const robots = page?.robots ?? seo?.defaultRobots ?? DEFAULT_ROBOTS;

  const twitterTitleEn = page?.twitterTitle ?? seo?.defaultTwitterTitle ?? ogTitleEn;
  const twitterTitleEs =
    page?.twitterTitleEs ?? page?.twitterTitle ?? seo?.defaultTwitterTitleEs ?? seo?.defaultTwitterTitle ?? ogTitleEs;
  const twitterTitle = pick(lang, twitterTitleEn, twitterTitleEs);

  const twitterDescriptionEn =
    page?.twitterDescription ?? seo?.defaultTwitterDescription ?? ogDescriptionEn;
  const twitterDescriptionEs =
    page?.twitterDescriptionEs ??
    page?.twitterDescription ??
    seo?.defaultTwitterDescriptionEs ??
    seo?.defaultTwitterDescription ??
    ogDescriptionEs;
  const twitterDescription = pick(lang, twitterDescriptionEn, twitterDescriptionEs);

  const twitterImage = page?.twitterImageUrl ?? seo?.defaultTwitterImageUrl ?? ogImage;
  const twitterCard = seo?.twitterCardType ?? "summary_large_image";

  const verification: Metadata["verification"] = {};
  if (seo?.googleSiteVerification) verification.google = seo.googleSiteVerification;
  if (seo?.bingSiteVerification) {
    verification.other = { "msvalidate.01": seo.bingSiteVerification };
  }

  const metadata: Metadata = {
    metadataBase: new URL(appUrl),
    title,
    description,
    openGraph: {
      type: "website",
      siteName,
      title: ogTitle,
      description: ogDescription,
      locale: lang === "es" ? "es_US" : "en_US",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: siteName,
        },
      ],
    },
    twitter: {
      card: twitterCard,
      title: twitterTitle,
      description: twitterDescription,
      images: [twitterImage],
    },
    alternates: {
      canonical,
      ...(pageKey === "home" ? { languages: { en: "/", es: "/" } } : {}),
    },
  };

  if (!isDefaultRobots(robots)) {
    metadata.robots = {
      index: robots.index,
      follow: robots.follow,
      noarchive: robots.noarchive,
      nosnippet: robots.nosnippet,
      noimageindex: robots.noimageindex,
    };
  }

  if (Object.keys(verification).length > 0) metadata.verification = verification;

  return metadata;
}

export function organizationJsonLd(
  seo: SouthlineSeoContent | null | undefined
): Record<string, unknown> | null {
  const name = seo?.organizationName ?? seo?.siteName ?? null;
  if (!name) return null;
  const url = (seo?.canonicalSiteUrl ?? process.env.APP_URL ?? DEFAULT_APP_URL).replace(/\/+$/, "");
  const org: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url,
  };
  if (seo?.organizationLogoUrl) org.logo = seo.organizationLogoUrl;
  return org;
}
