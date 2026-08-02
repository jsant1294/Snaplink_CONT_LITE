# 02 — Navigation Analysis & Restructure Plan

> **Slice:** Big Pickle — Rentals & Getaways Takeover. **Status:** Analysis (no code changed).

## 1. Where nav lives (four layers)

1. **`components/southline/Header.tsx` `DEFAULT_NAV`** — rendered when no CMS
   nav is supplied. Inline labels for `navHomes`; everything else resolves via
   `t(key, lang)`.
2. **`lib/southline-types.ts` `defaultSouthlineSettings().navigation`** — the
   CMS default; merged against stored settings on every read.
3. **Stored settings** — `lib/southline-store-pg.ts` (`southline_settings`
   jsonb row, active because `usePg` is true) and `lib/southline-store-json.ts`
   (`.data/southline-settings.json`, local-only). Both run `mergeWithDefaults`.
4. **`lib/southline-i18n.ts` `UI_DEFS`** — string dictionary; `UIKey` is derived
   from it, so `t()` is type-safe.

The merge in (3) is **by `key`**: defaults drive order, stored values win for
matching keys, and stored keys missing from defaults survive as `customExtras`.

## 2. Verified live state

The single stored Postgres row (`id = "default"`) contains `navRealEstate` with
**default** values (`/#real-estate`, "Real Estate"/"Bienes Raíces") — no
operator customization. Consequence: after renaming the default key, the merge
would emit the new `navRentals` default **and** keep a stale `navRealEstate`
extra → the nav would show both. A retired-key drop is required (below).

## 3. Target

```
Home | Homes | Rentals & Getaways | Ideas | Projects | DIY | Professionals | Book
Inicio | Casas | Alquileres y Escapadas | Ideas | Proyectos | Hazlo Tú Mismo | Profesionales | Reservar
```

Relative to today: `navRealEstate` → `navRentals` (href `/#real-estate` →
`/rentals`), and it moves from between Ideas and Projects to directly after
Homes. ES label for `navDIY` changes "DIY" → "Hazlo Tú Mismo" per spec.

## 4. Exact edits

### 4.1 `lib/southline-i18n.ts` (`UI_DEFS`)
- Add `navHomes: { es: "Casas", en: "Homes" }`.
- Add `navRentals: { es: "Alquileres y Escapadas", en: "Rentals & Getaways" }`.
- Update `navDIY` to `{ es: "Hazlo Tú Mismo", en: "DIY" }`.
- Remove `navRealEstate` (only consumers are `Footer.tsx` and the retired
  `Header` item; both updated here).
- Add `navGetaways`? Not needed — a single combined nav item per spec.

### 4.2 `components/southline/Header.tsx` `DEFAULT_NAV`
```
{ key: "navHome", href: "/" },
{ key: "navHomes", href: "/homes", labelEs: "Casas", labelEn: "Homes" },
{ key: "navRentals", href: "/rentals", labelEs: "Alquileres y Escapadas", labelEn: "Rentals & Getaways" },
{ key: "navIdeas", href: "/#categories" },
{ key: "navProjects", href: "/planner" },
{ key: "navDIY", href: "/diy" },
{ key: "navPros", href: "/#professionals" },
{ key: "navBook", href: "/book" },
{ key: "navForContractors", href: "/for-contractors" },
```
`navForContractors` is kept as-is (last item) — it exists only in Header's
default, not the CMS default, and its removal is not specified.

### 4.3 `lib/southline-types.ts` defaults
Replace the `navRealEstate` line with the `navRentals` entry, positioned after
`navHomes`; keep the rest of the ordering (`navIdeas … navBook`).

### 4.4 Store merge — retired-key drop (both `southline-store-json.ts` and
`southline-store-pg.ts`)
In `mergeWithDefaults`, drop stored items whose key is `navRealEstate` before
building `customExtras`. New `navRentals` default then fills the slot, and no
stale "Real Estate / Bienes Raíces" link survives. This covers both the
Postgres row (verified present) and any JSON store. Optionally also rewrite the
persisted row so `getSettings` output is clean.

### 4.5 `components/southline/Footer.tsx`
The default "Explore" column currently renders one `/homes` link labeled
`t("navRealEstate")`. Replace with two links: `/homes` labeled `t("navHomes")`
and `/rentals` labeled `t("navRentals")`.

## 5. Anchor / homepage handling

- `<section id="real-estate">` in `RealEstateEntryBlock.tsx` **stays** (it is a
  stable in-page anchor and the section is not being removed; the CMS may keep
  `RealEstateBlockSettings` untouched).
- The homepage featured-property block and `FeaturedHomes` are unchanged;
  `/rentals` becomes the dedicated rentals landing reached from the nav.
- `LocalDiscovery` real-estate category still routes to `/homes`
  (`lib/southline-local-discovery.ts`) — unchanged, still consistent.

## 6. Tests affected (must be updated in the testing phase)

`tests/real-estate-entry-block.test.mjs`:

- Test 5 (lines 46–58): asserts `navRealEstate` sits between Ideas and Projects
  in both Header and types. → Replace with an assertion that `navRentals`
  appears **after** `navHomes` and **before** `navIdeas`, in both files, and
  that `navRealEstate` no longer appears.
- Test 6 (lines 60–65): asserts Header links to `/#real-estate`. → Keep the
  `id="real-estate"` assertion; change the Header assertion to
  `href: "/rentals"`.

`tests/southline-local-routing.test.mjs` (real-estate → `/homes` routing) is
unaffected and stays green.
