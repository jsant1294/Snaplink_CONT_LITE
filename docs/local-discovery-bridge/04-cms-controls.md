# CMS Controls

All controls live in `LocalDiscoveryEditor.tsx`, under Southline Admin →
**Local Discovery** tab. Saving PATCHes `/api/southline/settings`, validated
by `validateLocalDiscovery()`.

## Status badge

A `Ready` / `Hidden` / `Warning` / `Misconfigured` badge (from
`computeLocalDiscoveryStatus()`) sits at the top of the editor at all times —
the same function powers the Diagnostics panel below.

## Master + subordinate toggles

- **Local discovery enabled** (master). When off, the two toggles below are
  visually disabled (`opacity-40`, `disabled` on the switch) — they can still
  be edited (values preserved), but an explanatory note makes clear they have
  no effect while the master switch is off.
- **Show on homepage**
- **Show category cards**

## Copy fields

Eyebrow, title, description — each in EN and ES, with blank Spanish fields
falling back to the English value at render time.

## SnapLink Local Bridge section (Phase 3)

| Field | Purpose |
|---|---|
| Base URL (`directoryBaseUrl`) | SnapLink Local origin/path. Validated against the host allowlist. |
| Route (`directoryRoute`) | Path segment after the locale (default `local`). |
| ZIP param name (`zipParam`) | Query key used for the ZIP (default `zip`). |
| Category param name (`categoryParam`) | Query key used for the category (default `category`). |
| Locale param name (`localeParam`) | Optional extra query key for locale (default none — path segment already carries it). |
| Source value (`sourceValue`) | Value sent in the `source` param (default `southline-living`). |
| Placement value (`placementValue`) | Value sent in the `placement` param (default `homepage-local-discovery`). |
| Open behavior (`openBehavior`) | `same-tab` or `new-tab`. |
| Fallback URL (`fallbackUrl`) | Internal Southline path used as a diagnostic/config fallback if SnapLink is flagged unavailable. Must be a safe internal path (see [06-fallbacks.md](./06-fallbacks.md)). |
| Preserve UTM (`preserveUtm`) | Whether inbound-approved UTM params are forwarded. |
| Attribution enabled (`attributionEnabled`) | Whether `source`/`placement` are added. |

## Category CRUD

Add / remove / reorder (move up/down) category cards; each with EN/ES label,
EN/ES description, icon, image URL, SnapLink category slug, seasonal tag,
visible, and featured flags. Order is renumbered on every add/remove/move.

## Test Bridge tool

Lets an operator pick a preview locale, type a test ZIP, and pick a category,
then:

1. Validates the ZIP client-side (reuses `isValidUsZip`).
2. Builds the **real** URL via `buildSnaplinkLocalUrl()` using the current
   (possibly unsaved) draft settings.
3. Shows the generated URL **before** allowing navigation — an explicit
   "Open in new tab" link, not an automatic redirect.
4. Runs a best-effort reachability probe (`fetch(url, { method: "HEAD", mode: "no-cors" })`).
   Because the response is opaque (cross-origin, `no-cors`), a resolved fetch
   is treated as "Reachable" and a thrown network error as "Unreachable" —
   this is disclosed in-UI as best-effort, not a guarantee.
5. On a reachable result, updates "Last successful bridge test" — **session-only**
   (component state), not persisted to the settings blob.

## Diagnostics panel

Eight rows, each backed by the same signals `computeLocalDiscoveryStatus()`
uses (plus the live Test Bridge reachability result for the "Directory route
reachable" row): Master feature enabled, Homepage visible, Category cards
visible, Base URL valid, Category mappings valid, Locale mapping valid,
Attribution enabled, Directory route reachable.

## Preview panel

Renders the **actual** `LocalDiscovery` component (not a re-implemented
mock) with EN/ES and Desktop/Mobile toggles, wrapped in a
`pointer-events-none select-none` container so nothing inside it can be
clicked or navigate away from the CMS.
