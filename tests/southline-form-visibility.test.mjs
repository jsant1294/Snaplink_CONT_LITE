import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("the shared .input/.label/.card/.btn-gold/.btn-outline classes live inside @layer components, so per-field Tailwind utility overrides win in the cascade", async () => {
  const css = await source("../app/globals.css");
  const layerStart = css.indexOf("@layer components");
  assert.ok(layerStart > -1, "@layer components block must exist");
  const layerBlock = css.slice(layerStart);
  for (const cls of [".btn-gold", ".btn-outline", ".card", ".input", ".label"]) {
    assert.ok(layerBlock.includes(cls), `${cls} must be defined inside @layer components`);
  }
  // and must NOT still exist as bare (unlayered) definitions before the layer block
  const beforeLayer = css.slice(0, layerStart);
  assert.doesNotMatch(beforeLayer, /^\.input\s*\{/m, ".input must not also exist unlayered");
  assert.doesNotMatch(beforeLayer, /^\.label\s*\{/m, ".label must not also exist unlayered");
});

test("Southline design tokens are defined as CSS custom properties", async () => {
  const css = await source("../app/globals.css");
  for (const token of [
    "--southline-bg",
    "--southline-surface",
    "--southline-surface-raised",
    "--southline-text",
    "--southline-text-muted",
    "--southline-border",
    "--southline-border-strong",
    "--southline-accent",
    "--southline-accent-foreground",
    "--southline-input-bg",
    "--southline-input-text",
    "--southline-input-placeholder",
    "--southline-focus-ring",
    "--southline-error",
    "--southline-success",
    "--southline-disabled-bg",
    "--southline-disabled-text",
  ]) {
    assert.match(css, new RegExp(`${token}\\s*:`), `${token} must be defined`);
  }
});

test("reusable .southline-input/.southline-label primitives exist with focus, disabled, and autofill handling", async () => {
  const css = await source("../app/globals.css");
  assert.match(css, /\.southline-input,/);
  assert.match(css, /\.southline-label\s*\{/);
  assert.match(css, /focus-visible:ring-2 focus-visible:ring-\[var\(--southline-focus-ring\)\]/);
  assert.match(css, /disabled:bg-\[var\(--southline-disabled-bg\)\]/);
  assert.match(css, /-webkit-autofill/);
});

test("color-scheme: light is scoped to pages rendering the public Southline header only, via :has()", async () => {
  const css = await source("../app/globals.css");
  assert.match(css, /body:has\(> header\[data-southline-header\]\)\s*\{\s*color-scheme:\s*light;/);
  const header = await source("../components/southline/Header.tsx");
  assert.match(header, /<header data-southline-header/);
});

test("the app-wide dark color-scheme default is untouched — contractor-admin, real-estate, and /southline/admin (none of which render the Southline header) stay dark", async () => {
  const css = await source("../app/globals.css");
  assert.match(css, /:root\s*\{\s*color-scheme:\s*dark;/);
});

test("homes search input has an explicit text color and a focus-visible ring, not just inherited color", async () => {
  const text = await source("../app/homes/page.tsx");
  assert.match(text, /text-\[#2F2923\]/);
  assert.match(text, /focus-visible:ring-2 focus-visible:ring-\[#2F2923\]/);
});

test("SearchOverlay input has a focus-visible ring replacing the removed default outline", async () => {
  const text = await source("../components/southline/SearchOverlay.tsx");
  assert.match(text, /focus-visible:ring-2 focus-visible:ring-obsidian/);
});

test("Lucio chat input and submit button: visible focus ring, disabled state while a request is in flight, no double-submit", async () => {
  const text = await source("../components/lucio/LucioWidget.tsx");
  assert.match(text, /focus-visible:ring-2 focus-visible:ring-obsidian/);
  assert.match(text, /disabled=\{status === "submitted" \|\| status === "streaming"\}/);
  assert.match(text, /disabled=\{status === "submitted" \|\| status === "streaming" \|\| !input\.trim\(\)\}/);
  assert.match(text, /disabled:opacity-50/);
});

test("Lucio guided-prompt buttons have a visible focus-visible ring", async () => {
  const text = await source("../components/lucio/GuidedPrompts.tsx");
  assert.match(text, /focus-visible:ring-2 focus-visible:ring-obsidian/);
});

test("admin AgentProfilesPanel's PIN input and two selects have explicit text color and focus styling", async () => {
  const text = await source("../components/southline/admin/AgentProfilesPanel.tsx");
  const matches = [...text.matchAll(/className="[^"]*text-bone[^"]*focus:ring-2 focus:ring-gold\/40[^"]*"/g)];
  assert.ok(matches.length >= 3, "expected the PIN input and both selects to carry explicit text color + focus ring");
});

test("admin RealEstateBlockEditor's agent checkbox is no longer a bare unstyled native checkbox", async () => {
  const text = await source("../components/southline/admin/RealEstateBlockEditor.tsx");
  assert.match(text, /type="checkbox"[\s\S]*?accent-gold/);
});

test("DiyEditor and SpotlightEditor now reuse the shared .input/.label classes instead of hand-rolled colors", async () => {
  for (const file of ["../components/southline/admin/DiyEditor.tsx", "../components/southline/admin/SpotlightEditor.tsx"]) {
    const text = await source(file);
    assert.doesNotMatch(text, /bg-charcoal border border-white\/10 rounded-lg px-3 py-2 text-sm text-bone/, `${file} should no longer hand-roll input colors`);
    assert.match(text, /className="input"/);
    assert.match(text, /className="label"/);
  }
});

test("hero CTA row wraps instead of overlapping, and all 4 buttons have solid/backdropped, non-transparent-on-photo styling", async () => {
  const text = await source("../components/southline/Hero.tsx");
  assert.match(text, /flex flex-wrap items-stretch/, "the CTA row must wrap instead of compressing/overlapping now that it holds 4 buttons");
  assert.doesNotMatch(text, /border-2 border-gold\/50 text-gold font-medium px-8 py-3\.5 rounded-xl text-center hover:bg-gold hover:text-\[#2a241e\] transition-colors"/, "the find-a-pro button must no longer be bare gold-outline-on-photo with no backdrop");
  assert.match(text, /bg-\[#3c3229\]\/60 backdrop-blur-sm border-2 border-gold\/70/, "the find-a-pro button needs a solid backdrop so it reads regardless of the photo behind it");
});

test("every hero CTA (including the Lucio button) has a visible keyboard focus ring", async () => {
  const hero = await source("../components/southline/Hero.tsx");
  const heroRingCount = [...hero.matchAll(/focus-visible:ring-2 focus-visible:ring-cream/g)].length;
  assert.ok(heroRingCount >= 4, "expected a focus-visible ring on all 4 Hero-rendered links (3 Links + the real-estate link)");
  const lucioButton = await source("../components/lucio/StartPlanningWithLucioButton.tsx");
  assert.match(lucioButton, /focus-visible:ring-2 focus-visible:ring-cream/);
});

test("decorative card/image hover transforms respect prefers-reduced-motion across public Southline components", async () => {
  for (const file of [
    "../components/southline/CommunitySpotlight.tsx",
    "../components/southline/FeaturedHomes.tsx",
    "../components/southline/DIYLearningTeaser.tsx",
    "../components/southline/TrendingSection.tsx",
    "../components/southline/CategoriesGrid.tsx",
    "../components/lucio/LucioWidget.tsx",
  ]) {
    const text = await source(file);
    assert.match(text, /motion-reduce:/, `${file} has a hover transform with no motion-reduce guard`);
  }
});

test("mobile-critical text inputs use a 16px+ font size to avoid iOS Safari auto-zoom-on-focus", async () => {
  const homes = await source("../app/homes/page.tsx");
  assert.doesNotMatch(homes, /<input name="q"[^>]*text-sm/, "the homes search input must not be sub-16px");
  const lucio = await source("../components/lucio/LucioWidget.tsx");
  const inputBlock = lucio.slice(lucio.indexOf("value={input}"), lucio.indexOf("value={input}") + 400);
  assert.doesNotMatch(inputBlock, /text-sm/, "the Lucio chat input must not be sub-16px");
});

test("Lucio Financial Copilot (tax/payment) code is untouched by this pass", async () => {
  const { execSync } = await import("node:child_process");
  const diff = execSync(
    "git diff --name-only ba05d9c -- app/api/contractor/expenses app/api/contractor/forms-1099 app/api/contractor/quarterly app/api/contractor/setasides app/api/contractor/tax-profile app/api/contractor/payees app/api/contractor/year-end-csv app/api/contractor/year-end-pdf lib/store-money-pg.ts lib/store-money-json.ts lib/payments.ts",
    { encoding: "utf8" }
  ).trim();
  assert.equal(diff, "", "LFC tax/payment routes and stores must not change for a visual QA pass");
});

test("hero CTAs share a min-width, matching border weight on the two outline buttons, and an active-press state", async () => {
  const hero = await source("../components/southline/Hero.tsx");
  const minWidthCount = [...hero.matchAll(/min-w-\[12rem\]/g)].length;
  assert.ok(minWidthCount >= 3, "expected a shared min-width on the 3 Hero-rendered CTA links");
  assert.doesNotMatch(hero, /className="w-full sm:w-auto min-w-\[12rem\] bg-\[#3c3229\]\/60 backdrop-blur-sm border border-cream/, "the two outline buttons must use the same border weight, not one 1px and one 2px");
  assert.match(hero, /active:scale-\[0\.98\] motion-reduce:active:scale-100/);
  const lucioButton = await source("../components/lucio/StartPlanningWithLucioButton.tsx");
  assert.match(lucioButton, /min-w-\[12rem\]/);
  assert.match(lucioButton, /active:scale-\[0\.98\] motion-reduce:active:scale-100/);
});

test("the shared .btn-gold/.btn-outline classes (used app-wide, including dark contractor-admin) now carry a focus-visible ring", async () => {
  const css = await source("../app/globals.css");
  const btnGold = css.slice(css.indexOf(".btn-gold {"), css.indexOf(".btn-outline {"));
  const btnOutline = css.slice(css.indexOf(".btn-outline {"), css.indexOf(".card {"));
  for (const block of [btnGold, btnOutline]) {
    assert.match(block, /focus-visible:ring-2 focus-visible:ring-gold/);
    assert.match(block, /motion-reduce:active:scale-100/);
  }
});

test("BookingFlow and ProjectPlanner back/selection buttons have focus-visible states — none had any before this pass", async () => {
  for (const file of ["../components/southline/BookingFlow.tsx", "../components/southline/ProjectPlanner.tsx"]) {
    const text = await source(file);
    const ringCount = [...text.matchAll(/focus-visible:ring-2 focus-visible:ring-obsidian/g)].length;
    assert.ok(ringCount >= 3, `${file} should have several newly-focus-ringed buttons`);
  }
});

test("contractor profile page never renders a dead '#' link for gallery/reviews — only shown when a real URL exists", async () => {
  const text = await source("../components/intake/ContractorPublicPage.tsx");
  assert.doesNotMatch(text, /href=\{contractor\.galleryUrl \?\? "#"\}/);
  assert.doesNotMatch(text, /href=\{contractor\.reviewsUrl \?\? "#"\}/);
  assert.match(text, /\{contractor\.galleryUrl && \(/);
  assert.match(text, /\{contractor\.reviewsUrl && \(/);
  assert.doesNotMatch(text, /href="#"/);
});

test("decorative emoji icons on the contractor profile page are hidden from assistive technology", async () => {
  const text = await source("../components/intake/ContractorPublicPage.tsx");
  const allEmojiSpans = [...text.matchAll(/<span[^>]*>(?:📞|💬|🟢)<\/span>/g)];
  const hiddenEmojiSpans = allEmojiSpans.filter((m) => m[0].includes('aria-hidden="true"'));
  assert.equal(allEmojiSpans.length, 3, "expected exactly the 3 known decorative emoji icons");
  assert.equal(hiddenEmojiSpans.length, 3, "every emoji span must carry aria-hidden=\"true\"");
});

test("admin destructive (delete/remove) and reorder buttons across every editor now carry a focus-visible ring — a systemic gap fixed once via the shared pattern", async () => {
  const files = await import("node:fs/promises").then((fs) => fs.readdir(new URL("../components/southline/admin", import.meta.url)));
  let destructiveWithRing = 0;
  let reorderWithRing = 0;
  for (const file of files) {
    if (!file.endsWith(".tsx")) continue;
    const text = await source(`../components/southline/admin/${file}`);
    destructiveWithRing += [...text.matchAll(/text-danger[^"]*focus-visible:ring-danger/g)].length;
    reorderWithRing += [...text.matchAll(/disabled:opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/g)].length;
  }
  assert.ok(destructiveWithRing >= 8, `expected at least 8 destructive buttons with a focus ring, found ${destructiveWithRing}`);
  assert.ok(reorderWithRing >= 10, `expected at least 10 reorder buttons with a focus ring, found ${reorderWithRing}`);
});
