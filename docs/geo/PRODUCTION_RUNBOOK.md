# Production Runbook — TRUE GEO v1 (migration 0029)

Play-by-play for taking the TRUE GEO v1 radius search to production after the
September Closure (sprints `0047`…`0049`). The pre-existing **0027** and
**0028** migrations (demo safety + contractor lifecycle/publish gate) are
already live; this runbook covers **0029** plus the GEO data load, backfill,
acceptance, and rollback. Full coverage of the production go-live directive.

## Scope

What ships with 0029:

1. `contractors.service_zip` (text) + `contractors.service_radius_miles` (real)
2. `agent_profiles.service_zip` (text) — reuses the existing
   `agent_profiles.service_radius`. Radius for agent geo matches.
3. `zip_centroids` table + `zip_centroids(zip)` PK + `zip_centroids_state_idx`.
4. Runtime Haversine radius matching in `lib/southline-search.ts`
   (`serviceZip` centroid → distance ≤ radius), gated per professional on a
   complete geo record, with an explicit empty result for unknown visitor ZIPs.

Code behavior contract and data-source details: `docs/geo/ZIP_CENTROIDS.md`.

## Step 0 — Pre-flight

- Confirm `DATABASE_URL` points at the intended target. `drizzle.config.ts`
  loads `.env` and `assertNotProductionDatabase` refuses production names in
  both the migration flow and the import script — **do not bypass it**.
- Take a backup if your host doesn't snapshot automatically
  (`pg_dump -Fc` of the app DB, plus a note of the pre-load
  `SELECT COUNT(*)` per table).
- `npm ci` and `npx drizzle-kit check` must pass on the target node version.

## Step 1 — Apply migration 0029 (order is required: 0027 → 0028 → 0029)

```
npx drizzle-kit generate --name true_geo_v1   # already produced drizzle/0029_true_geo_v1.sql
npx drizzle-kit push                          # applies pending migrations to DATABASE_URL target
```

`drizzle/0029_true_geo_v1.sql` is purely additive:

```sql
CREATE TABLE "zip_centroids" (…);
ALTER TABLE "agent_profiles" ADD COLUMN "service_zip" text;
ALTER TABLE "contractors"   ADD COLUMN "service_zip" text;
ALTER TABLE "contractors"   ADD COLUMN "service_radius_miles" real;
CREATE INDEX "zip_centroids_state_idx" ON "zip_centroids" USING btree ("state");
```

Push does **not** run data backfills — that is Step 3. Verify the diff was
surgical: only `drizzle/0029_true_geo_v1.sql`, `drizzle/meta/_journal.json`,
and the new `0029_*` snapshot in `drizzle/meta/`.

Verify:

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name='contractors' AND column_name IN ('service_zip','service_radius_miles');  -- 2 rows
SELECT column_name FROM information_schema.columns
WHERE table_name='agent_profiles' AND column_name='service_zip';                            -- 1 row
SELECT to_regclass('zip_centroids');                                                        -- zip_centroids
```

## Step 2 — Load GEO data (`zip_centroids`)

Recommended production data: the public-domain CivicSpace Labs
`free-zipcode-database.csv` derived from US Census ZCTA data (~33k rows).
Any acceptable alternative is fine; record the choice in the ops journal.

```
node scripts/geo/import-zip-centroids.mjs ./free-zipcode-database.csv
```

The script is idempotent (`ON CONFLICT (zip) DO UPDATE`), collapses ZIP+4 to
5-digit, refuses production (`assertNotProductionDatabase`), and prints input /
upserted / skipped / total counts. If you already loaded the tiny fixture in
dev, load the full file the same way afterwards — the full set simply
overwrites the fixture rows and adds the rest.

Post-load verification (all must hold):

```sql
SELECT COUNT(*) FROM zip_centroids;                                   -- ~33,000
SELECT COUNT(*) FROM zip_centroids WHERE latitude IS NULL OR longitude IS NULL;   -- 0
SELECT zip FROM zip_centroids GROUP BY zip HAVING COUNT(*) > 1;       -- 0 rows (PK enforced)
SELECT zip, city, state, latitude, longitude FROM zip_centroids
WHERE zip IN ('30005','30004','78702','97201');                       -- spot-check coordinates
```

## Step 3 — Backfill professional geo fields

Only **non-demo, published** professionals get radius eligibility — demo and
unpublished stay excluded, exactly as the September publish gate defines.

1. Operators collect the service ZIP + radius in miles per professional (ops
   input; no per-ZIP polyline, a circle is the product decision).
2. Idempotent SQL (dry-run the `WHERE … IN` first):

```sql
UPDATE contractors
SET    service_zip = '30005', service_radius_miles = 15
WHERE  id = '<contractor_id>'
AND    status = 'published' AND is_demo = false;

