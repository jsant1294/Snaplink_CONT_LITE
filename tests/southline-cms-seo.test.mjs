import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_ROBOTS,
  DEFAULT_SEO,
  defaultSouthlineSettings,
} from "../lib/southline-types.ts";
import {
  buildSeoMetadata,
  mergeSeoContent,
  organizationJsonLd,
} from "../lib/southline-seo.ts";
import { validateSouthlineSettings } from "../lib/southline-validation.ts";

const source = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("DEFAULT_SEO is backward-compatible: null fields, fully-open robots, summary_large_image, three page overrides", () => {
  assert.equal(DEFAULT_SEO.siteName, null);
  assert.equal(DEFAULT_SEO.defaultTitle, null);
  assert.equal(DEFAULT_SEO.defaultTitleEs, null);
  assert.equal(DEFAULT_SEO.titleTemplate, null);
  assert.equal(DEFAULT_SEO.titleTemplateEs, null);
  assert.equal(DEFAULT_SEO.defaultDescription, null);
  assert.equal(DEFAULT_SEO.defaultDescriptionEs, null);
  assert.equal(DEFAULT_SEO.canonicalSiteUrl, null);
  assert.equal(DEFAULT_SEO.defaultOpenGraphImageUrl, null);
  assert.equal(DEFAULT_SEO.defaultTwitterImageUrl, null);
  assert.equal(DEFAULT_SEO.twitterCardType, "summary_large_image");
  assert.deepEqual(DEFAULT_SEO.defaultRobots, DEFAULT_ROBOTS);
  assert.deepEqual(Object.keys(DEFAULT_SEO.pages).sort(), ["contact", "faq", "home"]);
  for (const key of ["home", "faq", "contact"]) {
    assert.equal(DEFAULT_SEO.pages[key].title, null);
    assert.equal(DEFAULT_SEO.pages[key].canonicalPath, null);
    assert.equal(DEFAULT_SEO.pages[key].robots, null);
  }
});

test("defaultSouthlineSettings includes a seo object that deep-equals the default", () => {
  const settings = defaultSouthlineSettings();
  assert.deepEqual(settings.seo, DEFAULT_SEO);
});

test("mergeSeoContent with no stored values produces the canonical DEFAULT_SEO shape", () => {
  assert.deepEqual(mergeSeoContent(undefined), DEFAULT_SEO);
  assert.deepEqual(mergeSeoContent(null), DEFAULT_SEO);
});

test("mergeSeoContent maps legacy flat Slice-1 seo fields onto the new default fields", () => {
  const merged = mergeSeoContent({
    titleEn: "Custom EN title",
    titleEs: "Custom ES title",
    descriptionEn: "Custom EN description",
    descriptionEs: "Custom ES description",
    ogTitleEn: "Custom OG EN",
    ogTitleEs: "Custom OG ES",
    ogDescriptionEn: "Custom OG DESC EN",
    ogDescriptionEs: "Custom OG DESC ES",
  });
  assert.equal(merged.defaultTitle, "Custom EN title");
  assert.equal(merged.defaultTitleEs, "Custom ES title");
  assert.equal(merged.defaultDescription, "Custom EN description");
  assert.equal(merged.defaultDescriptionEs, "Custom ES description");
  assert.equal(merged.defaultOpenGraphTitle, "Custom OG EN");
  assert.equal(merged.defaultOpenGraphTitleEs, "Custom OG ES");
  assert.equal(merged.defaultOpenGraphDescription, "Custom OG DESC EN");
  assert.equal(merged.defaultOpenGraphDescriptionEs, "Custom OG DESC ES");
  assert.deepEqual(merged.pages.home, DEFAULT_SEO.pages.home);
});

test("mergeSeoContent deep-merges defaultRobots, page overrides, and defaults for empty strings", () => {
  const merged = mergeSeoContent({
    defaultTitle: "    ",
    defaultRobots: { index: false },
    pages: {
      faq: { title: "FAQ custom", robots: { follow: false } },
      contact: { title: "" },
    },
  });
  assert.equal(merged.defaultTitle, DEFAULT_SEO.defaultTitle);
  assert.deepEqual(merged.defaultRobots, { ...DEFAULT_ROBOTS, index: false });
  assert.equal(merged.pages.faq.title, "FAQ custom");
  assert.deepEqual(merged.pages.faq.robots, { ...DEFAULT_ROBOTS, follow: false });
  assert.equal(merged.pages.contact.title, null);
  assert.equal(merged.pages.contact.robots, null);
  assert.equal(merged.pages.home.title, null);
});

