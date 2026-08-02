# CMS controls

**Location**: Southline Admin → Homepage → **SnapLink Local Promo** tab
(`components/southline/admin/HomepageEditor.tsx`, `SnapLinkPromoTab`). Section on/off stays on
the existing **Sections** tab (`sections.localPromo`) — unchanged by this redesign.

## Fields

| Field | Type | Notes |
| --- | --- | --- |
| Image (desktop) | URL / upload | `ImageField`, upload `kind="snaplink-promo"` |
| Image (mobile) | URL / upload | Falls back to the desktop image when empty |
| Image alt (EN / ES) | text | Localized alt text used per `lang` |
| Layout | enum | `image-left`, `image-right`, `full-background` |
| Content alignment | enum | `left` / `right` — full-background only |
| Overlay strength | enum | `none` / `light` / `medium` / `strong` — full-background only |
| Focal point (desktop) | enum | `left` / `center` / `right` |
| Focal point (mobile) | enum | `top` / `center` / `bottom` |
| Show SnapLink badge | boolean | The gold "S" + "SnapLink Local" eyebrow |
| Show category chips | boolean | Independent of the CTA — CTA always renders |
| Show secondary line | boolean | The "Powered by the SnapLink Network" line |

Headline, body copy, and CTA label are **not** CMS fields for this section — they come from
`lib/southline-i18n.ts` (`localPromoTitle`, `localPromoBody`, `localPromoCta`,
`localPromoPoweredBy`), same as before this redesign. This matches how most Southline homepage
copy already works and keeps the diff scoped to presentation, not a new bilingual-copy editor.

## Persistence

`PATCH /api/southline/settings` with `{ snapLinkPromo: {...} }`, validated by
`validateSnapLinkPromo` in `lib/southline-validation.ts` (enum fields are checked against their
allowed values; `desktopImageUrl` must be a non-empty string; boolean fields must be booleans).
Saved via the existing `southlineStore.updateSettings()` — Postgres in production, JSON file
locally — through the same dual-store path as every other homepage section.

## Diagnostics

No dedicated diagnostics panel was added for this section (unlike `localDiscovery`, which has
`computeLocalDiscoveryStatus` for a ready/warning/misconfigured badge). The cross-promo CTA
target is fixed to the allowlisted SnapLink host via `buildCrossPromoUrl` regardless of any
image-related settings, so there's no "misconfigured destination" state this section can reach
through its own fields — `validateSnapLinkPromo` rejecting an invalid enum/boolean before save is
the enforcement point instead of a runtime status badge.
