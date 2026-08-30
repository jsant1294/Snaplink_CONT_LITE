# TRUE GEO v1 — US ZIP/ZCTA centroid dataset (zip_centroids)

Reference data for real geographic radius search. No PostGIS, no external
geocoder, no runtime network lookups: the app ships with a locally loaded
table that maps a normalized 5-digit US ZIP to its centroid, and computes
Haversine (straight-line) distances in code.

## What is stored

| column     | type            | meaning                                              |
| ---------- | --------------- | ---------------------------------------------------- |
| `zip`      | text (PK)       | normalized 5-digit US ZIP / ZCTA                     |
| `city`     | text · nullable  | primary place name (informational, not used for match) |
| `state`    | text · nullable  | two-letter state (informational / runbook checks)     |
| `latitude` | numeric(10,6)   | ZIP centroid latitude (WGS-84)                       |
| `longitude`| numeric(10,6)   | ZIP centroid longitude (WGS-84)                      |

## Dataset source & license — US Census 2025 ZCTA5 Gazetteer (PRIMARY)

**Recommended and documented production source:**

- **File:** `2025_Gaz_zcta_national.txt` (inside `2025_Gaz_zcta_national.zip`)
  from the US Census Bureau Gazetteer files page:
  `https://www.census.gov/geographies/reference-files/time-series/geo/gazetteer-files.html`
  (data served from `www2.census.gov/geo/docs/maps-data/data/gazetteer/`).
- **License:** **US government public-domain data** (17 U.S.C. § 105). No
  attribution or share-alike obligations.
- **Records:** the national file carries **33,791 ZCTA5 records** (≈33.8k) for
  the 50 states, DC, Puerto Rico, and other territories.
- **Fields used:** `GEOID` (the 5-digit ZCTA), `INTPTLAT`, `INTPTLONG` (the
  Census *internal point* of the ZCTA, used as the centroid proxy).

### What ZCTA means — honest limits

- ZCTAs are **Census Bureau ZIP Code Tabulation Areas**: area approximations of
  USPS ZIP codes built from blocks, **not an identical 1:1 mapping to every
  USPS deliverable ZIP**. New/retired/PO-Box-only ZIPs may be missing or
  differ from the USPS official list.
- Distances are **straight-line (great-circle) distances ZIP-centroid to
  ZIP-centroid** — **not** driving distance, road travel time, or GPS
  precision.
- **Marketing must not claim "every US ZIP code is supported."** Truthful
  framing: coverage is "US Census ZCTA areas"; a professional's declared
  service radius meters straight-line centroid distance.

Previously documented sources (kept for reference, NOT the production default):

- **free-zipcode-database.csv** (CivicSpace Labs) — compiled from US Census
  ZCTA gazetteers/TIGER data, but the *compiled database* is licensed **CC
  BY-SA 2.0** (not clean public domain) and is a 2004-era snapshot of ~43k
  records. Usable with attribution under BY-SA, but the Census gazetteer above
  removes the license ambiguity.
- **SimpleMaps — US ZIPS Basic (CC BY 4.0)** — acceptable with attribution.

## Import & update

### Step 1 — Prepare (offline transform)

```
node scripts/geo/prepare-census-zcta.mjs \
  --input  2025_Gaz_zcta_national.txt \
  --output /tmp/zip-centroids.csv
```

- Reads the Census pipe-delimited file (`GEOID | ... | INTPTLAT | INTPTLONG`),
  never needs a network connection once the file is on disk.
- Normalizes `GEOID` to the 5-digit ZIP/ZCTA, validates coordinates, rejects
  malformed rows, rejects duplicate GEOIDs, and writes a deterministic
  `zip,latitude,longitude` CSV.
- Prints input / valid-unique / malformed / duplicate / territory counts.

### Step 2 — Dry-run (no writes)

```
node scripts/geo/import-zip-centroids.mjs --file /tmp/zip-centroids.csv --dry-run
```

Reports would-insert / would-update / rejected / duplicated against the target
in `DATABASE_URL` (from `.env`), performs no writes.

### Step 3 — Apply

- **Non-production target (default):** a plain `--file` run imports idempotently
  (`INSERT … ON CONFLICT (zip) DO UPDATE`), rejecting malformed rows and
  keeping the first occurrence of a duplicate ZIP.
- **Production target:** refused by default. Requires **both**
  `ALLOW_PRODUCTION_DB=yes` **and** `--confirm-production-import`:

```
ALLOW_PRODUCTION_DB=yes node scripts/geo/import-zip-centroids.mjs \
  --file /tmp/zip-centroids.csv \
  --confirm-production-import
```

The script prints a **host fingerprint only** (never credentials) and, in
production mode, a double-confirmation warning before any connection.

### Verification after load

```
SELECT COUNT(*) FROM zip_centroids;                    -- 33,791 for the full 2025 file
SELECT zip, city, state FROM zip_centroids WHERE zip IN ('30005','30004');
SELECT COUNT(*) FROM zip_centroids WHERE latitude IS NULL OR longitude IS NULL;  -- 0
SELECT zip FROM zip_centroids GROUP BY zip HAVING COUNT(*) > 1;                  -- 0 rows (PK)
```

### Update cycle

Refresh yearly when Census releases a new ZCTA gazetteer (2025 is current).
Reload is a full `ON CONFLICT DO UPDATE` re-run of the same import command — no
application downtime, purely additive. Rollback: re-import the previous file.

## Behavior contract

- A professional is radius-eligible **only** with a complete geo record:
  `serviceZip` (contractor) / `serviceZip` + `serviceRadius` (agent),
  a centroid row for that ZIP, and a declared positive radius.
- A visitor ZIP that does **not** resolve to a centroid yields **empty
  results** plus an explicit "we couldn't find that ZIP" message — never a
  silent broadening back to text search.
- Text / city / market search is unchanged and never blocked by GEO; it is
  only *replaced* when the visitor enters a resolvable 5-digit ZIP.
- Distance shown is straight-line centroid distance (e.g. Census-reference
  ZCTA internal points give **30005 → 30004 ≈ 5.8 miles**), not driving
  distance.