test("buildSeoMetadata for home with no settings keeps today's exact fallbacks (en and es)", () => {
  const en = buildSeoMetadata({ lang: "en", seo: null, pageKey: "home" });
  assert.equal(en.title, "Southline Living — Home ideas and trusted professionals");
  assert.equal(
    en.description,
    "Explore inspiring spaces, plan your next project, and connect with local Snaplink professionals."
  );
  assert.equal(en.openGraph.title, "Southline Living — Ideas for every home");
  assert.equal(
    en.openGraph.description,
    "Explore, plan, and connect with trusted home professionals."
  );
  assert.equal(en.openGraph.siteName, "Southline Living");
  assert.equal(en.openGraph.images[0].url, "/og-image.jpg");
  assert.equal(en.twitter.card, "summary_large_image");
  assert.equal(en.twitter.images[0], "/og-image.jpg");
  assert.equal(en.alternates.canonical, "http://localhost:3000");
  assert.deepEqual(en.alternates.languages, { en: "/", es: "/" });
  assert.equal(en.robots, undefined);

  const es = buildSeoMetadata({ lang: "es", seo: null, pageKey: "home" });
  assert.equal(es.title, "Southline Living — Ideas para tu hogar y profesionales de confianza");
  assert.equal(es.openGraph.locale, "es_US");
  assert.equal(
    es.openGraph.title,
    "Southline Living — Ideas para cada hogar"
  );
});

test("buildSeoMetadata applies defaults and per-page overrides (most-specific wins)", () => {
  const seo = mergeSeoContent({
    siteName: "Southline Living Inc",
    defaultTitle: "Default EN",
    defaultTitleEs: "Default ES",
    defaultDescription: "Default description EN",
    defaultOpenGraphImageUrl: "/custom-og.jpg",
    defaultTwitterTitle: "Default twitter EN",
    canonicalSiteUrl: "https://southlineliving.com",
    pages: {
      faq: {
        title: "Help Center",
        titleEs: "Centro de ayuda",
        canonicalPath: "/ayuda",
      },
    },
  });
  const en = buildSeoMetadata({ lang: "en", seo, pageKey: "faq" });
  assert.equal(en.title, "Help Center | Southline Living");
  assert.equal(en.openGraph.siteName, "Southline Living Inc");
  assert.equal(en.openGraph.title, "Help Center | Southline Living");
  assert.equal(en.openGraph.images[0].url, "/custom-og.jpg");
  assert.equal(en.twitter.images[0], "/custom-og.jpg");
  assert.equal(en.alternates.canonical, "https://southlineliving.com/ayuda");
  assert.equal(en.alternates.languages, undefined);

  const es = buildSeoMetadata({ lang: "es", seo, pageKey: "faq" });
  assert.equal(es.title, "Centro de ayuda");
  assert.equal(es.openGraph.title, "Centro de ayuda");
});

test("buildSeoMetadata for faq and contact falls back to the existing static titles when no settings", () => {
  const faq = buildSeoMetadata({ lang: "en", seo: null, pageKey: "faq" });
  assert.equal(faq.title, "FAQ | Southline Living");
  assert.equal(faq.alternates.canonical, "http://localhost:3000/faq");
  assert.equal(
    faq.description,
    "Answers about Southline Living, SnapLink, homes, professionals, quotes, booking, and more."
  );

  const contact = buildSeoMetadata({ lang: "en", seo: null, pageKey: "contact" });
  assert.equal(contact.title, "Contact | Southline Living");
  assert.equal(contact.alternates.canonical, "http://localhost:3000/contact");
  assert.equal(
    contact.description,
    "Contact Southline Living — phone, email, WhatsApp, address, and business hours."
  );
});

test("buildSeoMetadata emits robots meta only when robots deviate from the fully-open default", () => {
  const open = buildSeoMetadata({ lang: "en", seo: null, pageKey: "home" });
  assert.equal(open.robots, undefined);

  const noIndex = buildSeoMetadata({
    lang: "en",
    seo: mergeSeoContent({ defaultRobots: { index: false } }),
    pageKey: "home",
  });
  assert.deepEqual(noIndex.robots, { index: false, follow: true, noarchive: false, nosnippet: false, noimageindex: false });

  const pageNoIndex = buildSeoMetadata({
    lang: "en",
    seo: mergeSeoContent({ pages: { contact: { robots: { index: false } } } }),
    pageKey: "contact",
  });
  assert.equal(pageNoIndex.robots.index, false);
});

test("buildSeoMetadata includes verification tokens only when configured", () => {
  const none = buildSeoMetadata({ lang: "en", seo: null, pageKey: "home" });
  assert.equal(none.verification, undefined);

  const withTokens = buildSeoMetadata({
    lang: "en",
    seo: mergeSeoContent({ googleSiteVerification: "g123", bingSiteVerification: "b456" }),
    pageKey: "home",
  });
  assert.deepEqual(withTokens.verification, { google: "g123", other: { "msvalidate.01": "b456" } });
});

test("organizationJsonLd returns null without a name and a well-formed node otherwise", () => {
  assert.equal(organizationJsonLd(null), null);
  assert.equal(organizationJsonLd(mergeSeoContent({ siteName: "Southline Living" })).name, "Southline Living");
  const org = organizationJsonLd(
    mergeSeoContent({
      organizationName: "Southline Living LLC",
      organizationLogoUrl: "https://cdn.example.com/logo.png",
      canonicalSiteUrl: "https://southlineliving.com/",
    })
  );
  assert.deepEqual(org, {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Southline Living LLC",
    url: "https://southlineliving.com",
    logo: "https://cdn.example.com/logo.png",
  });
});

