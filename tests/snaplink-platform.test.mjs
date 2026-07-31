import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { execSync } from "node:child_process";
import { FAQ_CATEGORIES, FAQ_ENTRIES, faqEntriesByCategory, searchFaq } from "../lib/faq.ts";

const source = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("Powered by SnapLink sits after Featured Professionals and before DIY Learning on the homepage", async () => {
  const page = await source("../app/page.tsx");
  const proIdx = page.indexOf("<FeaturedProfessionals");
  const snaplinkIdx = page.indexOf("<PoweredBySnapLink");
  const diyIdx = page.indexOf("<DIYLearningTeaser");
  assert.ok(proIdx > -1 && snaplinkIdx > -1 && diyIdx > -1, "all three sections must render");
  assert.ok(proIdx < snaplinkIdx, "Powered by SnapLink must come after Featured Professionals");
  assert.ok(snaplinkIdx < diyIdx, "Powered by SnapLink must come before DIY Learning");
});

test("every FAQ category has at least one published, bilingual entry", () => {
  for (const category of FAQ_CATEGORIES) {
    const entries = faqEntriesByCategory(category.id);
    assert.ok(entries.length > 0, `category ${category.id} has no published FAQ entries`);
    for (const entry of entries) {
      assert.ok(entry.questionEn && entry.questionEs, `${entry.id} missing a bilingual question`);
      assert.ok(entry.answerEn && entry.answerEs, `${entry.id} missing a bilingual answer`);
      assert.ok(entry.lastReviewed, `${entry.id} missing lastReviewed`);
    }
  }
});

test("searchFaq is keyword scoring over the FAQ entries, not a vector/embedding retrieval system", () => {
  const hits = searchFaq("NFC card", "en");
  assert.ok(hits.length > 0);
  assert.ok(hits.some((h) => h.id === "faq-what-are-nfc-cards"));
  const empty = searchFaq("completely unrelated gibberish query xyz", "en");
  assert.equal(empty.length, 0);
});

test("the privacy and verification FAQ answers are honest about current limitations, not overclaiming", () => {
  const privacy = FAQ_ENTRIES.find((e) => e.id === "faq-privacy-policy");
  const verification = FAQ_ENTRIES.find((e) => e.id === "faq-how-verified");
  assert.match(privacy.answerEn, /does not have a separate published privacy policy/i);
  assert.match(verification.answerEn, /does not independently verify licenses/i);
});

test("/faq and /snaplink pages exist and source the same FAQ data (never disagree)", async () => {
  const faqPage = await source("../app/faq/page.tsx");
  const snaplinkPage = await source("../app/snaplink/page.tsx");
  assert.match(faqPage, /from "@\/lib\/faq"/);
  assert.match(snaplinkPage, /from "@\/lib\/faq"/);
});

test("no fabricated testimonials on /snaplink: Professional Success Stories names no specific customer or quotes a fabricated review", async () => {
  const text = await source("../app/snaplink/page.tsx");
  const section = text.slice(text.indexOf("Professional Success Stories"));
  assert.doesNotMatch(section.slice(0, section.indexOf("</section>")), /"[A-Z][a-z]+ [A-Z]\./, "must not contain a quoted, attributed testimonial");
});

test("no fabricated pricing figures on /snaplink: the Pricing section names no specific dollar amount", async () => {
  const text = await source("../app/snaplink/page.tsx");
  const section = text.slice(text.indexOf('id="pricing"') > -1 ? text.indexOf('id="pricing"') : text.indexOf(">Pricing<") - 400, text.indexOf("FAQ ("));
  assert.doesNotMatch(section, /\$\d/, "must not state a specific dollar figure");
});

test("no dead '#' links or emoji on the new snaplink/faq pages and components", async () => {
  for (const file of [
    "../app/faq/page.tsx",
    "../app/snaplink/page.tsx",
    "../components/southline/PoweredBySnapLink.tsx",
  ]) {
    const text = await source(file);
    assert.doesNotMatch(text, /href="#"/, `${file} has a dead link`);
    assert.doesNotMatch(text, /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u, `${file} contains an emoji`);
  }
});

test("Lucio Financial Copilot (tax/payment) code is untouched by this pass", () => {
  const diff = execSync(
    "git diff --name-only 3552ded -- app/api/contractor/expenses app/api/contractor/forms-1099 app/api/contractor/quarterly app/api/contractor/setasides app/api/contractor/tax-profile app/api/contractor/payees app/api/contractor/year-end-csv app/api/contractor/year-end-pdf lib/store-money-pg.ts lib/store-money-json.ts lib/payments.ts",
    { encoding: "utf8" }
  ).trim();
  assert.equal(diff, "", "LFC tax/payment routes and stores must not change for a brand/platform-story pass");
});
