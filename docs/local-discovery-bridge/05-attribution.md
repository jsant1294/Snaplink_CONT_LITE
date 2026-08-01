# Attribution

## What is recorded

`LocalSearchEventPayload` (emitted as the `local_search_submitted` event, both
via an `onSearch` callback prop and a `window` DOM event):

```ts
{
  source: string;        // e.g. "southline"
  placement: string;     // e.g. "homepage-local-discovery"
  locale: Lang;           // "en" | "es"
  zipProvided: boolean;   // never the raw ZIP
  category: string | null;
  timestamp: string;
  sessionId: string;      // anonymous, per-tab
  utm: ApprovedUtmParams;
}
```

## What is deliberately **not** recorded

- The literal ZIP code — only `zipProvided: boolean`. Analytics answers "did
  a homeowner search?", not "which ZIP?".
- Any personally-identifying information, IP address, or exact device
  fingerprint.

## Session ID

`getOrCreateLocalDiscoverySessionId()`:

- Backed by `sessionStorage` (per-tab, cleared when the tab closes) — not a
  persistent cross-session identifier.
- Wrapped in try/catch; if storage is unavailable (privacy mode, disabled
  storage, SSR), it falls back to a fresh non-persistent id and **never
  throws**.
- Used only to correlate a single local-search event with the SnapLink
  hand-off it produced — not tied to any account or profile.

## Analytics must never block navigation

Both the `onSearch` callback invocation and the `window.dispatchEvent` call
are wrapped in their own `try/catch` blocks inside `emitLocalSearch()`. If a
consuming analytics integration throws, the homeowner still reaches SnapLink
Local — the redirect (`navigate(url)`) happens independently of whether
attribution succeeded.

## UTM passthrough

`readApprovedUtmParams()` reads only `APPROVED_UTM_KEYS`
(`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`) off
the current page's query string — arbitrary query parameters are dropped.
Whether these are forwarded to SnapLink is controlled by the CMS
`preserveUtm` toggle (default on).

## `source` / `placement` vs. UTM

- `source` / `placement` (new in this bridge) identify **this Southline
  surface** to SnapLink — controlled independently by `attributionEnabled`
  and always use the CMS-configured `sourceValue`/`placementValue`.
- `utm_*` params identify an **external campaign** that sent the visitor to
  Southline in the first place (e.g. a Nextdoor ad) — passed through only
  when `preserveUtm` is on.

Both can be present simultaneously and answer different questions.
