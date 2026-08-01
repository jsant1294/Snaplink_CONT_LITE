# URL Contract

`buildSnaplinkLocalUrl()` in [lib/southline-local-discovery.ts](../../lib/southline-local-discovery.ts) is the **single**
function that builds every outbound SnapLink Local URL — the public homepage
component, the CMS preview, and the CMS Test Bridge tool all call it.

## Locale

Southline's real SnapLink Local route is **path-based**, not query-based:

```
https://snaplink.southlineone.com/en/local
https://snaplink.southlineone.com/es/local
```

`resolveLocalPath()` swaps the `/en`/`/es` segment of the configured
`directoryBaseUrl` (or appends it to a bare origin). This intentionally
differs from the bridge spec's illustrative `&locale=en` query-param example —
the spec explicitly said to defer to the repository's real route when it
differs, and this repo's route is path-based.

An **optional** `localeParam` CMS field additionally appends `?<param>=<locale>`
for forward compatibility (e.g. if SnapLink Local later wants a redundant
query-param locale signal), without removing the path segment.

## Query parameters

| Param (default name) | Configurable via | Included when |
|---|---|---|
| `zip` | `zipParam` | A ZIP is supplied and passes `isValidUsZip()` |
| `category` | `categoryParam` | A SnapLink-mapped category is supplied (never a guessed slug — see [03-category-mapping.md](./03-category-mapping.md)) |
| *(locale, optional)* | `localeParam` | `localeParam` is configured (non-null) |
| `source` | `sourceValue` (value, not key) | `attributionEnabled` is true (default `true`) |
| `placement` | `placementValue` (value, not key) | `attributionEnabled` is true (default `true`) |
| `utm_source`, `utm_medium`, `utm_campaign` | n/a (fixed keys, values from `DEFAULT_ATTRIBUTION` or the caller's approved inbound UTM) | `preserveUtm` is true (default `true`) |

`source`/`placement` are new, distinct from `utm_source`/`utm_medium`/
`utm_campaign` — they identify *this Southline placement* to SnapLink,
independent of any external ad-campaign attribution being passed through.

## Defaults (`DEFAULT_LOCAL_DISCOVERY`)

```
directoryBaseUrl:  https://snaplink.southlineone.com/en/local
directoryRoute:    "local"
zipParam:          "zip"
categoryParam:     "category"
localeParam:       null
sourceValue:       "southline-living"
placementValue:    "homepage-local-discovery"
openBehavior:      "same-tab"
fallbackUrl:       "/"
preserveUtm:       true
attributionEnabled: true
```

## Example

Default config, ZIP `75204`, category mapped to `landscaping`:

```
https://snaplink.southlineone.com/en/local?zip=75204&category=landscaping&source=southline-living&placement=homepage-local-discovery&utm_source=southline&utm_medium=referral&utm_campaign=local-discovery
```

## Guarantees

- The destination **host** always comes from trusted CMS configuration (or
  the shipped default) — **never** from visitor input.
- The host is checked against `ALLOWED_SNAPLINK_HOSTS` at build time
  (defense in depth — see [06-fallbacks.md](./06-fallbacks.md)) in addition to CMS save-time validation.
- Every value is URL-encoded via `URLSearchParams`; no raw string
  concatenation.
- Only allowlisted UTM keys (`APPROVED_UTM_KEYS`) are ever forwarded from an
  inbound query string — arbitrary query params are dropped.
