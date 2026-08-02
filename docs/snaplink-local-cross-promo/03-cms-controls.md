# CMS controls

**Location**: Southline Admin → Homepage → **SnapLink Local Promo** tab
(`components/southline/admin/HomepageEditor.tsx`, `SnapLinkPromoTab`). Section on/off stays on
the existing **Sections** tab (`sections.localPromo`) — unchanged by this redesign.

## Fields

| Field | Type | Notes |
| --- | --- | --- |
| Eyebrow (EN / ES) | text | Overrides `localPromoEyebrow`; blank = use site default |
| Headline (EN / ES) | text | Overrides `localPromoTitle`; blank = use site default |
| Body (EN / ES) | text | Overrides `localPromoBody`; blank = use site default |
| CTA label (EN / ES) | text | Overrides `localPromoCta`; blank = use site default |
| Secondary line (EN / ES) | text | Overrides `localPromoPoweredBy`; blank = use site default |
| Image (desktop) | URL / upload | `ImageField`, upload `kind="snaplink-promo"` |
| Image (mobile) | URL / upload | Falls back to the desktop image when empty |
| Image alt (EN / ES) | text | Localized alt text used per `lang` |
| Layout | enum | `image-left`, `image-right`, `full-background` |
| Content alignment | enum | `left` / `right` — full-background only |
| Overlay strength | enum | `none` / `light` / `medium` / `strong` — full-background only |
| Focal point (desktop) | enum | `left` / `center` / `right` |
| Focal point (mobile) | enum | `top` / `center` / `bottom` |
| Show SnapLink badge | boolean | The gold "S" + eyebrow |
| Show category chips | boolean | Independent of the CTA — CTA always renders |
| Show secondary line | boolean | The "Powered by the SnapLink Network" line |

**Update (post-launch)**: eyebrow/headline/body/CTA label/secondary line are now CMS-editable
(`SnapLinkPromoContent.eyebrowEn`/`eyebrowEs`/`titleEn`/`titleEs`/`bodyEn`/`bodyEs`/
`ctaLabelEn`/`ctaLabelEs`/`secondaryLineEn`/`secondaryLineEs`, all `string | null`). Each field
defaults to `null`, meaning "use the `lib/southline-i18n.ts` `localPromo*` text" — the same
fallback contract already used by the image fields, so existing settings rows keep rendering
identical copy until an operator explicitly overrides a field. This supersedes the original
design note in [00-overview.md](./00-overview.md) that copy stayed i18n-only; that was true for
the initial ship, not the current state.

## Category chips: text-only, no icon field

Chips (`CrossPromoCategory` in `lib/southline-local-discovery.ts`) render label text only — no
emoji/icon. The `emoji` field was removed from the type and the shipped category list entirely
(not just hidden in rendering), per direction that this is a premium site and decorative emoji
don't fit the visual language. There is no CMS control to re-add an icon per chip; if a visual
marker is wanted later, it should be a small monochrome SVG glyph system, not emoji.

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
