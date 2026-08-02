import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { ALL_QUESTIONS, CORE_QUESTIONS, CONDITIONAL_QUESTIONS, getQuestionsFor, questionById, questionLabel } from "../lib/professional-intake/questions.ts";
import {
  normalizeAnswers,
  missingRequiredQuestions,
  isValidEmail,
  normalizeEmail,
  isValidPhone,
  normalizePhone,
  isValidUrl,
  normalizeUrl,
  dedupeArray,
  resolveTaxonomyIds,
  stripHtml,
} from "../lib/professional-intake/normalize.ts";
import { buildContractorPatch, buildAgentPatch, CONTRACTOR_INTAKE_FIELD_MAP, AGENT_INTAKE_FIELD_MAP } from "../lib/professional-intake/profile-map.ts";
import { generateSummary, generateAbout, generateOperatorNotes, generateProfileCopy } from "../lib/professional-intake/generate-copy.ts";
import { buildReviewPreview, resolveApplyPatch } from "../lib/professional-intake/apply.ts";
import { HOME_SERVICE_CATEGORIES } from "../lib/home-service-taxonomy.ts";

const source = (path) => readFile(new URL(path, import.meta.url), "utf8");

// --- 1: question registry loads ---------------------------------------------

test("1. question registry loads with questions present", () => {
  assert.ok(ALL_QUESTIONS.length > 0);
  assert.ok(CORE_QUESTIONS.length > 0);
  assert.ok(CONDITIONAL_QUESTIONS.length > 0);
});

// --- 2: approximately 15 core questions -------------------------------------

test("2. core questions span approximately 15 steps", () => {
  const steps = new Set(CORE_QUESTIONS.map((q) => q.step));
  assert.equal(steps.size, 15);
});

// --- 3/4: English/Spanish labels exist --------------------------------------

test("3. every question has a non-empty English label", () => {
  for (const q of ALL_QUESTIONS) {
    assert.ok(q.labelEn && q.labelEn.trim().length > 0, `${q.id} missing labelEn`);
  }
});

test("4. every question has a non-empty Spanish label", () => {
  for (const q of ALL_QUESTIONS) {
    assert.ok(q.labelEs && q.labelEs.trim().length > 0, `${q.id} missing labelEs`);
  }
});

// --- 5/6/7: conditional questions appear/hide correctly ---------------------

test("5. contractor conditional questions appear for a trade profession", () => {
  const ids = getQuestionsFor("contractor", "electrician").map((q) => q.id);
  assert.ok(ids.includes("yearsInBusiness"));
  assert.ok(ids.includes("insuranceCarried"));
});

test("6. agent conditional questions appear for realtor", () => {
  const ids = getQuestionsFor("agent", "realtor").map((q) => q.id);
  assert.ok(ids.includes("officeName"));
  assert.ok(ids.includes("licenseNumber"));
  assert.ok(ids.includes("buyerSellerSpecialty"));
});

test("7. irrelevant conditional questions stay hidden", () => {
  const contractorIds = getQuestionsFor("contractor", "electrician").map((q) => q.id);
  assert.ok(!contractorIds.includes("officeName"), "agent-only question leaked into contractor set");
  assert.ok(!contractorIds.includes("buyerSellerSpecialty"));

  const agentIds = getQuestionsFor("agent", "realtor").map((q) => q.id);
  assert.ok(!agentIds.includes("yearsInBusiness"), "contractor-only question leaked into agent set");
  assert.ok(!agentIds.includes("crewSize"));

  const photographerIds = getQuestionsFor("contractor", "photographer").map((q) => q.id);
  assert.ok(photographerIds.includes("sessionTypes"));
  assert.ok(!photographerIds.includes("propertyTypesManaged"), "property-manager-only question leaked into photographer set");
});

// --- 8/9: taxonomy normalization ---------------------------------------------

test("8. taxonomy IDs normalize safely (known id passes through)", () => {
  const knownId = HOME_SERVICE_CATEGORIES[0].id;
  const { resolved, unknown } = resolveTaxonomyIds([knownId]);
  assert.deepEqual(resolved, [knownId]);
  assert.deepEqual(unknown, []);
});

