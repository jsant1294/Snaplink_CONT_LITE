// ---------------------------------------------------------------------------
// TRUE GEO v1 — ZIP centroid reference type + index helpers.
// A ZipCentroid is a normalized 5-digit US ZIP mapped to its geographic
// centroid (WGS-84). Loaded from the zip_centroids table (documented local
// dataset, see docs/geo/ZIP_CENTROIDS.md) — never fetched at runtime.
// ---------------------------------------------------------------------------

export interface ZipCentroid {
  zip: string;
  city?: string;
  state?: string;
  latitude: number;
  longitude: number;
}

/** Lookup helper over an in-memory zip→centroid map. */
export function centroidFor(
  map: ReadonlyMap<string, ZipCentroid> | undefined,
  zip: string | null | undefined
): ZipCentroid | undefined {
  if (!map || !zip) return undefined;
  return map.get(zip);
}