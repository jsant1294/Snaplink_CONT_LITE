# Review and Apply

Matches the Objective exactly: *"Professional completes a guided intake → answers are normalized → profile fields are prefilled → operator reviews → profile is published."*

## Who can do what

| Action | Route | Who |
|---|---|---|
| Create / resume a session | `POST /api/professional-intake/sessions` | Operator OR the owning professional's own PIN |
| Autosave answers | `PATCH /api/professional-intake/sessions/[id]` | Operator OR owner |
| Submit (mark completed) | `POST /api/professional-intake/sessions/[id]/submit` | Operator OR owner |
| Review preview | `GET /api/professional-intake/sessions/[id]/preview` | **Operator only** |
| Apply to the live profile | `POST /api/professional-intake/sessions/[id]/apply` | **Operator only** |

Filling out an intake is never the same action as writing to the public profile — even when the professional filled it out themselves, applying it is always a separate, explicit operator step (`lib/professional-intake/auth.ts`, `apply/route.ts`).

## Apply modes (`ProfileApplyMode`)

- **`fill_empty` (default)** — only writes fields that are currently empty on the live profile. A non-empty existing field is never silently overwritten.
- **`replace_selected`** — writes only the fields the operator explicitly lists.
- **`replace_all`** — writes every field the intake mapped.

`resolveApplyPatch()` (`lib/professional-intake/apply.ts`) is the single function that turns (mode, current profile, proposed patch) into the final patch actually sent to `contractorStore.update()`/`agentProfileStore.update()`.

## The preview

`buildReviewPreview()` returns one row per proposed field: `{ field, sourceQuestionId, currentValue, proposedValue, changed, sensitive }`. `sensitive` is true for `licenseInfo`/`licenseNumber`/`licenseState` — the UI (`IntakeConsole.tsx`) surfaces an explicit "sensitive — verify before publishing" label on those rows, and `session.flaggedQuestionIds` (values normalize.ts couldn't fully validate) are shown separately so nothing questionable is applied unnoticed.