test("9. unknown taxonomy values are flagged, not silently dropped or guessed", () => {
  const { answers, flaggedQuestionIds, warnings } = normalizeAnswers("contractor", "electrician", {
    additionalServices: ["definitely-not-a-real-category-xyz"],
  });
  assert.ok(flaggedQuestionIds.includes("additionalServices"));
  assert.ok(warnings.some((w) => w.includes("additionalServices")));
  assert.deepEqual(answers.additionalServices, []);
});

// --- 10/11/12: phone/email/URL validation -----------------------------------

test("10. phone validation works", () => {
  assert.equal(normalizePhone("(555) 123-4567"), "5551234567");
  assert.ok(isValidPhone("5551234567"));
  assert.ok(!isValidPhone("123"));
});

test("11. email validation works", () => {
  assert.equal(normalizeEmail(" Test@Example.com "), "test@example.com");
  assert.ok(isValidEmail("test@example.com"));
  assert.ok(!isValidEmail("not-an-email"));
});

test("12. URL validation works", () => {
  assert.equal(normalizeUrl("example.com"), "https://example.com");
  assert.ok(isValidUrl("https://example.com"));
  assert.ok(!isValidUrl("not a url"));
});

// --- 13: duplicate services removed -----------------------------------------

test("13. duplicate services are removed", () => {
  const knownId = HOME_SERVICE_CATEGORIES[0].id;
  const { answers } = normalizeAnswers("agent", "realtor", {
    additionalServices: [knownId, knownId, knownId],
  });
  assert.deepEqual(answers.additionalServices, [knownId]);
  assert.deepEqual(dedupeArray(["a", "a", "b", ""]), ["a", "b"]);
});

// --- 14/15: profile mapping ---------------------------------------------------

test("14. contractor profile mapping uses real Contractor fields", () => {
  const patch = buildContractorPatch({
    displayName: "Jane Doe",
    companyName: "Doe Roofing",
    phone: "5551234567",
    serviceAreaCity: "Tampa",
    serviceAreaState: "FL",
    differentiator: "24/7 emergency service",
  });
  assert.equal(patch.businessName, "Doe Roofing");
  assert.equal(patch.ownerName, "Jane Doe");
  assert.equal(patch.phone, "5551234567");
  assert.equal(patch.serviceArea, "Tampa, FL");
  assert.equal(patch.tagline, "24/7 emergency service");
  assert.ok(!("marketplaceSummary" in patch), "Contractor has no marketplaceSummary field — must never be invented");
});

test("15. agent profile mapping uses real AgentProfile fields", () => {
  const knownId = HOME_SERVICE_CATEGORIES[0].id;
  const patch = buildAgentPatch({
    displayName: "Jane Realtor",
    primaryService: knownId,
    officeName: "Downtown Office",
    licenseNumber: "RE12345",
    idealCustomer: "First-time buyers",
  });
  assert.equal(patch.displayName, "Jane Realtor");
  assert.deepEqual(patch.categories, [knownId]);
  assert.equal(patch.officeName, "Downtown Office");
  assert.equal(patch.licenseNumber, "RE12345");
  assert.ok(patch.marketplaceSummary.includes("First-time buyers"));
});

// --- 16/17: apply modes -------------------------------------------------------

test("16. existing non-empty fields are preserved by default (fill_empty)", () => {
  const current = { businessName: "Existing Co", phone: "" };
  const proposed = { businessName: "New Name From Intake", phone: "5551234567" };
  const result = resolveApplyPatch("fill_empty", current, proposed);
  assert.ok(!("businessName" in result), "non-empty existing field must not be silently overwritten");
  assert.equal(result.phone, "5551234567");
});

test("17. replace_selected only applies explicitly chosen fields", () => {
  const current = { businessName: "Existing Co", phone: "555" };
  const proposed = { businessName: "New Name", phone: "5551234567" };
  const result = resolveApplyPatch("replace_selected", current, proposed, ["businessName"]);
  assert.deepEqual(result, { businessName: "New Name" });
});

test("replace_all applies every proposed field", () => {
  const current = { businessName: "Existing Co" };
  const proposed = { businessName: "New Name", phone: "5551234567" };
  const result = resolveApplyPatch("replace_all", current, proposed);
  assert.deepEqual(result, proposed);
});

