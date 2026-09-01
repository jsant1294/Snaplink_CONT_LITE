import { unstable_cache } from "next/cache";
import { southlineStore } from "./southline-store";
import { contractorStore } from "./store";
import { agentProfileStore } from "./agent-profiles/store";
import { PUBLIC_CATALOG_TAGS } from "./public-catalog-invalidate";
import {
  listPublishedPropertiesWithFallback,
  listPublishedRentalsWithFallback,
  resolveFeaturedPropertyWithFallback,
} from "./real-estate/homes-fallback";
import type { Contractor } from "./types";
import type { AgentProfile } from "./agent-profiles/types";

// ---------------------------------------------------------------------------
// Homepage public-catalog data caching.
//
// The homepage is force-dynamic but most of its data only changes occasionally.
// These wrappers cache the RESULTS of the underlying DB queries in Next's data
// cache for REVALIDATE_SECONDS, so a request storm doesn't hammer Neon for the
// same mostly-static catalog on every page load.
//
// SAFETY: only public catalog data is cached here. Lifecycle eligibility is
// ALWAYS enforced inside the underlying queries themselves (listPublished() /
// listPublicActive() push is_demo=false + status gates into SQL), so a cached
// entry can never expose unpublished or demo professionals — the gate runs at
// first computation, before the result is cached. User-specific / operator /
// private data is never passed through these wrappers.
//
// INVALIDATION: each entry is tagged (see PUBLIC_CATALOG_TAGS below). When a
// professional's public eligibility changes (unpublish, suspend, publish,
// ready/draft/onboarding, demo, agent southlineStatus/isDemo), the store
// mutation layer triggers invalidateContractorCatalog() / invalidateAgentCatalog()
// (lib/public-catalog-invalidate.ts) which purge ONLY the matching tag via
// revalidateTag — so a newly published professional appears immediately and an
// unpublished/suspended one is removed immediately, without a 5-minute stale
// window and without invalidating the whole application cache.
//
// NOTE: these cache wrappers use the React server cache keyed on serialized
// args. On non-Next runtimes (plain `node --test`) importing this module is
// inert; the homepage route is the only consumer.
// ---------------------------------------------------------------------------

const REVALIDATE_SECONDS = 300;

export const getCachedSettings = () =>
  unstable_cache(async () => southlineStore.getSettings(), ["public-settings"], {
    revalidate: REVALIDATE_SECONDS,
    tags: ["public-settings"],
  });

export const getCachedPublishedContractors = () =>
  unstable_cache(
    async (): Promise<Contractor[]> => contractorStore.listPublished(),
    ["public-contractors"],
    { revalidate: REVALIDATE_SECONDS, tags: [PUBLIC_CATALOG_TAGS.contractors] }
  );

export const getCachedPublicAgents = () =>
  unstable_cache(
    async (): Promise<AgentProfile[]> => agentProfileStore.listActive(),
    ["public-agents"],
    { revalidate: REVALIDATE_SECONDS, tags: [PUBLIC_CATALOG_TAGS.agents] }
  );

export const getCachedFeaturedProperty = () =>
  unstable_cache(
    async (token: string, featuredPropertyId: string | null) =>
      resolveFeaturedPropertyWithFallback(token, featuredPropertyId),
    ["public-featured-property"],
    { revalidate: REVALIDATE_SECONDS, tags: ["public-featured-property"] }
  );

export const getCachedPublishedHomes = () =>
  unstable_cache(
    async (token: string, pageSize: number) =>
      listPublishedPropertiesWithFallback(token, { pageSize }),
    ["public-homes"],
    { revalidate: REVALIDATE_SECONDS, tags: ["public-homes"] }
  );

export const getCachedPublishedRentals = () =>
  unstable_cache(
    async (token: string, pageSize: number) =>
      listPublishedRentalsWithFallback(token, { pageSize }),
    ["public-rentals"],
    { revalidate: REVALIDATE_SECONDS, tags: ["public-rentals"] }
  );
