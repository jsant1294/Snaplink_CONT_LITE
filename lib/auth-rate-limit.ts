// ---------------------------------------------------------------------------
// Emergency in-memory auth rate limiter (PATCH 1).
//
// DELIBERATE SCOPE: this is a server-instance-local, process-memory limiter.
// It does NOT survive restarts, is not shared across serverless instances, and
// is NOT a substitute for a distributed (Redis/PG) limiter. It is deployed only
// as the safest schema-free mitigation for PATCH 1. Replace with a shared,
// persisted limiter (or a proper auth/session layer) in PATCH 2.
//
// Policy: an IP may accumulate up to MAX_FAILED failed auth attempts within a
// WINDOW_MS sliding window. Once the window is exhausted it must wait for the
// oldest attempt to age out (retry-after in seconds). A SUCCESSFUL auth resets
// the failure count for that IP on the next request.
//
// No PIN values are ever stored or logged here.
// ---------------------------------------------------------------------------

export const AUTH_MAX_FAILED = 10;
export const AUTH_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const AUTH_WINDOW_SECONDS = Math.floor(AUTH_WINDOW_MS / 1000);

interface AttemptWindow {
  /** Timestamps (ms) of recent FAILED attempts. */
  failures: number[];
}

const buckets = new Map<string, AttemptWindow>();

function prune(window: AttemptWindow, now: number): AttemptWindow {
  window.failures = window.failures.filter((t) => now - t < AUTH_WINDOW_MS);
  return window;
}

/** Returns the number of seconds until the IP may retry, or 0 when not limited. */
export function authRetryAfterSeconds(key: string): number {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket) return 0;
  const failures = prune(bucket, now).failures;
  if (failures.length < AUTH_MAX_FAILED) return 0;
  const oldest = failures[0];
  return Math.max(1, Math.ceil((oldest + AUTH_WINDOW_MS - now) / 1000));
}

export function isAuthRateLimited(key: string): boolean {
  return authRetryAfterSeconds(key) > 0;
}

/** Record a FAILED auth attempt for an IP. Returns true iff now limited. */
export function recordAuthFailure(key: string): boolean {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { failures: [] };
  prune(bucket, now);
  bucket.failures.push(now);
  buckets.set(key, bucket);
  return bucket.failures.length >= AUTH_MAX_FAILED;
}

/** Clears a prior failure record (called on the request after a successful auth). */
export function clearAuthFailures(key: string): void {
  buckets.delete(key);
}

/** Best-effort client IP from common proxy headers (used only for rate limiting). */
export function clientIpFromRequest(req: {
  headers: { get(name: string): string | null };
}): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip");
  return real?.trim() || "unknown";
}