UPDATE agent_profiles
SET    service_zip = '30005'
WHERE  id = '<agent_id>'
AND    status = 'active' AND is_demo = false
AND    service_radius > 0;   -- agents reuse their existing service_radius
```

3. Verify the backfill ranges exactly over the allowed population:

```sql
-- count of geo-enabled pros, split by demo flag (demo must be 0)
SELECT is_demo,
       COUNT(*) FILTER (WHERE service_zip IS NOT NULL
                        AND COALESCE(service_radius_miles,0) > 0) AS geo_enabled
FROM contractors GROUP BY is_demo;

SELECT is_demo,
       COUNT(*) FILTER (WHERE service_zip IS NOT NULL AND service_radius > 0) AS geo_enabled
FROM agent_profiles GROUP BY is_demo;
```

## Step 4 — Public acceptance (definition of done)

Using one known non-demo published professional staged at ZIP `30005` with a
15-mile radius (dev standby fixture: `ctr_geo_accept` / `geo-accept`):

| phone number search input            | expectation |
| ------------------------------------ | ----------- |
| exact ZIP `30005`                    | pro returned, `distanceMiles ≈ 0` |
| neighbor ZIP `30004` (in radius)     | pro returned, `distanceMiles ≈ 4.3` (real Haversine) |
| far ZIP `97201` (outside radius)     | pro excluded |
| unknown ZIP `99999`                  | empty results + geo "unknown ZIP" path (`geoUnknownZip` / UI "we couldn't find that ZIP") |
| category mixed with ZIP              | category still composes with radius match |
| demo professionals (e.g. `ctr_ridgeline`) | never returned for any ZIP |

API signal: `GET /api/southline/search?location=<zip>` echoes
`"geo":{"requested":true,"active":true,"matchedZip":"...","unknownZip":false}`
with `distanceMiles`/`serviceRadiusMiles` on each result.

Page signal: `/results?location=30004` renders the pro with "4.3 mi away"
(agent card and `resultsGeoActiveLabel` pill); unknown ZIP shows the explicit
empty state, matching the designer-cued copy in `lib/southline-i18n.ts`.

## Step 5 — Regression suite before go-live

```
npx tsc --noEmit
node --test tests/geo-zip.test.mjs tests/true-geo-search.test.mjs tests/southline-geo-search.test.mjs
node --test tests/southline-search.test.mjs tests/professional-discovery.test.mjs tests/professional-catalog.test.mjs
./node_modules/.bin/next build
```

Known pre-existing unrelated failures that are NOT caused by this change are
the V3-homepage / Lucio / UI-visibility `LUCIO_GUARD`+source asserts and the
`photographer` landing-template gap; document them in the go-live ticket.

## Step 6 — Rollback / feature-disable

- **App-level (instant):** revert the geo params in
  `app/api/southline/search/route.ts` + `app/results/page.tsx` (pass
  `geo: null` to `searchProfessionals`) — search returns to the exact
  substring/city/market behavior shipped in September. No data loss.
- **Data-level:** `zip_centroids` is purely additive reference data; dropping
  it (`DROP TABLE zip_centroids`) or re-importing a previous snapshot inverts
  Step 2 without touching professional rows.
- **Schema-level:** to unwind 0029 fully,
  `ALTER TABLE contractors DROP COLUMN service_zip, DROP COLUMN service_radius_miles;
  ALTER TABLE agent_profiles DROP COLUMN service_zip; DROP TABLE zip_centroids;`
  (or restore the backup from Step 0).

## Ops journal entry (copy/write to the go-live ticket)

```
- migration 0029 applied to: <db name>
- zip_centroids: <source>, <license>, <row count loaded>, <count skipped>
- backfilled: <n> contractors, <n> agents (all published + non-demo)
- acceptance performed: <date>, <operator>, <geo.active/matchedZip values observed>
- rollback ready: <app-level revert sha | db backup path>
```