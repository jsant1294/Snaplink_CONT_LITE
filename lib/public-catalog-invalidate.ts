// ---------------------------------------------------------------------------
// Public catalog cache invalidation.
//
// lib/public-cache.ts caches the published/public professional catalog (and
// other homepage data) in Next's data cache for a few minutes. The label for a
// professional's PUBLIC ELIGIBILITY is enforced in SQL when the cache entry is
// first computed, so a cached entry never exposes an ineligible professional.
// But a professional who is LATER unpublished / suspended / made demo / hidden
// could stay in an existing cache entry until the TTL expires — that stale
// window is a lifecycle-safety violation.
//
// This module is the single, tag-targeted invalidation point for that stored
// public catalog. It:
//   • exposes the exact tags lib/public-cache.ts tags its entries with, so the
//     cache and its invalidators can never drift apart;
//   • provides invalidateContractorCatalog() / invalidateAgentCatalog() which
//     purge ONLY the matching tag (never whole-application cache);
//   • is safe to import from the store layer in plain `node --test` runs
//     (no static `next/*` import; `revalidateTag` is loaded lazily and only
//     invoked inside a Next runtime), while still surfacing failures inside
//     Next so a lifecycle mutation can never silently report success with a
//     cache purge that was actually dropped.
// ---------------------------------------------------------------------------

const IN_NEXT_RUNTIME =
  process.env.NEXT_RUNTIME === "nodejs" || process.env.NEXT_RUNTIME === "edge";

/** Tag names used by lib/public-cache.ts and matched by the invalidators below. */
export const PUBLIC_CATALOG_TAGS = {
  /** Cached contractor catalog (homepage + public discovery via listPublished). */
  contractors: "public-contractors",
  /** Cached agent/public catalog (homepage + public discovery via listActive/listPublicActive). */
  agents: "public-agents",
} as const;

export type PublicCatalogTag = (typeof PUBLIC_CATALOG_TAGS)[keyof typeof PUBLIC_CATALOG_TAGS];

async function purgeTag(tag: PublicCatalogTag): Promise<void> {
  const { revalidateTag } = await import("next/cache.js");
  revalidateTag(tag);
}

/** Purge the cached public contractor catalog after an eligibility mutation. */
export async function invalidateContractorCatalog(): Promise<void> {
  if (!IN_NEXT_RUNTIME) return; // plain node (tests/scripts): no request cache to purge
  await purgeTag(PUBLIC_CATALOG_TAGS.contractors); // throws -> surfaces as mutation failure (no false success)
}

/** Purge the cached public agent catalog after an eligibility mutation. */
export async function invalidateAgentCatalog(): Promise<void> {
  if (!IN_NEXT_RUNTIME) return;
  await purgeTag(PUBLIC_CATALOG_TAGS.agents); // throws -> surfaces as mutation failure
}

// ---------------------------------------------------------------------------
// Pure decision helpers. Kept as exported functions so deterministic tests can
// assert exactly which mutations the stores will invalidate on, without needing
// a live Next request scope.
// ---------------------------------------------------------------------------

/**
 * True when a contractor update patch can change public eligibility. A
 * contractor is public iff status=published && !isDemo; the only lifecycle
 * field reachable through contractorStore.update is `status` (contractor demo
 * flags are creation-time only). Updated with a `status` field => the catalog
 * predicate may flip, so the cache must be purged regardless of direction
 * (publish, unpublish, suspend, ready/draft/onboarding, republish).
 */
export function shouldInvalidateContractorUpdate(patch: object): boolean {
  return "status" in patch;
}

/**
 * True when an agent patch can change public eligibility. The homepage cache
 * serves active, non-demo agents; the agents page / public discovery also
 * requires southlineStatus ∈ {published, featured}. Any change to `status`,
 * `southlineStatus`, or `isDemo` can flip one of those gates, so the agent
 * catalog must be purged on any such mutation.
 */
export function shouldInvalidateAgentUpdate(patch: object): boolean {
  return ["status", "southlineStatus", "isDemo"].some((field) => field in patch);
}

/**
 * True when a newly created agent is immediately publicly eligible and so must
 * invalidate the agent catalog (otherwise it would stay hidden until TTL).
 * Mirrors the homepage cache predicate: status=active && !isDemo.
 */
export function shouldInvalidateAgentCreate(created: { status?: string; isDemo?: boolean }): boolean {
  return created.status === "active" && created.isDemo !== true;
}
