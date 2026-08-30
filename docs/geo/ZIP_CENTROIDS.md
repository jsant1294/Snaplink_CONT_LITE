# TRUE GEO v1 — US ZIP centroid dataset (zip_centroids)

Reference data for real geographic radius search. No PostGIS, no external
geocoder, no runtime network lookups: the app ships with a locally loaded
table that maps a normalized 5-digit US ZIP to its centroid, and computes
Haversine distances in code.

## What is stored

| column     | type            | meaning                                              |
| ---------- | --------------- | ---------------------------------------------------- |
| `zip`      | text (PK)       | normalized 5-digit US ZIP                            |
| `city`     | text · nullable  | primary place name (informational, not used for match) |
| `state`    | text · nullable  | two-letter state (informational / runbook checks)     |
| `latitude` | numeric(10,6)   | ZIP centroid latitude (WGS-84)                       |
| `longitude`| numeric(10,6)   | ZIP centroid longitude (WGS-84)                      |

## Dataset source & license

Recommended source: the **free-zipcode-database** release (commonly distributed
as `free-zipcode-database.csv`), originally compiled by **CivicSpace Labs**
from **US Census Bureau ZIP Code Tabulation Area (ZCTA)** boundary data. US
Census Bureau data is in the **public domain** (17 U.S.C. § 105), so the
derived ZIP centroid table is safe to use commercially. Row count for the
full national file is ~33k ZIPs (50 states + DC).

Alternatives acceptable for production:

- **SimpleMaps — US ZIPS Basic (CC BY 4.0)** — include attribution.
- Any source whose license permits commercial redistribution; record it in
  the ops journal alongside the load (see the runbook in
  `docs/geo/PRODUCTION_RUNBOOK.md`).

A tiny deterministic fixture lives in `tests/fixtures/zip-centroids.json`
(also useful for a dev smoke-test load of a handful of ZIPs).

## Import & update

```
node scripts/geo/import-zip-centroids.mjs <dataset.json|dataset.csv>
```

- Reads `DATABASE_URL` from `.env` and refuses production targets
  (`assertNotProductionDatabase`).
- Idempotent: `INSERT … ON CONFLICT (zip) DO UPDATE`.
- Accepts JSON arrays (`[{ zip, latitude, longitude, city?, state? }]`) or
  CSVs with any header order (`zip`/`postal_code`, `latitude`/`lat`,
  `longitude`/`lng`/`lon`, optional `city`, `state`).
- ZIP+4 (`30005-1234`) is collapsed to `30005`; malformed or duplicate rows
  are skipped and counted.

### Verification after load

```
SELECT COUNT(*) FROM zip_centroids;                    -- ~33k for the full set
SELECT zip, city, state FROM zip_centroids WHERE zip IN ('30005','30004');
SELECT COUNT(*) FROM zip_centroids WHERE latitude IS NULL OR longitude IS NULL;  -- 0
SELECT zip FROM zip_centroids GROUP BY zip HAVING COUNT(*) > 1;                  -- 0 rows (PK)
```

### Update cycle

Refresh only when a newer authoritative snapshot is needed (typically
yearly, when Census releases new ZCTA geography). Reload is a full
`ON CONFLICT DO UPDATE` re-run of the same import command — no application
downtime, purely additive. Rollback: re-import the previous snapshot.

## Behavior contract

- A professional is radius-eligible **only** with a complete geo record:
  `serviceZip` (contractor) / `serviceZip` + `serviceRadius` (agent),
  a centroid row for that ZIP, and a declared positive radius.
- A visitor ZIP that does **not** resolve to a centroid yields **empty
  results** plus an explicit "we couldn't find that ZIP" message — never a
  silent broadening back to text search.
- Text / city / market search is unchanged and never blocked by GEO; it is
  only *replaced* when the visitor enters a resolvable 5-digit ZIP.