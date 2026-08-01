# Fallbacks & Security

## Host allowlist (no open redirect)

```ts
export const ALLOWED_SNAPLINK_HOSTS = ["snaplink.southlineone.com", "localhost", "127.0.0.1"];
```

Enforced in **two** places (defense in depth):

1. **CMS save-time** — `validateLocalDiscovery()` rejects a PATCH whose
   `directoryBaseUrl` hostname is not on the allowlist, with the message
   `"...not on the SnapLink allowlist"`.
2. **URL-build-time** — `buildSnaplinkLocalUrl()` re-checks the hostname of
   whatever `directoryBaseUrl` it receives (even if it somehow bypassed
   validation, e.g. a legacy stored value) and silently falls back to
   `DEFAULT_DIRECTORY_BASE_URL` rather than ever building a link to a
   disallowed host.

This means a compromised or misconfigured CMS value can **never** turn Local
Discovery into an open redirect to an arbitrary host.

## Malformed base URL

Same fallback path as an unapproved host: `buildSnaplinkLocalUrl()` catches
the `URL` constructor throwing (or a non-`http(s)` protocol) and substitutes
the safe default.

## Fallback path safety (`fallbackUrl`)

`fallbackUrl` is a CMS field intended for use if a health-check/diagnostic
determines SnapLink is unavailable. It is validated by `isSafeFallbackPath()`,
which requires:

- Starts with `/` (an internal Southline path).
- Does **not** start with `//` (protocol-relative — would escape the site).
- Does **not** contain `://` (an absolute URL to another host).

This prevents `fallbackUrl` from becoming a *second* open-redirect vector.
Rejected values produce `"fallbackUrl must be an internal path"` at CMS
save-time.

> **Known limitation:** `fallbackUrl` is implemented as a CMS field and a
> Diagnostics/Test-Bridge input, but the public `LocalDiscovery.tsx` component
> does not perform a live health check against SnapLink before every
> render (a static homepage section has no continuous connectivity signal),
> so it does not currently auto-redirect visitors to `fallbackUrl` on its own.
> It is available for a future health-checked variant or for manual/CMS-driven
> use.

## ZIP validation

`isValidUsZip()` enforces `^\d{5}(?:-\d{4})?$` (5-digit or ZIP+4) both in the
public form and in the CMS Test Bridge tool. Invalid input shows an inline
error and never reaches `buildSnaplinkLocalUrl()`'s `zip` param.

## Category-mapping-missing handling

See [03-category-mapping.md](./03-category-mapping.md) — an unmapped category
is omitted, logged as a `console.warn`, and never crashes.

## No private data exposure

- The exact ZIP is never included in analytics payloads (see
  [05-attribution.md](./05-attribution.md)).
- The session id is anonymous, per-tab, and non-persistent.
- All outbound query values are URL-encoded via `URLSearchParams` — no
  string concatenation that could allow parameter injection.
