# 07 — Local Discovery compat + recommended next slice

## Compatibility (verified, unchanged)
- `LocalDiscovery` component and `lib/southline-local-discovery.ts` are untouched.
- Photography (and any `destination: "snaplink"` category) still hands off to SnapLink;
  everything else routes to Southline via `getCategoryDestination`.
- `/results` stays the internal directory route for Southline-owned categories.
- `LOCAL_DISCOVERY_LEGACY_MAP` is a documented compat table only; slug resolution is the
  fallback, never the primary identity. Precedence: direct canonical id → legacy slug →
  label/alias (e.g. `pools` now resolves to the Pools & Spas category).

## Recommended next slice
**Seed/curate the professional catalog for the directory.** The taxonomy drives every
public chip and card now, but the professional listings come from the contractor and
agent stores — there is no way to publish a professional into `/results` without a
contractor/agent profile. A display-focused next slice could:

1. Let Southline admins feature a professional (contractor or agent) in the directory via
   the existing stores (no new identity system).
2. Add a per-category landing experience at `/results?category=` (seo metadata, curated
   copy) driven by the taxonomy groups.
3. Mark a category `featured` and surface it as the default Home Services strip
   (`featuredOnly: true` is already supported by `listSouthlineHomeServices`).

Out of scope by design (unchanged): no `professional_profiles`, no dashboard merge, no
`agent_profiles` rename, no taxonomy CRUD or DB table, no billing/booking changes.
