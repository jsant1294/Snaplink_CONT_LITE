# 03 — Admin Panel

`components/southline/admin/ProfessionalCatalogPanel.tsx`, mounted as a new "Professional
Catalog" tab in `app/southline/admin/page.tsx` (`tab === "catalog"`).

## What it replaces

Before this slice, featuring a contractor and featuring an agent required two separate editors
(`FeaturedProsPicker` for contractors, the real-estate block editor's agent list) with no shared
view, no visible ordering, and no way to see publication/mapping problems across both sources at
once. This panel is one list, one set of filters, one ordering control, covering both.

## Data sources — all pre-existing

| Fetch | Route | Auth |
| --- | --- | --- |
| Contractors | `GET /api/contractor/profiles` | None — this route is intentionally public (same as every other consumer of it; contractors have no private-listing concept) |
| Agent profiles | `GET /api/agent-profiles` | `x-snaplink-pin` header |
| Curated featured lists | `GET /api/southline/settings` | `x-snaplink-pin` header |
| Save (feature/unfeature/reorder) | `PATCH /api/southline/settings` | `x-snaplink-pin` header |

No new API route was created. The panel is itself rendered behind the existing `PinGate` at the
Southline Admin page level.

## Controls

- **Search** — name, profession, service area (client-side substring match).
- **Source filter** — All / Contractors / Agents.
- **Category filter** — every `HOME_SERVICE_CATEGORIES` entry (the same live taxonomy list
  `/results` uses).
- **Status filter** — Public / Hidden / Unmapped, driven by `catalogDiagnostics`.
- **Featured only** — checkbox.
- **Per-row actions**: feature/unfeature (checkbox), reorder (↑/↓, only enabled while featured),
  **Preview** (opens the real public URL in a new tab), **Copy** (copies the public URL), **Open
  →** (opens the record's own source workspace).

## Defect found and fixed: contractor "Open" pointed at the public page

Before this pass, `openUrl` for a contractor row was set to the same value as `publicUrl`
(`/contractor/{username}`) — meaning "Open →" and "Copy" did the exact same thing, and there was
no way to reach a contractor's actual operator workspace (`/contractor-admin/{username}`) from
this panel, unlike agents, whose `openUrl` correctly pointed at
`/southline/admin/agents/{id}`. Fixed to `/contractor-admin/{username}`, matching the agent
pattern. A genuine "Preview" action (opens `publicUrl` in a new tab) was added alongside it,
since neither "Copy" (clipboard, not visible) nor the old "Open" (which was really just another
copy of the public link) actually let an operator *see* the live public profile in one click.

## Diagnostics badges

Each row shows the same `ready` / `warning` / `hidden` / `unmapped` status
`catalogDiagnostics` computes (see [06-fallback-behavior.md](./06-fallback-behavior.md)), plus
inline `no photo` / `no summary` chips driven by the same `hasImage`/`hasSummary` booleans used
for the diagnostic. The top strip shows aggregate counts (Total / Public / Featured / Hidden /
Unmapped) computed from the same `rows` array the list renders — the count badges and the visible
rows can never disagree, because both read from one `useMemo`.

## Failure handling

`patchSettings` wraps every save in try/catch; on failure it shows a toast with the server's
error message (or a generic fallback) and does **not** revert the optimistic local state change
that was already applied before the request — meaning a failed save can leave the UI briefly
out of sync with the server until the next reload. This is a known limitation, not fixed in this
pass (fixing it means adding rollback-on-failure state handling, a real behavior change beyond
"complete the existing slice" — see [08-next-slice.md](./08-next-slice.md)).