test("validateSouthlineSettings accepts a well-formed seo patch", () => {
  const patch = {
    seo: {
      siteName: "Southline Living",
      defaultTitle: "Custom",
      titleTemplate: "%s | Custom",
      canonicalSiteUrl: "https://southlineliving.com",
      twitterCardType: "summary_large_image",
      defaultRobots: { index: true, follow: true, noarchive: false, nosnippet: false, noimageindex: false },
      pages: {
        home: { title: "Custom home", robots: { index: true, follow: false, noarchive: true, nosnippet: false, noimageindex: false } },
        faq: { canonicalPath: "/faq", descriptionEs: null },
        contact: { title: null },
      },
    },
  };
  assert.equal(validateSouthlineSettings(patch), null);
});

test("validateSouthlineSettings rejects malformed seo patches", () => {
  assert.match(validateSouthlineSettings({ seo: "nope" }), /seo must be an object/);
  assert.match(
    validateSouthlineSettings({ seo: { twitterCardType: "big" } }),
    /seo\.twitterCardType must be one of summary, summary_large_image/
  );
  assert.match(
    validateSouthlineSettings({ seo: { defaultTitle: 5 } }),
    /seo\.defaultTitle must be a string or null/
  );
  assert.match(
    validateSouthlineSettings({ seo: { defaultRobots: { index: "yes" } } }),
    /seo\.defaultRobots\.index must be a boolean/
  );
  assert.match(
    validateSouthlineSettings({ seo: { pages: { faq: { title: false } } } }),
    /seo\.pages\.faq\.title must be a string or null/
  );
  assert.match(
    validateSouthlineSettings({ seo: { pages: { faq: { robots: { index: true, follow: 1, noarchive: false, nosnippet: false, noimageindex: false } } } } }),
    /seo\.pages\.faq\.robots\.follow must be a boolean/
  );
  assert.match(
    validateSouthlineSettings({ seo: { pages: "nope" } }),
    /seo\.pages must be an object/
  );
});

test("the root layout builds metadata via buildSeoMetadata and renders the Organization JSON-LD", async () => {
  const layout = await source("../app/layout.tsx");
  assert.match(layout, /buildSeoMetadata\(\{ lang, seo, pageKey: "home" \}\)/);
  assert.match(layout, /OrganizationJsonLd/);
});

test("faq and contact pages generate metadata through the shared builder", async () => {
  const faq = await source("../app/faq/page.tsx");
  assert.match(faq, /export async function generateMetadata\(\)/);
  assert.match(faq, /buildSeoMetadata\(\{ lang, seo, pageKey: "faq" \}\)/);
  assert.doesNotMatch(faq, /export const metadata: Metadata/);

  const contact = await source("../app/contact/page.tsx");
  assert.match(contact, /export async function generateMetadata\(\)/);
  assert.match(contact, /buildSeoMetadata\(\{ lang, seo, pageKey: "contact" \}\)/);
  assert.doesNotMatch(contact, /export const metadata: Metadata/);
});

test("the sitemap uses the canonical site URL and includes /faq and /contact", async () => {
  const sitemap = await source("../app/sitemap.ts");
  assert.match(sitemap, /settings\?\.seo\?\.canonicalSiteUrl/);
  assert.match(sitemap, /process\.env\.APP_URL/);
  assert.match(sitemap, /https:\/\/southlineliving\.com/);
  assert.match(sitemap, /\$\{baseUrl\}\/faq/);
  assert.match(sitemap, /\$\{baseUrl\}\/contact/);
});

test("the JSON store merges seo through mergeSeoContent on read", async () => {
  const store = await source("../lib/southline-store-json.ts");
  assert.match(store, /seo: mergeSeoContent\(stored\.seo\)/);
});

test("the admin shell exposes an SEO & Social tab wired to SeoEditor", async () => {
  const admin = await source("../app/southline/admin/page.tsx");
  assert.match(admin, /SeoEditor/);
  assert.match(admin, /\{ key: "seo", label: "SEO & Social" \}/);
  assert.match(admin, /tab === "seo" && <SeoEditor pin=\{pin\} \/>/);
});

test("SeoEditor offers defaults, OG, twitter, robots, org, verification, and per-page controls", async () => {
  const editor = await source("../components/southline/admin/SeoEditor.tsx");
  assert.match(editor, /Canonical site URL/);
  assert.match(editor, /Open Graph \(social sharing\)/);
  assert.match(editor, /Twitter card/);
  assert.match(editor, /Robots \(default, applied everywhere\)/);
  assert.match(editor, /Organization \(JSON-LD\)/);
  assert.match(editor, /Google site verification/);
  assert.match(editor, /Custom robots for this page/);
  assert.match(editor, /PAGE_KEYS = \["home", "faq", "contact"\]/);
});
