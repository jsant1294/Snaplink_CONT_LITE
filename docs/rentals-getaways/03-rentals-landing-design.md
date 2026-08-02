# 03 — `/rentals` Landing Page Design

> **Slice:** Big Pickle — Rentals & Getaways Takeover. **Status:** Design.

## 1. Goals

- A consumer-facing, **image-driven** landing page at `/rentals` that makes
  "Rentals & Getaways" (ES: "Alquileres y Escapadas") a real destination.
- Reuses the existing property model + repositories — **no schema migration**.
- Preserves `/homes` (sale homes) and the agent surfaces untouched.
- Renders both languages via the `sl_lang` cookie pattern used across the app.

## 2. Route + data

New file: `app/rentals/page.tsx` (server component, `dynamic = "force-dynamic"`,
mirroring `app/homes/page.tsx` structure).

Data path:

1. `propertyRepository.listPublishedProperties(demoTenant.id, { pageSize: 100 })`
2. Filter to `status === "rental"`.
3. If empty and tenant is `demoTenant`, fall back to **new rental fixtures**
   (added to `lib/real-estate/fixtures.ts`, `status: "rental"`), wrapped in a
   `listPublishedRentalsWithFallback()` helper added to
   `lib/real-estate/homes-fallback.ts`.

`Metadata`: EN + ES title/description, canonical `/rentals`, OG with the first
image. (Mirror the `appUrl` pattern from `/homes`.)

## 3. Layout (image-driven, matches site visual language)

Palette/typography reuse: `bg-[#EEE7DA]`, `#2F2923` text, `font-display`,
gold accent `#B99552/#D6AD55`, cards `bg-[#E4DACB]`, cream/obsidian — identical
to `/homes` so the two directories feel like one marketplace.

Sections:

1. **Hero band** — full-width, first-image backdrop with gradient overlay
   (same treatment as `/homes/[slug]` hero), "Rentals & Getaways /
   Alquileres y Escapadas" eyebrow + headline + subcopy. EN/ES inline copy.
2. **Search form** — `q` input (city/title), submits to the same page
   (`/rentals?q=…`), like `/homes`.
3. **Grid** — `grid gap-6 md:grid-cols-2 lg:grid-cols-3` of image cards:
   image (lazy), status chip (`Rental`/`Alquiler`), title, city/state,
   `formatPropertyPrice(price)` as the headline figure, bd/ba/sqft line,
   CTA link to `/rentals/[slug]` (or `/homes/[slug]` — see 3.1).
4. **Empty state** — "No rentals available" message + link back to `/homes`.
5. **Pagination** — same as `/homes` when total > page size.

### 3.1 Detail route decision

Rental cards link to `/homes/[slug]` (the existing detail page). Rationale:

- The detail page is model-agnostic (renders `status`, `price`, images,
  features, amenities, listing agent) and already renders a `rental` status
  chip correctly.
- Creating a parallel `/rentals/[slug]` duplicates ~46 lines of working,
  already-tested UI for zero data-model gain in a limited slice.
- A dedicated `/rentals/[slug]` becomes the doc-08 "next phase" item alongside
  the rental schema fields.

## 4. Copy (hardcoded inline, matching `/homes` style)

- Eyebrow: `Rentals & Getaways` / `Alquileres y Escapadas`
- H1: `Find your stay, seasonal or long-term.` / `Encuentra tu estancia, de temporada o a largo plazo.`
- Sub: "Rental homes and getaway stays published by local SnapLink
  professionals." / "Casas en renta y escapadas publicadas por profesionales
  locales de SnapLink."
- Placeholder: "Search by city or title" / "Buscar por ciudad o título"
- Status chip: `Rental` / `Alquiler`
- Card CTA: "View rental" / "Ver alquiler"

## 5. Non-goals (this slice)

- No availability calendar, nightly pricing math, or booking engine on the page.
- No changes to the property CMS form.
- No schema migration (`listing_type`, rent fields) — deferred to docs 08.
- No change to `/homes`, `/agents`, `/results`, or Local Discovery routing.
