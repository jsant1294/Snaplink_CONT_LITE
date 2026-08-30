import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { getQuestionsFor } from "../lib/professional-intake/questions.ts";
import { normalizeAnswers } from "../lib/professional-intake/normalize.ts";
import { buildContractorPatch, buildAgentPatch } from "../lib/professional-intake/profile-map.ts";
import { intakeAssetCompleteness, IMAGE_QUESTION_IDS } from "../lib/professional-intake/operator.ts";

const source = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("step 14 image questions cap at one photo (profile/cover) and six gallery images", async () => {
  const qs = getQuestionsFor("contractor", "roofing");
  const images = qs.filter((q) => q.type === "image");
  assert.deepEqual(images.map((q) => q.id).sort(), ["coverPhoto", "galleryPhotos", "profilePhoto"]);
  const byId = Object.fromEntries(images.map((q) => [q.id, q]));
  assert.equal(byId.profilePhoto.maxItems, 1);
  assert.equal(byId.coverPhoto.maxItems, 1);
  assert.equal(byId.galleryPhotos.maxItems, 6);
});

test("IMAGES parallel the upload route kinds exactly (no drift between question ids and accepted kinds)", async () => {
  const route = await source("../app/api/professional-intake/upload/route.ts");
  for (const id of IMAGE_QUESTION_IDS) assert.match(route, new RegExp(`"${id}"`), `upload route must accept "${id}"`);
});

test("IntakeConsole uploads image answers directly instead of punting to the profile edit panel", async () => {
  const console = await source("../components/professional-intake/IntakeConsole.tsx");
  assert.match(console, /fetch\("\/api\/professional-intake\/upload"/);
  assert.match(console, /form\.set\("kind", question\.id\)/);
  assert.match(console, /"x-snaplink-pin": pin/);
  assert.doesNotMatch(console, /Upload images from the profile edit panel/);
  assert.doesNotMatch(console, /Sube imágenes desde el panel de edición del perfil/);
});

test("IntakeConsole enforces maxItems client-side and renders removable previews", async () => {
  const console = await source("../components/professional-intake/IntakeConsole.tsx");
  assert.match(console, /maxItems \?\? 6/);
  assert.match(console, /maxItems === 1 \? \[data\.url\] :/);
  assert.match(console, /accept="image\/\*"/);
  assert.match(console, /urls\.filter\(\(_, idx\) => idx !== i\)/);
  assert.match(console, /object-cover/);
});

test("uploaded image answers normalize to arrays and apply to the profile photo and gallery", () => {
  const { answers } = normalizeAnswers(
    "contractor",
    "roofing",
    {
      profilePhoto: ["https://cdn.example/photo.jpg"],
      galleryPhotos: ["https://cdn.example/g1.jpg", "https://cdn.example/g2.jpg", "https://cdn.example/g2.jpg"],
    }
  );
  assert.deepEqual(answers.profilePhoto, ["https://cdn.example/photo.jpg"]);
  assert.deepEqual(answers.galleryPhotos, ["https://cdn.example/g1.jpg", "https://cdn.example/g2.jpg"]);

  const contractorPatch = buildContractorPatch(answers);
  assert.equal(contractorPatch.avatarUrl, "https://cdn.example/photo.jpg");
  assert.deepEqual(contractorPatch.galleryUrls, ["https://cdn.example/g1.jpg", "https://cdn.example/g2.jpg"]);

  const agentPatch = buildAgentPatch({
    ...answers,
    coverPhoto: ["https://cdn.example/cover.jpg"],
  });
  assert.equal(agentPatch.coverPhotoUrl, "https://cdn.example/cover.jpg");
});

test("answering image questions flips the intake to needs-assets = false for the operator center", () => {
  const empty = intakeAssetCompleteness({ answers: {} });
  assert.equal(empty.needsAssets, true);
  assert.ok(empty.missingImageAnswers.includes("profilePhoto"));
  assert.ok(empty.missingImageAnswers.includes("galleryPhotos"));

  const full = intakeAssetCompleteness({
    answers: { profilePhoto: ["https://cdn.example/p.jpg"], coverPhoto: ["https://cdn.example/c.jpg"], galleryPhotos: ["https://cdn.example/g.jpg"] },
  });
  assert.equal(full.needsAssets, false);
  assert.deepEqual(full.missingImageAnswers, []);
});