# SnapLink Intake Audit

Source repo: `/Volumes/DevDrive/ACTIVE_PROJECTS/snaplink-lite 3`
Confirmed complete per `SNAPLINK_PRODUCT_INVENTORY.md:64-76`: "15-step bilingual client intake wizard with autosave, file uploads, AI bio generation (template), email notification."

**Framing correction**: this is not a profession-conditional questionnaire. It is a **fixed, generic 15-step client-onboarding form** — the same 15 questions for every client, run by the SnapLink *operator* on behalf of a new client, that pre-populates a draft profile. There is no profession-conditional branching anywhere in it (the only conditional UI is an "online only" toggle hiding 3 location fields, and a "which platforms" sub-picker under one multiselect option).

## Capability matrix

| Capability | Existing File | Reusable | Needs Adaptation | Notes |
|---|---|---:|---:|---|
| Question definitions | `src/components/IntakeWizard.tsx:327-690` (`switch` per step) | No | Yes | Hardcoded in component, not a data registry — must be rebuilt as a real `IntakeQuestion[]` array for Southline |
| Answer shape type | `src/components/IntakeWizard.tsx:15-41` (`WizardAnswers`) | Partial | Yes | Useful as a reference shape; Southline needs a generic `Record<string, unknown>` bag since fields differ contractor vs. agent |
| Option catalogs | `src/lib/intake-catalog.ts` | No | N/A | SnapLink-product-specific (products, digital services, socials) — nothing here applies to home-service professionals |
| Session/draft tracking | `intake_sessions` table, `src/db/schema.ts:582-597` | Pattern only | Yes | Status lifecycle (`pending→in_progress→submitted`) and token+expiry pattern is worth reusing conceptually; schema itself is SnapLink-specific |
| Answer storage | `intake_answers` table, `src/db/schema.ts:599-647` | No | Yes | Flat column-per-question table with JSON-stringified array columns — Southline uses one `jsonb answers` column instead, matching this repo's `lucio_events.metadata` convention |
| Profile auto-fill mapping | inline in `src/app/api/intake/submit/route.ts:113-138` | No | Yes | Only 6 of ~20 answers ever get copied to the profile (`displayName`, `bioEn/Es`, `phone`, `email`, `avatarUrl`, `theme`); no reusable mapping function exists to port — the *pattern* (explicit inline mapping, `isPublished` always forced false) is the reusable part |
| AI/rules bio generation | `src/components/IntakeWizard.tsx:271-278` (`generateBio()`) | Yes (pattern) | No | Purely client-side deterministic string template — no LLM call anywhere. Directly reusable *approach*: Southline's copy generator is the same kind of template, just richer |
| Draft/resume | token + `currentStep`, `src/app/intake/[token]/page.tsx` | Pattern only | Yes | Resume-by-token is SnapLink's public-client model; Southline's intake is operator/professional-run behind PIN auth instead of a mailed token link, so resume is by session id, not token |
| Operator review before publish | `IntakeAdmin.tsx` + `togglePublishProfileAction`, `src/lib/intake-actions.ts:111-123` | Yes (pattern) | Yes | The "auto-fill drafts, never auto-publish, explicit operator Publish action" pattern is exactly what Southline's Objective describes — directly adopted |
| API routes | `/api/intake/{autosave,submit,upload}` | Pattern only | Yes | Public, token-gated, unauthenticated by design (client fills the form). Southline's routes are PIN-gated instead since there's no public client-facing intake link in this product |
| Bilingual support | `COPY` dict, `src/components/IntakeWizard.tsx:55-172` | Pattern only | Yes | Inline `{en:{...}, es:{...}}` dictionary keyed by string — same shape Southline's `IntakeQuestion.labelEn/labelEs` uses |
| Tests | none found | No | N/A | Zero test coverage for the entire intake system in the source repo — nothing to port |
| Validation/normalization | `safeStr()`/`safeInt()` only, both routes | No | Yes | Trim-only, **no server-side length caps, no HTML stripping, no phone/URL normalization** — a real gap in the source, explicitly closed in Southline's version (see `02-question-registry.md` / normalization layer) |
| File uploads | `/api/intake/upload/route.ts`, Vercel Blob | Pattern only | Yes | MIME-only validation (client `Content-Type`, spoofable) — weaker than this repo's own `lib/upload-validation.ts` magic-byte sniffing used elsewhere. Southline reuses the existing `southline`/`contractor` upload routes' 8MB + `image/*` check, consistent with the rest of this codebase |
| Rate limiting | none wired to intake routes | No | N/A | `src/lib/rate-limit.ts` exists in the source repo but is never imported by any `/api/intake/*` route |

## Answers to the audit questions

1. **Where are the current ~15 questions defined?** `src/components/IntakeWizard.tsx:327-690`, hardcoded in a `switch(step)` render function — not a data file.
2. **Hardcoded or registry-driven?** Hardcoded. No `IntakeQuestion[]`-style registry exists in the source repo.
3. **How are answers stored?** One `intake_answers` Postgres row per session, upserted on every autosave; array-typed fields are JSON-stringified text columns, not real Postgres arrays.
4. **How are answers mapped into profile fields?** An inline `if` block in the submit route (`src/app/api/intake/submit/route.ts:113-138`) — partial, only 6 fields, no reusable function.
5. **AI or rules?** Rules only. The "AI bio" is a synchronous client-side string template with no network call and therefore no failure mode to design around.
6. **Can it resume?** Yes — by session token + a stored `currentStep`, autosaved every 2s, blocked once `submitted` or past a 30-day `expiresAt`.
7. **Completion state?** Yes — `intake_sessions.status`: `pending → in_progress → submitted`.
8. **How does operator review work?** A dedicated admin page shows a profile-readiness score and a manual Publish/Unpublish toggle, plus a 13-item build checklist the operator ticks off before publishing. Submission never sets `isPublished: true` itself.
9. **Bilingual?** Yes, a `COPY = {en:{...}, es:{...}}` dictionary.
10. **What can be reused directly?** No code. Four *patterns* transfer directly: (a) draft/session status lifecycle, (b) "auto-fill drafts, operator publishes explicitly" workflow, (c) deterministic (non-AI) copy generation, (d) bilingual inline-dictionary question labels. Everything else — question set, schema, mapping, auth model — is rebuilt for Southline's different product shape (dual contractor/agent identity, PIN auth, no public client-facing link).

## What Southline's version does differently (and why)

- **Profession-conditional questions**: the source has none; Southline adds them (Phase 4) because Southline serves 15+ distinct profession types across two separate identity systems, where the source only ever onboards one kind of SnapLink client.
- **Auth model**: source routes are public + token-gated (mailed link, no login). Southline reuses this repo's existing PIN model (`lib/auth.ts` / `lib/agent-profiles/auth.ts`) since every actor here (operator, contractor, agent) already authenticates that way — a new public-token model would be a second, redundant auth system.
- **Apply is operator-only**: the source lets the *client* complete the wizard and still requires a separate manual operator Publish action. Southline mirrors this but goes one step further per its own Objective ("operator reviews → profile is published"): applying intake answers onto the real `contractors`/`agent_profiles` row is always an operator action, even when a professional filled out the intake themselves — filling out ≠ writing to the live profile.
- **Storage**: one `answers jsonb` column on a single session table (matching this repo's `lucio_events.metadata` precedent) instead of a flat column-per-question table — avoids a schema migration every time a question is added or removed.
- **Server-side validation**: Southline adds real length caps, HTML/script stripping, phone/URL normalization, and taxonomy-id resolution — all gaps confirmed absent in the source.
