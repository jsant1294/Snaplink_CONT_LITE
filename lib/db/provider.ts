// ---------------------------------------------------------------------------
// Provider detection for the database layer.
//
// The application runs against any PostgreSQL that speaks the wire protocol.
// Two transport families are supported behind one seam:
//   - Neon (host ends in *.neon.tech): uses the same standard PG driver as
//     before — node-postgres over the wire protocol with TLS enabled.
//   - local/LAN/standard PostgreSQL (loopback, private ranges, .local/.lan/
//     .internal, single-label hosts): node-postgres without TLS.
// Anything else keeps the previous non-local default (TLS with certificate
// verification disabled), preserving hosted-provider behavior.
// ---------------------------------------------------------------------------

export const NEON_HOST_SUFFIX = ".neon.tech";

/** Lowercased hostname of a connection string; "" when unparseable. */
export function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

/** True when a connection string points at a Neon-managed database. */
export function isNeonUrl(url: string): boolean {
  const host = hostnameOf(url);
  return host.endsWith(NEON_HOST_SUFFIX);
}

/** True when a connection string points at local or LAN PostgreSQL. */
export function isLocalOrLanUrl(url: string): boolean {
  const host = hostnameOf(url);
  if (!host) return false;
  if (host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "[::1]") return true;
  if (host.endsWith(".local") || host.endsWith(".lan") || host.endsWith(".internal")) return true;
  if (!host.includes(".") && !host.includes(":")) return true;
  if (/^127\./.test(host) || /^10\./.test(host) || /^169\.254\./.test(host)) return true;
  if (/^192\.168\./.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return true;
  return false;
}

/** TLS option for a connection string; undefined means no TLS. */
export function sslConfigFor(url: string): { rejectUnauthorized: false } | undefined {
  if (isNeonUrl(url)) return { rejectUnauthorized: false };
  if (isLocalOrLanUrl(url)) return undefined;
  return { rejectUnauthorized: false };
}
