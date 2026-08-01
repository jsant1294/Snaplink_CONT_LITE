# Local Discovery ↔ SnapLink Local Bridge — Overview

## What this is

Southline Living's **Local Discovery** homepage section is a hand-off point: a
homeowner enters a ZIP code (and optionally picks a category), and Southline
sends them to **SnapLink Local** — the canonical, externally-hosted directory
of verified professionals — with that ZIP/category/locale/attribution
forwarded as query parameters.

Southline never runs its own duplicate directory or professional-profile
system for this flow. The only professional-profile route Southline itself
serves is the canonical `/p/{username}` page (used elsewhere, for
agent/contractor profiles) — Local Discovery does not create a second one.

## Why it exists

- Homeowners land on Southline Living content (guides, DIY, planner, etc.)
  and need a fast, low-friction way to find a real professional near them.
- SnapLink Local already owns "professional directory" as a concern —
  Southline should point to it, not re-implement it.
- Marketing partners (e.g. a Nextdoor placement) need to know where clicks
  came from — the bridge carries that attribution end to end.

## The pieces

| Layer | File |
|---|---|
| Types / CMS schema | [lib/southline-types.ts](../../lib/southline-types.ts) |
| URL-building, validation helpers, diagnostics, attribution | [lib/southline-local-discovery.ts](../../lib/southline-local-discovery.ts) |
| CMS PATCH payload validation (incl. host allowlist) | [lib/southline-validation.ts](../../lib/southline-validation.ts) |
| Public homepage section | [components/southline/LocalDiscovery.tsx](../../components/southline/LocalDiscovery.tsx) |
| CMS operator editor (config, preview, Test Bridge, diagnostics) | [components/southline/admin/LocalDiscoveryEditor.tsx](../../components/southline/admin/LocalDiscoveryEditor.tsx) |
| Tests | [tests/southline-cms-local-discovery.test.mjs](../../tests/southline-cms-local-discovery.test.mjs) |

## Read next

- [01-architecture.md](./01-architecture.md) — how a request flows from the homepage to SnapLink.
- [02-url-contract.md](./02-url-contract.md) — the exact query parameters and their defaults.
- [03-category-mapping.md](./03-category-mapping.md) — how Southline categories map (or don't) to SnapLink categories.
- [04-cms-controls.md](./04-cms-controls.md) — every operator-facing control in the CMS editor.
- [05-attribution.md](./05-attribution.md) — what gets tracked, and the privacy guarantees.
- [06-fallbacks.md](./06-fallbacks.md) — what happens when config is missing, invalid, or unsafe.
- [07-test-results.md](./07-test-results.md) — the verification pass and its results.
