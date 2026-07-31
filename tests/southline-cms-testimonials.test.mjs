import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { DEFAULT_TESTIMONIALS, defaultSouthlineSettings } from "../lib/southline-types.ts";
import { visibleTestimonials } from "../lib/southline-testimonials.ts";
import { validateSouthlineSettings } from "../lib/southline-validation.ts";

const source = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("DEFAULT_TESTIMONIALS is backward-compatible: enabled with an empty item list so the homepage section stays hidden", () => {
  assert.equal(DEFAULT_TESTIMONIALS.enabled, true);
  assert.deepEqual(DEFAULT_TESTIMONIALS.items, []);
  assert.equal(DEFAULT_TESTIMONIALS.heading, null);
  assert.equal(DEFAULT_TESTIMONIALS.headingEs, null);
  assert.equal(DEFAULT_TESTIMONIALS.body, null);
  assert.equal(DEFAULT_TESTIMONIALS.bodyEs, null);
  assert.equal(DEFAULT_TESTIMONIALS.reviewCtaLabel, null);
  assert.equal(DEFAULT_TESTIMONIALS.reviewCtaLabelEs, null);
  assert.equal(DEFAULT_TESTIMONIALS.reviewCtaUrl, null);
});

test("defaultSouthlineSettings includes a testimonials object that deep-equals the default", () => {
  const settings = defaultSouthlineSettings();
  assert.deepEqual(settings.testimonials, DEFAULT_TESTIMONIALS);
});

test("visibleTestimonials returns only enabled items, sorted by sortOrder, and [] for undefined content", () => {
  assert.deepEqual(visibleTestimonials(undefined), []);
  assert.deepEqual(visibleTestimonials({ enabled: true, items: [] }), []);
  const item = (id, sortOrder, enabled) => ({
    id,
    quote: "Q",
    authorName: "A",
    enabled,
    featured: false,
    sortOrder,
  });
  const ids = visibleTestimonials({
    enabled: true,
    items: [
      item("c", 2, true),
      item("a", 0, true),
      item("hidden", 1, false),
    ],
  }).map((i) => i.id);
  assert.deepEqual(ids, ["a", "c"]);
});

test("validateSouthlineSettings accepts a well-formed testimonials patch", () => {
  const patch = {
    testimonials: {
      enabled: true,
      heading: "What homeowners say",
      headingEs: "Lo que dicen los propietarios",
      items: [
        {
          id: "t1",
          quote: "Amazing kitchen remodel.",
          quoteEs: "Remodelación de cocina increíble.",
          authorName: "Maria Lopez",
          authorNameEs: null,
          authorTitle: "Homeowner",
          authorTitleEs: "Propietaria",
          companyName: null,
          companyNameEs: null,
          imageUrl: null,
          rating: 5,
          sourceLabel: "Google",
          sourceUrl: "https://g.page/x",
          enabled: true,
          featured: true,
          sortOrder: 0,
        },
      ],
      reviewCtaLabel: "Leave a review",
      reviewCtaLabelEs: "Deja una reseña",
      reviewCtaUrl: "https://g.page/x",
    },
  };
  assert.equal(validateSouthlineSettings(patch), null);
});

test("validateSouthlineSettings rejects malformed testimonials patches", () => {
  const base = {
    id: "t1",
    quote: "Q",
    authorName: "A",
    rating: null,
    enabled: true,
    featured: false,
    sortOrder: 0,
  };
  assert.match(validateSouthlineSettings({ testimonials: { enabled: "yes", items: [] } }), /testimonials\.enabled must be a boolean/);
  assert.match(validateSouthlineSettings({ testimonials: { items: [{ ...base, id: "" }] } }), /id must be a non-empty string/);
  assert.match(validateSouthlineSettings({ testimonials: { items: [{ ...base, quote: 5 }] } }), /quote must be a string/);
  assert.match(validateSouthlineSettings({ testimonials: { items: [{ ...base, authorName: 5 }] } }), /authorName must be a string/);
  assert.match(validateSouthlineSettings({ testimonials: { items: [{ ...base, rating: "5" }] } }), /rating must be a number or null/);
  assert.match(validateSouthlineSettings({ testimonials: { items: [{ ...base, enabled: 1 }] } }), /enabled must be a boolean/);
  assert.match(validateSouthlineSettings({ testimonials: { items: [{ ...base, featured: "no" }] } }), /featured must be a boolean/);
  assert.match(validateSouthlineSettings({ testimonials: { items: [{ ...base, sortOrder: "0" }] } }), /sortOrder must be a number/);
  assert.match(validateSouthlineSettings({ testimonials: { items: "nope" } }), /testimonials\.items must be an array/);
  assert.match(validateSouthlineSettings({ testimonials: "nope" }), /testimonials must be an object/);
});

test("the JSON store merges stored testimonial items onto the defaults on read", async () => {
  const store = await source("../lib/southline-store-json.ts");
  assert.match(store, /testimonials: \{ \.\.\.defaults\.testimonials, \.\.\.stored\.testimonials, items: stored\.testimonials\?\.items \?\? defaults\.testimonials\.items \}/);
});

test("TestimonialsSection stays hidden when disabled or empty and renders locale-aware curated items", async () => {
  const section = await source("../components/southline/TestimonialsSection.tsx");
  assert.match(section, /content\?\.enabled === false/);
  assert.match(section, /items\.length === 0/);
  assert.match(section, /visibleTestimonials/);
  assert.match(section, /item\.quoteEs \?\? item\.quote/);
  assert.match(section, /item\.authorNameEs \?\? item\.authorName/);
  assert.match(section, /rating\} \/ 5/);
  assert.match(section, /reviewCtaUrl/);
  assert.doesNotMatch(section, /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
});

test("the homepage wires the TestimonialsSection with CMS content", async () => {
  const page = await source("../app/page.tsx");
  assert.match(page, /<TestimonialsSection lang=\{lang\} content=\{settings\?\.testimonials\} \/>/);
});

test("the admin shell exposes a Testimonials tab wired to TestimonialsEditor", async () => {
  const admin = await source("../app/southline/admin/page.tsx");
  assert.match(admin, /TestimonialsEditor/);
  assert.match(admin, /\{ key: "testimonials", label: "Testimonials" \}/);
  assert.match(admin, /tab === "testimonials" && <TestimonialsEditor pin=\{pin\} \/>/);
});
