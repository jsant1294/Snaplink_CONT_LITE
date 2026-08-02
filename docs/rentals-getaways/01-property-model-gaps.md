# 01 — Property Model Gaps & Reuse Strategy

> **Slice:** Big Pickle — Rentals & Getaways Takeover. **Status:** Analysis (no code changed).

## 1. What exists today

One flat `Property` shape (`lib/real-estate/types.ts`) persisted in one table
(`real_estate_properties`, `lib/db/schema.ts:376`) with a separate
`real_estate_property_media` table. The `PropertyStatus` union already contains
`"rental"`, but it is dead code:

- no fixture uses it
- no CMS path writes it
- no repository filter reads it
- no public UI renders it

`price`/`price_cents` is a single numeric field; there are no rent-specific
columns anywhere in the 132-table schema.

## 2. Gap inventory

| # | Gap | Evidence | In-slice | Deferred |
| --- | --- | --- | --- | --- |
| G1 | No listing purpose (sale vs long-term rental vs short-term getaway) | `Property` has no `listingType`; status doubles as intent | — | Schema migration |
| G2 | No rent / nightly price | single `price_cents` | reuse `price` for display | Rename/add `price_type` |
| G3 | No minimum stay / deposit / pet policy / check-in-out / availability | not in type or table | display via `features`/`amenities` only | Schema migration |
| G4 | `"rental"` status unusable end-to-end | no CMS/filter/UI consumer | wire `status: "rental"` + fixtures | CMS form support |
| G5 | No rental fixtures for fallback | `demoProperties` are active/coming_soon/pending | add rental demo fixtures | — |
| G6 | CMS form is sale-only | `app/real-estate/properties/new` | not touched (internal CRM) | Rental-capable form |

## 3. Reuse strategy for this slice

The slice ships an **image-driven `/rentals` landing page** with a **display-only
reuse** of the existing model:

1. Publish rental listings today as `propertyStatus: "rental"` +
   `isPublished: true` rows via the existing repo (or rely on fixtures).
2. Add a `listPublishedRentalsWithFallback()` helper mirroring
   `listPublishedPropertiesWithFallback()` that filters the repository's
   published properties to `status === "rental"` and falls back to new
   rental-status demo fixtures for `demoTenant`.
3. Treat `price` as the display price (rental price for rentals). Landing-page
   copy avoids sale-specific claims.
4. Use `features`/`amenities`/`imageUrls` as the only rich content — no
   fabricated availability, nightly math, or pet rules are derived.

This keeps the data layer honest: nothing is invented; rental listings that
happen to be published will render, fixtures guarantee a rich first impression.

## 4. Recommended full-product model (deferred, for docs 08)

A future migration would add (all `real_estate_properties` columns):

- `listing_type text` (`sale` | `long_term_rental` | `short_term_rental`)
- `price_type text` (`sale_price` | `monthly_rent` | `nightly_rate`)
- `rent_period`/`nightly_rate_cents`, `minimum_stay_nights`, `security_deposit_cents`
- `pet_policy`, `check_in_time`, `check_out_time`, `availability_start/end`
- tenant/operator-facing `propertyManagerAgentId` (today `listing_agent_id` is reused)

These are intentionally **out of scope** for the limited slice to avoid a
schema migration and CRM-form rewrite.
