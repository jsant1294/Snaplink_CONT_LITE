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

test("Lucio Financial Copilot (tax/payment) code is untouched by this pass", async () => {
  const { execSync } = await import("node:child_process");
  const diff = execSync(
    "git diff --name-only ba05d9c -- app/api/contractor/expenses app/api/contractor/forms-1099 app/api/contractor/quarterly app/api/contractor/setasides app/api/contractor/tax-profile app/api/contractor/payees app/api/contractor/year-end-csv app/api/contractor/year-end-pdf lib/store-money-pg.ts lib/store-money-json.ts lib/payments.ts",
    { encoding: "utf8" }
  ).trim();
  assert.equal(diff, "", "LFC tax/payment routes and stores must not change for a visual QA pass");
});
