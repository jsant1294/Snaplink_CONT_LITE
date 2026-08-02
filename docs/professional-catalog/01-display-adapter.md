# 01 — Display Adapter

`lib/southline-professional-catalog.ts` is pure and store-free: every function takes
pre-fetched `Contractor[]`/`AgentProfile[]` (plus the operator-curated featured id lists) and
returns plain data. It never queries a database or calls a store directly — callers (API routes,
Server Components, the admin panel) are responsible for fetching the source records.

## Why an adapter, not a merge

Contractors and agent profiles stay two separate stores, two separate types, two separate
identity systems — exactly as before this slice. The adapter's only job is producing **one
neutral read-model** (`SouthlineProfessionalCard`) for display purposes:

```ts
export interface SouthlineProfessionalCard {
  source: "contractor" | "agent";
  id: string;
  slug: string;
  publicUrl: string;
  displayName: string;
  companyName?: string;
  professionType: string;
  professionLabel: string;
  categoryIds: string[];
  primaryCategoryId?: string;
  imageUrl?: string;
  summary?: string;
  serviceArea: string;
  featured: boolean;
  featuredOrder?: number;
  verified?: boolean; // never populated — see "Truthfulness" below
  languages: string[];
  bookingUrl?: string;
  inquiryUrl?: string;
  updatedAt?: string;
}
```

`source` is preserved on every card — nothing about a contractor is ever presented as if it were
an agent profile or vice versa. `contractorToCard`/`agentToCard` are two separate, explicit
mapping functions; there is no generic "normalize any profile" function that could blur the two.

## Category resolution

`categoryIds`/`primaryCategoryId` are computed by delegating to
`categoryIdsForContractor`/`categoryIdsForAgent` (`lib/southline-search.ts`) and
`professionCategoryId` (`lib/home-service-taxonomy.ts`) — the exact same functions the
professional-discovery slice already ships and tests. The adapter does not reimplement or fork
taxonomy resolution; an unknown profession type resolves to `undefined` (never a guess), which
`catalogDiagnostics` (see [06](./06-fallback-behavior.md)) surfaces as `"unmapped"`.

## Truthfulness

The module's own header comment states the rule directly:

> `verified` is intentionally never populated — this app does not verify credentials, so the
> card shape carries the field as an explicit `undefined` and UI must never fabricate a badge.
> Same rule applies to reviews, ratings, availability, and licensing claims.

Verified in this pass: no rating/review/star pattern exists anywhere in
`lib/southline-professional-catalog.ts` or `ProfessionalCatalogPanel.tsx`
(`tests/professional-catalog.test.mjs`, "the catalog adapter never fabricates ratings, reviews,
credentials, or verification").
