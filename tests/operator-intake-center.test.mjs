import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  intakeAssetCompleteness,
  intakeSessionFilter,
  IMAGE_QUESTION_IDS,
} from "../lib/professional-intake/operator.ts";

const source = (path) => readFile(new URL(path, import.meta.url), "utf8");

const session = (overrides = {}) => ({
  id: "intk_1",
  ownerType: "contractor",
  ownerId: "ctr_1",
  status: "in_progress",
  locale: "en",
  currentStep: 2,
  answers: {},
  flaggedQuestionIds: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
  ...overrides,
});

test("C D: status/step classification buckets are truthful and filter-safe", () => {
  assert.equal(intakeSessionFilter(session({ status: "not_started" })), "New");
  assert.equal(intakeSessionFilter(session({ status: "in_progress", answers: { profilePhoto: "u", coverImage: "u", galleryPhotos: ["a"] } })), "In Progress");
  assert.equal(intakeSessionFilter(session({ status: "in_progress", answers: {} })), "Needs Assets");
  assert.equal(intakeSessionFilter(session({ status: "completed", answers: { profilePhoto: "u", coverImage: "u", galleryPhotos: ["a"] } })), "Ready");
  assert.equal(intakeSessionFilter(session({ status: "completed", answers: {} })), "Needs Assets");
  assert.equal(intakeSessionFilter(session({ status: "applied", answers: {} })), "Completed");
});

test("C: assets completeness derives from step-14 image answers only (never over-claims)", () => {
  assert.deepEqual(intakeAssetCompleteness(session({ answers: {} })), { needsAssets: true, completedImageAnswers: [], missingImageAnswers: [...IMAGE_QUESTION_IDS] });
  const partial = intakeAssetCompleteness(session({ answers: { profilePhoto: "u" } }));
  assert.equal(partial.needsAssets, true);
  assert.equal(partial.completedImageAnswers.length, 1);
  const full = intakeAssetCompleteness(session({ answers: { profilePhoto: "u", coverImage: "u", galleryPhotos: ["a", "b"] } }));
  assert.equal(full.needsAssets, false);
});

test("G: operator-only — route guards with isOperatorRequest and returns 401", async () => {
  const route = await source("../app/api/professional-intake/admin/sessions/route.ts");
  assert.match(route, /isOperatorRequest\(req\)/, "route guards with isOperatorRequest");
  assert.match(route, /status: 401/, "route returns 401 when not authorized");
});

test("B: operator store lists every session newest-updated first (command center feed)", async () => {
  const storePg = await source("../lib/professional-intake/store-pg.ts");
  assert.match(storePg, /async listAll\(\)/, "PG intake store must expose listAll");
  assert.match(storePg, /orderBy\(desc\(professionalIntakeSessions\.updatedAt\)\)/, "listAll newest-updated first");
  const storeJson = await source("../lib/professional-intake/store-json.ts");
  assert.match(storeJson, /async listAll\(\)/, "JSON intake store must expose listAll");
});

test("A E: admin wires the Intake Center tab and Open Intake routes into the existing console", async () => {
  const admin = await source("../app/southline/admin/page.tsx");
  assert.match(admin, /IntakeCenterPanel/, "admin imports the intake command center panel");
  assert.match(admin, /key: "intake"/, "admin exposes an Intake Center tab");
  const panel = await source("../components/southline/admin/IntakeCenterPanel.tsx");
  assert.match(panel, /\/api\/professional-intake\/admin\/sessions/, "panel reads the operator feed endpoint");
  assert.match(panel, /\/southline\/admin\/intake\/\$\{r\.ownerType\}\/\$\{r\.ownerId\}/, "Open Intake routes to the correct existing session console");
});

test("F: resume preserves the existing active session (single-active-session contract intact)", async () => {
  const sessionsPost = await source("../app/api/professional-intake/sessions/route.ts");
  assert.match(sessionsPost, /getActive\(ownerType, ownerId\)/, "POST /sessions resumes via getActive");
  assert.match(sessionsPost, /resumed:/, "getActive path returns resumed:true, preserving answers/currentStep");
});
