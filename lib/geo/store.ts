// ---------------------------------------------------------------------------
// TRUE GEO v1 — store driver switch for the zip_centroids reference table.
// DATABASE_URL set → Postgres; otherwise local JSON in .data/. Callers (the
// /results page and the /api/southline/search route) resolve the visitor ZIP
// to a centroid here and pass the result into lib/southline-search.ts.
// ---------------------------------------------------------------------------

import { usePg } from "../db-url";
import { pgZipCentroidStore } from "./store-pg";
import { jsonZipCentroidStore } from "./store-json";

export const zipCentroidStore = usePg ? pgZipCentroidStore : jsonZipCentroidStore;
export { pgZipCentroidStore, jsonZipCentroidStore };