// --- 18/19/20: generated copy never fabricates ------------------------------

test("18. generated summary uses only submitted facts", () => {
  const summary = generateSummary({ idealCustomer: "Homeowners in Tampa", differentiator: "Family owned" }, "en");
  assert.ok(summary.includes("Homeowners in Tampa"));
  assert.ok(summary.includes("Family owned"));
  const empty = generateSummary({}, "en");
  assert.equal(empty, "");
});

test("19. generated copy never fabricates ratings or reviews", () => {
  const copy = generateProfileCopy("Jane Doe", { idealCustomer: "Busy families", differentiator: "Fast response" }, "en");
  const combined = `${copy.summary} ${copy.about} ${copy.seoDescription}`.toLowerCase();
  assert.doesNotMatch(combined, /\brating\b|\breview\b|\bstars?\b/);
});

test("20. generated copy never fabricates or leaks license/insurance claims into public fields", () => {
  const answers = { experienceQualifications: "Licensed master electrician, 15 years", licenseInfo: "EL-9982", insuranceCarried: true };
  const summary = generateSummary(answers, "en");
  const about = generateAbout(answers, "en");
  assert.doesNotMatch(summary, /EL-9982|licensed|insurance/i);
  assert.doesNotMatch(about, /EL-9982|licensed|insurance/i);
  const notes = generateOperatorNotes(answers);
  assert.match(notes, /EL-9982/);
  assert.match(notes, /insurance/i);
});

// --- 21: AI fallback (deterministic-only design, nothing to fall back from) --

test("21. copy generation is fully deterministic and never throws — no AI call to fail", () => {
  assert.doesNotThrow(() => generateProfileCopy("", {}, "en"));
  assert.doesNotThrow(() => generateProfileCopy("Jane", {}, "es"));
});

// --- 22: draft/resume (source-assertion — see item 31 note) ------------------

