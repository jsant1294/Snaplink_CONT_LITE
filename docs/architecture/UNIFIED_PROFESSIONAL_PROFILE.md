# Unified Professional Profile — Architecture

> **Slice:** Big Pickle — Unified Professional Profile (Option 1 of the
> implementation continuation after the Kimi K3 session). **Status:**
> implemented, tested, build-clean.

## What this slice is

`agent_profiles` was already the single identity system: one row is the
account, the SnapLink profile (`/p/{username}`), and the Southline listing
(`/agents/{slug}`). Its `professionType` column already accepted both licensed
types and trades. The gap was that the *surfaces* were real-estate-worded and
the taxonomy missed the service professions the platform copy already promised
(the Southline footer mentions contractors, real estate agents, architects,
designers, landscapers, **and photographers**).

This slice makes the unified model *actually* unified in the product: every
profession the roadmap names now has a taxonomy id, renders with the right
label, is searchable by profession, and gets profession-neutral (not
real-estate) copy in the form, directory, admin table, and public profile.

## Platform responsibilities (unchanged)

- **SnapLink** owns the professional's business operating asset (identity,
  `/p/{username}`, booking, leads, modules, payments).
- **Southline Living** owns the homeowner-facing discovery listing
  (`/agents/{slug}`).
- One table, one model — **no parallel profile system** was introduced or
  will be. `contractors` (trades) and `agent_profiles` (professionals) remain
  two deliberately separate products; this slice only generalizes the
  professional side.

## Taxonomy coverage

Every profession on the roadmap now exists in `lib/profession-types.ts`:

| Profession | id | Set |
|---|---|---|
| Realtor / Mortgage Broker | `realtor`, `mortgage_broker` | `LICENSED_PROFESSION_TYPES` |
| Home Inspector / Property Manager / Appraiser / Surveyor | `home_inspector`, `property_manager`, `appraiser`, `surveyor` | `LICENSED_PROFESSION_TYPES` |
| Contractor / Remodeler / Home Builder | `contractor`, `remodeler`, `home_builder` | `PROFESSION_TYPES` |
| Architect / Interior Designer / Landscaper | `architect`, `interior_designer`, `landscaper` | `PROFESSION_TYPES` |
| Plumber / Electrician / HVAC / Roofing / Painting / Flooring | `plumber`, `electrician`, `hvac`, `roofing`, `painting`, `flooring` | `PROFESSION_TYPES` |
| Cabinet Maker / Windows / Solar / Pool Builder | `cabinet_maker`, `window_company`, `solar`, `pool_builder` | `PROFESSION_TYPES` |
| **Photographer (added)** | `photographer` | `PROFESSION_TYPES` |

`isValidAgentProfessionType` accepts the union, so `POST /api/agent-profiles/create`
and the `[id]` PATCH already accept any of them with zero API changes.
`photographer` gets its own placeholder photo pool (three verified Unsplash
images) so cards never render a blank box.

## Changes by surface

| Surface | Change |
|---|---|
| `lib/profession-types.ts` | Added `photographer` + photo pool. |
| `lib/southline-i18n.ts` | Added `professionalDirectoryEyebrow/Title`, `aboutProfessional`, `companyLabel` — **additive only**, all real-estate keys untouched. |
| `lib/southline-search.ts` | Agent matches now include the profession label in both languages, so `/results` finds "photographer" / "fotógrafo". |
| `AgentProfilePublicPage.tsx` | Profession badge under the name; "About" replaces "About the agent". |
| `app/agents/page.tsx` | Directory is now profession-neutral ("Professional directory"), each card shows its profession chip. |
| `AgentForm.tsx` | Section is "Professional Details"; the brokerage field is labeled **Company name** for non-brokerage professions (`BROKERAGE_PROFESSIONS = { realtor, mortgage_broker }`); license fields note "(optional)" for non-licensed pros. |
| `AgentProfilesPanel.tsx` | New **Profession** column; **Brokerage** header → **Company / Brokerage**. |
| `scripts/seed-agent-profiles-demo.mjs` | Seeds a photographer (`camila-ruiz-photography`) on the same model — studio in `brokerage_name`, no license. |

Shared-field model means zero new columns: a photographer's studio name lives
in `brokerageName`, specialties in `specialties`, areas in `serviceAreas`.
"Profession-specific extensions only where necessary" → none were necessary
for this slice; the shared fields already cover every listed profession.

## Migrations

**None.** `professionType` is a text column; a new taxonomy id is additive.
No `ALTER`, no `CREATE`, no data backfill. (Satisfies "additive migrations
only" trivially.)

## Testing

`tests/unified-professional-profile.test.mjs` (run via
`npm run test:unified-professional`, which also re-runs the agent-profiles and
agent-management regressions):

- Taxonomy covers all 12 roadmap professions; `isValidAgentProfessionType`
  accepts each.
- `photographer` has its own photo pool; label resolves in EN/ES.
- i18n keys exist additively; real-estate keys remain.
- Public page, `/agents` directory, `AgentForm`, and admin panel assert the
  profession-agnostic copy.
- Search finds a photographer by `photographer` / `Photographer` / `fotógrafo`
  and not by an unrelated profession.
- `agent_profiles` remains the one profile table (no parallel system).

## Backward compatibility

- No route changes; `/p/{username}`, `/agents/{slug}`, `/results`, and every
  API route keep their exact paths and contracts.
- Existing realtors render identically plus a new "Realtor" badge (additive).
- The `/agents` directory copy is generalized from "Real estate / Agent
  directory" to "Professionals / Professional directory" — the intended
  generalization, still served by the same data.
- No existing i18n key, migration, or API field was modified.

## Verification

- `npm run test:unified-professional` — 11 new + agent-profiles + agent-management: pass.
- `npm run test:southline-search` — 17/17 pass.
- `npm run test:schema-drift` — 2/2 pass.
- `npm run test:agent-management` — 23/23 pass.
- `npm run build` — clean, no errors/warnings.

## Known pre-existing issue (not caused by this slice)

`tests/southline-form-visibility.test.mjs` has one failing test ("Lucio
Financial Copilot (tax/payment) code is untouched by this pass") that diffs
LFC tax/payment routes against commit `ba05d9c`. Commit `51be33f` legitimately
touched those routes after that baseline, so the test fails on `main` before
and after this slice. The baseline commit in that test should be bumped in a
separate cleanup commit — out of scope here.

## Recommended next steps (deferred)

- Bump the stale `ba05d9c` baseline in `southline-form-visibility.test.mjs`.
- Run `npm run db:seed:agent-profiles-demo` to seed the photographer demo and
  verify the public pages render it end-to-end against the live database.
- Real email delivery for the operator-created invitation (see
  `AGENT_MANAGEMENT.md`), and an audit log of publish/status changes per
  professional, reusing `agent_profile_events`.
