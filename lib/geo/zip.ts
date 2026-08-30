// ---------------------------------------------------------------------------
// TRUE GEO v1 — pure, UI-independent ZIP + geodesic helpers.
// No PostGIS, no external geocoder, no network: ZIP normalization/validation
// and a deterministic Haversine distance. Search eligibility ("is ZIP X within
// radius R of ZIP Y") composes these with the locally-loaded zip_centroids
// table (lib/geo/zip-centroids.ts).
// ---------------------------------------------------------------------------

const US_ZIP_5 = /^\d{5}$/;

/** Trim + collapse ZIP+4 to the 5-digit ZIP. Empty/whitespace → "". */
export function normalizeZip(value: string | null | undefined): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (trimmed.length === 10 && trimmed[5] === "-") return trimmed.slice(0, 5);
  return trimmed;
}

/** True for an exact 5-digit US ZIP after normalization. */
export function isUsZip(value: string | null | undefined): boolean {
  return US_ZIP_5.test(normalizeZip(value));
}

const EARTH_RADIUS_MILES = 3958.7613;
const DEG2RAD = Math.PI / 180;

function toRad(deg: number): number {
  return deg * DEG2RAD;
}

/**
 * Great-circle distance in statute miles between two WGS-84 lat/lng pairs.
 * Pure, deterministic, UI-independent.
 */
export function haversineMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const dPhi = toRad(lat2 - lat1);
  const dLambda = toRad(lng2 - lng1);

  const a =
    Math.sin(dPhi / 2) * Math.sin(dPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) * Math.sin(dLambda / 2);

  return 2 * EARTH_RADIUS_MILES * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}