# 04 — Homepage Integration

`app/page.tsx` → `components/southline/FeaturedProfessionals.tsx`. This section (`id=
"professionals"`) is the homepage's dual-source featured strip.

## Wiring

```tsx
<FeaturedProfessionals
  contractors={allContractors}
  agents={featuredSectionAgents}
  featuredContractorIds={settings?.featuredContractorIds ?? []}
  featuredAgentProfileIds={settings?.featuredAgentProfileIds ?? []}
  lang={lang}
/>
```

- `contractors` — the full, unfiltered contractor list (contractors have no lifecycle gate; see
  [00-current-state.md](./00-current-state.md)).
- `agents` — `activeAgentProfiles.map(publicAgentProfile)`; `activeAgentProfiles` already comes
  from `agentProfileStore.listActive()` (status-active only). `FeaturedProfessionals` applies a
  second gate on top (`isSouthlineListedAgent`, see below) so a merely-active-but-unpublished
  agent still never renders.
- `featuredContractorIds`/`featuredAgentProfileIds` — passed straight from the settings the
  `ProfessionalCatalogPanel` writes to. No `filter` prop is passed at this call site (matches
  the pre-existing behavior documented in the professional-discovery slice: "the homepage still
  calls it with no filter today").

## Ordering

`orderByIds()` (local to `FeaturedProfessionals.tsx`) sorts each source's visible list by
position in its curated id list, falling back to input order for anything not curated —
contractors and agents are ordered independently, then rendered as two `.map()` blocks in the
same grid (contractors first, then agents). This is a simpler ordering than the full
`cardComparator` in [02-featured-ordering.md](./02-featured-ordering.md) (no `updatedAt`/
`displayName` tie-break) — acceptable here because this is homepage curation (an operator
explicitly ordering a short list), not a full directory sort.

## Defects found and fixed

1. **Duplicate-id safety.** The original `orderByIds` had no guard against a duplicate id
   appearing twice in a featured list — it would have rendered the same professional's card
   twice. Fixed by tracking `seen` ids and skipping repeats. Defense in depth: the settings
   validator (see [05](./05-api-and-persistence.md)) now also rejects duplicate ids before they
   can ever be saved, so this path should be unreachable in practice — the render-layer guard
   stays anyway, since a hand-edited JSON settings file could still contain one.
2. **Unconditional "Featured" badge on contractor cards.** The agent half of this component
   already correctly gated its badge on `featuredAgentProfileIds.includes(a.id) ||
   a.southlineStatus === "featured"`; the contractor half rendered the badge on *every* card
   unconditionally, regardless of whether that contractor was actually in
   `featuredContractorIds`. Since `orderByIds` returns *all* passed-in contractors when the
   curated list is empty (fallback to input order), this meant every contractor on the homepage
   showed a "Featured" badge before any operator had featured anyone — a false curation signal.
   Fixed to gate on `featuredContractorIds.includes(c.id)`, matching the agent pattern.

## Publication gate (agents only)

```ts
const visibleAgents = filterProfessionalsByTaxonomy(agents, filter).filter(isSouthlineListedAgent);
```

`isSouthlineListedAgent` is the same function `/results`, `/agents`, and `/agents/{slug}` already
use — draft, hidden, suspended, and archived agent profiles are excluded here exactly as they
are everywhere else. Contractors have no equivalent gate because none exists in the data model
(see [00](./00-current-state.md) — adding one would be new infrastructure, out of scope).

## Locale

Both card halves already render through `t(key, lang)` / conditional `preferredLanguage`/
`languages` checks — no hardcoded English strings were found or introduced in this component
during this pass.
