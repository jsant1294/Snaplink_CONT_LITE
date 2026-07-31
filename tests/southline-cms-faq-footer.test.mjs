import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { DEFAULT_FAQ, DEFAULT_FOOTER, defaultSouthlineSettings } from "../lib/southline-types.ts";
import { visibleFaqItems } from "../lib/southline-faq.ts";
import { validateSouthlineSettings } from "../lib/southline-validation.ts";

const source = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("DEFAULT_FAQ is backward-compatible: enabled with an empty item list so the /faq page keeps showing the reviewed seed FAQ", () => {
  assert.equal(DEFAULT_FAQ.enabled, true);
  assert.deepEqual(DEFAULT_FAQ.items, []);
  assert.equal(DEFAULT_FAQ.titleEn, undefined);
  assert.equal(DEFAULT_FAQ.subtitleEs, undefined);
});

test("DEFAULT_FOOTER is backward-compatible: visible, newsletter on, and no columns so the footer falls back to its built-in columns", () => {
  assert.equal(DEFAULT_FOOTER.visible, true);
  assert.equal(DEFAULT_FOOTER.newsletterVisible, true);
  assert.deepEqual(DEFAULT_FOOTER.columns, []);
  assert.equal(DEFAULT_FOOTER.taglineEn, undefined);
});

test("defaultSouthlineSettings includes faq and footer objects that deep-equal the defaults", () => {
  const settings = defaultSouthlineSettings();
  assert.deepEqual(settings.faq, DEFAULT_FAQ);
  assert.deepEqual(settings.footer, DEFAULT_FOOTER);
});

test("visibleFaqItems returns only visible items, sorted by sortOrder, and [] for undefined content", () => {
  assert.deepEqual(visibleFaqItems(undefined), []);
  assert.deepEqual(
    visibleFaqItems({
      enabled: true,
      items: [
        { id: "b", questionEn: "B", questionEs: "B", answerEn: "B", answerEs: "B", visible: true, sortOrder: 2 },
        { id: "a", questionEn: "A", questionEs: "A", answerEn: "A", answerEs: "A", visible: true, sortOrder: 1 },
        { id: "hidden", questionEn: "H", questionEs: "H", answerEn: "H", answerEs: "H", visible: false, sortOrder: 0 },
      ],
    }).map((i) => i.id),
    ["a", "b"]
  );
  assert.deepEqual(
    visibleFaqItems({ enabled: true, items: [{ id: "x", questionEn: "", questionEs: "", answerEn: "", answerEs: "", visible: false, sortOrder: 0 }] }),
    []
  );
});

test("validateSouthlineSettings accepts a well-formed faq patch", () => {
  assert.equal(
    validateSouthlineSettings({
      faq: {
        enabled: true,
        titleEn: "FAQ",
        items: [
          { id: "q1", questionEn: "Q?", questionEs: "¿Q?", answerEn: "A", answerEs: "R", visible: true, sortOrder: 0 },
        ],
      },
    }),
    null
  );
});

test("validateSouthlineSettings rejects malformed faq items", () => {
  const base = {
    questionEn: "Q",
    questionEs: "Q",
    answerEn: "A",
    answerEs: "A",
    visible: true,
    sortOrder: 0,
  };
  assert.match(validateSouthlineSettings({ faq: { enabled: true, items: [{ ...base, id: "" }] } }), /non-empty string/);
  assert.match(validateSouthlineSettings({ faq: { enabled: "yes", items: [] } }), /boolean/);
  assert.match(validateSouthlineSettings({ faq: { enabled: true, items: [{ ...base, id: "q1", sortOrder: "0" }] } }), /sortOrder/);
  assert.match(validateSouthlineSettings({ faq: { enabled: true, items: "nope" } }), /array/);
  assert.match(validateSouthlineSettings({ faq: { enabled: true, items: [{ ...base, id: "q1", visible: 1 }] } }), /visible/);
  assert.match(validateSouthlineSettings("nope"), /object/);
});

test("validateSouthlineSettings accepts a well-formed footer patch and rejects malformed columns/links", () => {
  const valid = {
    footer: {
      visible: true,
      newsletterVisible: true,
      columns: [
        {
          id: "c1",
          titleEn: "Explore",
          titleEs: "Explorar",
          visible: true,
          sortOrder: 0,
          links: [{ id: "l1", labelEn: "Homes", labelEs: "Casas", href: "/homes", visible: true, sortOrder: 0 }],
        },
      ],
    },
  };
  assert.equal(validateSouthlineSettings(valid), null);
  assert.match(
    validateSouthlineSettings({ footer: { visible: true, newsletterVisible: true, columns: [{ id: "", titleEn: "X", titleEs: "X", visible: true, sortOrder: 0, links: [] }] } }),
    /id must be a non-empty string/
  );
  assert.match(
    validateSouthlineSettings({ footer: { visible: true, newsletterVisible: true, columns: [{ id: "c1", titleEn: "X", titleEs: "X", visible: true, sortOrder: 0, links: [{ id: "l1", labelEn: "H", labelEs: "H", href: "", visible: true, sortOrder: 0 }] }] } }),
    /href must be a non-empty string/
  );
  assert.match(validateSouthlineSettings({ footer: { visible: true, newsletterVisible: true, columns: "nope" } }), /array/);
});

test("Footer.tsx keeps its default columns (footerProfessionals / footerAgentProfiles tokens) and accepts a CMS footer prop", async () => {
  const footer = await source("../components/southline/Footer.tsx");
  assert.match(footer, /footerProfessionals/);
  assert.match(footer, /footerAgentProfiles/);
  assert.match(footer, /footer\?: SouthlineFooterContent/);
});

test("the /faq page consumes CMS FAQ settings with a seed-content fallback and no dead links or emoji", async () => {
  const page = await source("../app/faq/page.tsx");
  assert.match(page, /from "@\/lib\/faq"/);
  assert.match(page, /visibleFaqItems/);
  assert.match(page, /southlineStore/);
  assert.match(page, /faqEntriesByCategory/);
  assert.doesNotMatch(page, /href="#"/);
  assert.doesNotMatch(page, /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
});

test("the admin shell exposes FAQ and Footer tabs wired to their editors", async () => {
  const admin = await source("../app/southline/admin/page.tsx");
  assert.match(admin, /FaqEditor/);
  assert.match(admin, /FooterEditor/);
  assert.match(admin, /\{ key: "faq", label: "FAQ" \}/);
  assert.match(admin, /\{ key: "footer", label: "Footer" \}/);
});
