# Draft and Resume

## Status lifecycle

`not_started → in_progress → completed → applied` (or `→ archived` at any point before `applied`, not currently exposed via any route but modeled for a future "start over" action).

- `not_started`: created, no answers saved yet.
- `in_progress`: set automatically on the first `PATCH` (autosave).
- `completed`: set by `POST .../submit`, only once every `required` question for the current owner type + profession has a non-empty answer (`missingRequiredQuestions()`).
- `applied`: set by `POST .../apply` (operator-only), after which the session becomes read-only (`PATCH`/`submit` both 409 once `applied` or `archived`).

## Single active session per owner

Mirrors the SnapLink source's own documented limitation (`00-snaplink-intake-audit.md`, item 6: "only one non-submitted session is allowed per profile at a time"). `intakeSessionStore.getActive(ownerType, ownerId)` returns the one non-terminal (`not_started`/`in_progress`/`completed`) session for an owner; `POST /sessions` returns that existing session (`resumed: true`) instead of creating a duplicate.

## Persistence shape

One `answers jsonb` column per session (`lib/db/schema.ts`'s `professional_intake_sessions` table) rather than the SnapLink source's column-per-question table — this repo already has this exact precedent in `lucio_events.metadata`. The practical benefit: adding, removing, or renaming a question never requires a schema migration, only a `questions.ts` edit.

`PATCH` **merges** into `session.answers` (`{ ...session.answers, ...body.answers }`) rather than replacing the bag wholesale, so a multi-step wizard can save one step at a time without risking data loss from a stale client state.