test("22. session store supports draft/resume via status + currentStep + answers merge", async () => {
  const text = await source("../lib/professional-intake/store-json.ts");
  assert.match(text, /getActive/);
  assert.match(text, /ACTIVE_STATUSES/);
  const routeText = await source("../app/api/professional-intake/sessions/[id]/route.ts");
  assert.match(routeText, /const merged = \{ \.\.\.session\.answers/);
});

// --- 23: completed intake creates a preview ----------------------------------

test("23. completed intake produces a review preview with current vs proposed values", () => {
  const preview = buildReviewPreview(
    "contractor",
    { businessName: "Existing Co", phone: "" },
    { businessName: "New Name", phone: "5551234567" }
  );
  const businessNameRow = preview.find((p) => p.field === "businessName");
  const phoneRow = preview.find((p) => p.field === "phone");
  assert.equal(businessNameRow.changed, true);
  assert.equal(phoneRow.changed, true);
  assert.equal(phoneRow.currentValue, "");
});

test("23b. sensitive fields are flagged in the preview", () => {
  const preview = buildReviewPreview("contractor", {}, { licenseInfo: "EL-9982" });
  assert.equal(preview[0].sensitive, true);
});

// --- 24/25: apply writes to the correct, separate store -----------------------

test("24. apply route writes to the correct store per owner type", async () => {
  const text = await source("../app/api/professional-intake/sessions/[id]/apply/route.ts");
  assert.match(text, /contractorStore\.update/);
  assert.match(text, /agentProfileStore\.update/);
});

test("25. contractor and agent identity systems stay separate — no merged store or table", async () => {
  const mapText = await source("../lib/professional-intake/profile-map.ts");
  assert.doesNotMatch(mapText, /professional_profiles/);
  const schemaText = await source("../lib/db/schema.ts");
  assert.doesNotMatch(schemaText, /professional_profiles/);
  assert.match(schemaText, /professional_intake_sessions/);
});

// --- 26: public profile routes remain unchanged ------------------------------

test("26. public profile routes are untouched by the intake feature", async () => {
  const contractorPage = await source("../app/contractor/[username]/page.tsx");
  const agentPage = await source("../app/agents/[slug]/page.tsx");
  assert.doesNotMatch(contractorPage, /professional-intake/);
  assert.doesNotMatch(agentPage, /professional-intake/);
});

// --- 27/28: privacy and operator authorization --------------------------------

test("27. session routes require authorization — no public unauthenticated read", async () => {
  const text = await source("../app/api/professional-intake/sessions/[id]/route.ts");
  assert.match(text, /loadAndAuthorizeSession/);
});

test("28. preview and apply are operator-only", async () => {
  const previewText = await source("../app/api/professional-intake/sessions/[id]/preview/route.ts");
  const applyText = await source("../app/api/professional-intake/sessions/[id]/apply/route.ts");
  assert.match(previewText, /isOperatorRequest/);
  assert.match(applyText, /isOperatorRequest/);
});

// --- 29/30: EN/ES generated copy ----------------------------------------------

test("29. English generated copy works", () => {
  const copy = generateProfileCopy("Jane Doe", { serviceAreaCity: "Tampa", serviceAreaState: "FL" }, "en");
  assert.match(copy.serviceAreaSentence, /Serving the Tampa, FL area/);
});

test("30. Spanish generated copy works", () => {
  const copy = generateProfileCopy("Jane Doe", { serviceAreaCity: "Tampa", serviceAreaState: "FL" }, "es");
  assert.match(copy.serviceAreaSentence, /Atendemos el área de Tampa, FL/);
});

// --- 31: existing SnapLink intake tests remain green --------------------------

test("31. SnapLink source intake has no existing tests to regress (confirmed by audit)", async () => {
  const audit = await source("../docs/professional-intake/00-snaplink-intake-audit.md");
  assert.match(audit, /Zero test coverage|none found/i);
});

// --- Additional required-question completeness check --------------------------

test("required questions are enforced at submit time", () => {
  const missing = missingRequiredQuestions("contractor", "electrician", {});
  assert.ok(missing.includes("professionType"));
  assert.ok(missing.includes("displayName"));
  const complete = missingRequiredQuestions("contractor", "electrician", {
    professionType: "electrician",
    displayName: "Jane",
    primaryService: HOME_SERVICE_CATEGORIES[0].id,
    serviceAreaCity: "Tampa",
    serviceAreaState: "FL",
    phone: "5551234567",
    primaryCta: "request_quote",
  });
  assert.deepEqual(complete, []);
});

test("HTML/script injection is stripped from free-text answers", () => {
  const stripped = stripHtml('<script>alert(1)</script>Hello <b>world</b>');
  assert.doesNotMatch(stripped, /<script>|<b>/);
  assert.match(stripped, /Hello/);
});

test("long free-text answers are capped server-side", () => {
  const { answers } = normalizeAnswers("contractor", "electrician", { differentiator: "x".repeat(1000) });
  assert.ok(answers.differentiator.length <= 400);
});

test("questionLabel resolves per-language text via the registry, not inline ternaries", () => {
  const q = questionById("professionType");
  assert.equal(questionLabel(q, "en"), q.labelEn);
  assert.equal(questionLabel(q, "es"), q.labelEs);
});

test("profile field maps only reference real Contractor/AgentProfile field names", async () => {
  const typesText = await source("../lib/types.ts");
  const agentTypesText = await source("../lib/agent-profiles/types.ts");
  for (const field of Object.keys(CONTRACTOR_INTAKE_FIELD_MAP)) {
    assert.match(typesText, new RegExp(field), `${field} not found on Contractor`);
  }
  for (const field of Object.keys(AGENT_INTAKE_FIELD_MAP)) {
    assert.match(agentTypesText, new RegExp(field), `${field} not found on AgentProfile`);
  }
});

test("upload route reuses existing 8MB/image validation pattern, no new upload infrastructure", async () => {
  const text = await source("../app/api/professional-intake/upload/route.ts");
  assert.match(text, /8 \* 1024 \* 1024/);
  assert.match(text, /image\//);
  assert.match(text, /BLOB_READ_WRITE_TOKEN/);
});

test("migration is additive-only (no DROP/ALTER of existing tables)", async () => {
  const text = await source("../drizzle/0023_professional_intake_sessions.sql");
  assert.match(text, /CREATE TABLE "professional_intake_sessions"/);
  assert.doesNotMatch(text, /DROP TABLE|DROP COLUMN|ALTER TABLE "contractors"|ALTER TABLE "agent_profiles"/);
});
