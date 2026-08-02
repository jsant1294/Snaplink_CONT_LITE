# 04 — Dashboard Boundaries

Status: Phase 6 — complete.

## Two dashboards, two identity systems (unchanged)

| | Contractor | Agent (Professional) |
|---|---|---|
| Identity table | `contractors` | `agent_profiles` |
| Public profile | `/contractor/{username}` | `/agents/{slug}` |
| Dashboard | Contractor dashboard | Agent management |
| Profession source | `PROFESSION_TYPES` (18 trades) | `LICENSED_PROFESSION_TYPES` (6) + any trade |
| Service/specialty source | `SERVICE_LIBRARY` (canonical EN names) | free-text `categories[]` / `specialties[]` |

These are **not** merged by this slice. There is no `professional_profiles`, no second
identity table, and no canonical sync layer.

## What the `audience` tag means

`HomeServiceAudience = "contractor" | "professional" | "both"` on each category is
**descriptive metadata**, not a routing rule:

- It documents which provider surface *primarily* serves a category.
- It never redirects a dashboard, never merges identities, and never changes where a
  professional is edited.
- `both` categories (`home-inspections`, `photography`) are served from both surfaces
  today — each provider still keeps their own dashboard and identity row.

## Boundary rules (enforced by tests 32–34)

1. The taxonomy module is a pure data registry: no DB import, no migration, no
   `pgTable`, no identity table.
2. No new route family: there is no `app/professionals` and no `app/taxonomy` route;
   tests assert both paths do not exist.
3. No dashboard merge: `contractors` and `agent_profiles` keep their own schemas,
   stores, and admin flows.
4. `/results` chips continue to use `SERVICE_CATEGORIES`; adding professional chips is
   deferred to `08-next-slice.md` and would be a display-only change.

## What Southline gets

Southline public discovery may list **both** audiences (Phase 5) via
`listSouthlineHomeServices`, and unified search already returns contractors *and*
agents. The professional identity and dashboard remain untouched.
