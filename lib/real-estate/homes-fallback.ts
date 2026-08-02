// Read-only presentation-layer fallback: when the live real-estate database
// has no published inventory for a tenant yet, fall back to the curated
// demoProperties fixtures instead of rendering an empty listing area.
// Never writes to the database — purely a display-time substitution. Remove
// once real inventory reliably exists for every consuming tenant.
import { propertyRepository, type PropertyListOptions, type PropertyListResult } from "./repositories";
import { demoProperties, demoRentals, demoTenant } from "./fixtures";
import type { Property } from "./types";

function matchesSearch(property: Property, search: string): boolean {
  const q = search.toLowerCase();
  return (
    property.title.toLowerCase().includes(q) ||
    property.city.toLowerCase().includes(q) ||
    property.address.toLowerCase().includes(q)
  );
}

export async function listPublishedPropertiesWithFallback(
  tenantId: string,
  options: PropertyListOptions = {}
): Promise<PropertyListResult> {
  const result = await propertyRepository.listPublishedProperties(tenantId, options);
  if (result.properties.length > 0) return result;
  if (tenantId !== demoTenant.id) return result;

  const filtered = options.search ? demoProperties.filter((p) => matchesSearch(p, options.search!)) : demoProperties;
  return { properties: filtered, total: filtered.length, page: 1, pageSize: filtered.length || 1 };
}

export async function findPropertyBySlugWithFallback(slug: string, tenantId: string): Promise<Property | null> {
  const real = await propertyRepository.findPropertyBySlug(slug, tenantId);
  if (real) return real;
  if (tenantId !== demoTenant.id) return null;
  return demoProperties.find((p) => p.slug === slug) ?? null;
}

// Rentals & Getaways slice: same display-time substitution as above, scoped to
// `status: "rental"` inventory for the `/rentals` landing page. Falls back to
// the curated demoRentals fixtures when the tenant has no published rentals.
export async function listPublishedRentalsWithFallback(
  tenantId: string,
  options: PropertyListOptions = {}
): Promise<PropertyListResult> {
  const result = await propertyRepository.listPublishedProperties(tenantId, { ...options, status: "rental" });
  if (result.properties.length > 0) return result;
  if (tenantId !== demoTenant.id) return result;

  const filtered = options.search ? demoRentals.filter((p) => matchesSearch(p, options.search!)) : demoRentals;
  return { properties: filtered, total: filtered.length, page: 1, pageSize: filtered.length || 1 };
}

export async function resolveFeaturedPropertyWithFallback(
  tenantId: string,
  featuredPropertyId: string | null
): Promise<Property | null> {
  if (featuredPropertyId) {
    const byId = await propertyRepository.findPropertyById(featuredPropertyId, tenantId).catch(() => null);
    if (byId) return byId;
  }
  const result = await listPublishedPropertiesWithFallback(tenantId, { pageSize: 1 });
  return result.properties[0] ?? null;
}
