import { Pool } from "pg";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { and, asc, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { realEstateProperties, realEstatePropertyMedia } from "@/lib/db/schema";
import { databaseUrl, sslConfig } from "@/lib/db-url";
import type { Property, PropertyMedia, PropertyStatus } from "./types";

export interface PropertyInput {
  organizationId: string;
  brokerageId: string;
  listingAgentId: string;
  title: string;
  slug: string;
  propertyType: string;
  propertyStatus: PropertyStatus;
  address: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  lotSize?: string;
  yearBuilt?: number;
  shortDescription: string;
  description: string;
  amenities: string[];
  features: string[];
  heroImage?: string;
  isPublished: boolean;
}

export interface PropertyListOptions {
  search?: string;
  status?: PropertyStatus;
  sort?: "title" | "price" | "status" | "updatedAt";
  direction?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface PropertyListResult {
  properties: Property[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PropertyRepository {
  createProperty(input: PropertyInput, tenantId: string): Promise<Property>;
  updateProperty(id: string, tenantId: string, input: Partial<PropertyInput>): Promise<Property | null>;
  archiveProperty(id: string, tenantId: string): Promise<Property | null>;
  publishProperty(id: string, tenantId: string): Promise<Property | null>;
  unpublishProperty(id: string, tenantId: string): Promise<Property | null>;
  deleteProperty(id: string, tenantId: string): Promise<Property | null>;
  listProperties(tenantId: string, options?: PropertyListOptions): Promise<PropertyListResult>;
  listPublishedProperties(tenantId: string, options?: PropertyListOptions): Promise<PropertyListResult>;
  findPropertyBySlug(slug: string, tenantId: string): Promise<Property | null>;
  findPropertyById(id: string, tenantId: string): Promise<Property | null>;
  listByTenant(tenantId: string): Promise<Property[]>;
}

let database: NodePgDatabase | null = null;

export function db(): NodePgDatabase {
  if (!database) {
    if (!databaseUrl) throw new Error("DATABASE_URL is required for Real Estate property persistence");
    database = drizzle(new Pool({ connectionString: databaseUrl, ssl: sslConfig, max: 5 }));
  }
  return database;
}

type PropertyRow = typeof realEstateProperties.$inferSelect;
type MediaRow = typeof realEstatePropertyMedia.$inferSelect;

function mediaFromRow(row: MediaRow): PropertyMedia {
  return {
    id: row.id,
    propertyId: row.propertyId,
    tenantId: row.tenantId,
    mediaType: row.mediaType as PropertyMedia["mediaType"],
    url: row.url,
    filename: row.filename,
    altText: row.altText,
    sortOrder: row.sortOrder,
    isHero: row.isHero,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt ?? undefined,
  };
}

function propertyFromRow(row: PropertyRow, media: MediaRow[] = []): Property {
  const images = media
    .filter((item) => item.mediaType === "image" && !item.deletedAt)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => item.url);
  if (row.heroImage && !images.includes(row.heroImage)) images.unshift(row.heroImage);
  return {
    id: row.id,
    tenantId: row.tenantId,
    organizationId: row.organizationId,
    brokerageId: row.brokerageId,
    agentId: row.listingAgentId,
    title: row.title,
    slug: row.slug,
    status: row.propertyStatus as PropertyStatus,
    published: row.isPublished,
    address: row.addressLine1,
    addressLine2: row.addressLine2 ?? undefined,
    city: row.city,
    state: row.state,
    postalCode: row.postalCode,
    country: row.country,
    price: row.priceCents / 100,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    squareFeet: row.squareFeet,
    lotSize: row.lotSize ?? undefined,
    propertyType: row.propertyType,
    yearBuilt: row.yearBuilt ?? undefined,
    description: row.description,
    shortDescription: row.shortDescription,
    features: row.features,
    amenities: row.amenities,
    showingInstructions: undefined,
    openHouseDates: [],
    imageUrls: images,
    viewCount: 0,
    qrScanCount: 0,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt ?? undefined,
  };
}

async function mediaForProperties(rows: PropertyRow[]): Promise<Map<string, MediaRow[]>> {
  const result = new Map<string, MediaRow[]>();
  if (!rows.length) return result;
  const tenantId = rows[0].tenantId;
  const media = await db().select().from(realEstatePropertyMedia).where(
    and(eq(realEstatePropertyMedia.tenantId, tenantId), isNull(realEstatePropertyMedia.deletedAt))
  );
  const ids = new Set(rows.map((row) => row.id));
  for (const item of media) {
    if (!ids.has(item.propertyId)) continue;
    result.set(item.propertyId, [...(result.get(item.propertyId) ?? []), item]);
  }
  return result;
}

function values(input: Partial<PropertyInput>) {
  return {
    ...(input.organizationId !== undefined && { organizationId: input.organizationId }),
    ...(input.brokerageId !== undefined && { brokerageId: input.brokerageId }),
    ...(input.listingAgentId !== undefined && { listingAgentId: input.listingAgentId }),
    ...(input.title !== undefined && { title: input.title }),
    ...(input.slug !== undefined && { slug: input.slug }),
    ...(input.propertyType !== undefined && { propertyType: input.propertyType }),
    ...(input.propertyStatus !== undefined && { propertyStatus: input.propertyStatus }),
    ...(input.address !== undefined && { addressLine1: input.address }),
    ...(input.addressLine2 !== undefined && { addressLine2: input.addressLine2 || null }),
    ...(input.city !== undefined && { city: input.city }),
    ...(input.state !== undefined && { state: input.state }),
    ...(input.postalCode !== undefined && { postalCode: input.postalCode }),
    ...(input.country !== undefined && { country: input.country }),
    ...(input.price !== undefined && { priceCents: Math.round(input.price * 100) }),
    ...(input.bedrooms !== undefined && { bedrooms: input.bedrooms }),
    ...(input.bathrooms !== undefined && { bathrooms: input.bathrooms }),
    ...(input.squareFeet !== undefined && { squareFeet: input.squareFeet }),
    ...(input.lotSize !== undefined && { lotSize: input.lotSize || null }),
    ...(input.yearBuilt !== undefined && { yearBuilt: input.yearBuilt || null }),
    ...(input.shortDescription !== undefined && { shortDescription: input.shortDescription }),
    ...(input.description !== undefined && { description: input.description }),
    ...(input.amenities !== undefined && { amenities: input.amenities }),
    ...(input.features !== undefined && { features: input.features }),
    ...(input.heroImage !== undefined && { heroImage: input.heroImage || null }),
    ...(input.isPublished !== undefined && {
      isPublished: input.isPublished,
      publishedAt: input.isPublished ? new Date().toISOString() : null,
    }),
  };
}

async function getScoped(id: string, tenantId: string): Promise<Property | null> {
  const rows = await db().select().from(realEstateProperties).where(
    and(eq(realEstateProperties.id, id), eq(realEstateProperties.tenantId, tenantId), isNull(realEstateProperties.deletedAt))
  ).limit(1);
  if (!rows[0]) return null;
  const media = await db().select().from(realEstatePropertyMedia).where(
    and(eq(realEstatePropertyMedia.propertyId, id), eq(realEstatePropertyMedia.tenantId, tenantId), isNull(realEstatePropertyMedia.deletedAt))
  ).orderBy(asc(realEstatePropertyMedia.sortOrder));
  return propertyFromRow(rows[0], media);
}

async function setScoped(id: string, tenantId: string, patch: Record<string, unknown>): Promise<Property | null> {
  await db().update(realEstateProperties).set({ ...patch, updatedAt: new Date().toISOString() }).where(
    and(eq(realEstateProperties.id, id), eq(realEstateProperties.tenantId, tenantId), isNull(realEstateProperties.deletedAt))
  );
  return getScoped(id, tenantId);
}

export const propertyRepository: PropertyRepository = {
  async createProperty(input, tenantId) {
    const id = `rep_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    const rows = await db().insert(realEstateProperties).values({
      id,
      tenantId,
      organizationId: input.organizationId,
      brokerageId: input.brokerageId,
      listingAgentId: input.listingAgentId,
      title: input.title,
      slug: input.slug,
      propertyType: input.propertyType,
      propertyStatus: input.propertyStatus,
      addressLine1: input.address,
      addressLine2: input.addressLine2,
      city: input.city,
      state: input.state,
      postalCode: input.postalCode,
      country: input.country,
      priceCents: Math.round(input.price * 100),
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
      squareFeet: input.squareFeet,
      lotSize: input.lotSize,
      yearBuilt: input.yearBuilt,
      shortDescription: input.shortDescription,
      description: input.description,
      amenities: input.amenities,
      features: input.features,
      heroImage: input.heroImage,
      isPublished: input.isPublished,
      publishedAt: input.isPublished ? new Date().toISOString() : null,
    }).returning();
    return propertyFromRow(rows[0]);
  },
  async updateProperty(id, tenantId, input) {
    return setScoped(id, tenantId, values(input));
  },
  async archiveProperty(id, tenantId) {
    return setScoped(id, tenantId, { propertyStatus: "archived", isPublished: false, publishedAt: null });
  },
  async publishProperty(id, tenantId) {
    const existing = await getScoped(id, tenantId);
    if (!existing || existing.status === "draft" || existing.status === "archived") return null;
    return setScoped(id, tenantId, { isPublished: true, publishedAt: new Date().toISOString() });
  },
  async unpublishProperty(id, tenantId) {
    return setScoped(id, tenantId, { isPublished: false, publishedAt: null });
  },
  async deleteProperty(id, tenantId) {
    const existing = await getScoped(id, tenantId);
    if (!existing) return null;
    const now = new Date().toISOString();
    await db().update(realEstateProperties).set({ deletedAt: now, isPublished: false, updatedAt: now }).where(
      and(eq(realEstateProperties.id, id), eq(realEstateProperties.tenantId, tenantId), isNull(realEstateProperties.deletedAt))
    );
    await db().update(realEstatePropertyMedia).set({ deletedAt: now, updatedAt: now }).where(
      and(eq(realEstatePropertyMedia.propertyId, id), eq(realEstatePropertyMedia.tenantId, tenantId), isNull(realEstatePropertyMedia.deletedAt))
    );
    return { ...existing, deletedAt: now, published: false };
  },
  async listProperties(tenantId, options = {}) {
    const page = Math.max(1, options.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, options.pageSize ?? 12));
    const filters = [
      eq(realEstateProperties.tenantId, tenantId),
      isNull(realEstateProperties.deletedAt),
      ...(options.status ? [eq(realEstateProperties.propertyStatus, options.status)] : []),
      ...(options.search ? [or(
        ilike(realEstateProperties.title, `%${options.search}%`),
        ilike(realEstateProperties.city, `%${options.search}%`),
        ilike(realEstateProperties.addressLine1, `%${options.search}%`)
      )!] : []),
    ];
    const orderColumn = options.sort === "title" ? realEstateProperties.title
      : options.sort === "price" ? realEstateProperties.priceCents
      : options.sort === "status" ? realEstateProperties.propertyStatus
      : realEstateProperties.updatedAt;
    const order = options.direction === "asc" ? asc(orderColumn) : desc(orderColumn);
    const [rows, countRows] = await Promise.all([
      db().select().from(realEstateProperties).where(and(...filters)).orderBy(order).limit(pageSize).offset((page - 1) * pageSize),
      db().select({ count: sql<number>`count(*)::int` }).from(realEstateProperties).where(and(...filters)),
    ]);
    const media = await mediaForProperties(rows);
    return { properties: rows.map((row) => propertyFromRow(row, media.get(row.id))), total: countRows[0]?.count ?? 0, page, pageSize };
  },
  async listPublishedProperties(tenantId, options = {}) {
    const page = Math.max(1, options.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, options.pageSize ?? 12));
    const filters = [
      eq(realEstateProperties.tenantId, tenantId), eq(realEstateProperties.isPublished, true),
      isNull(realEstateProperties.deletedAt),
      ...(options.status ? [eq(realEstateProperties.propertyStatus, options.status)] : []),
      ...(options.search ? [or(ilike(realEstateProperties.title, `%${options.search}%`), ilike(realEstateProperties.city, `%${options.search}%`))!] : []),
    ];
    const [rows, countRows] = await Promise.all([
      db().select().from(realEstateProperties).where(and(...filters)).orderBy(desc(realEstateProperties.publishedAt)).limit(pageSize).offset((page - 1) * pageSize),
      db().select({ count: sql<number>`count(*)::int` }).from(realEstateProperties).where(and(...filters)),
    ]);
    const media = await mediaForProperties(rows);
    return { properties: rows.map((row) => propertyFromRow(row, media.get(row.id))), total: countRows[0]?.count ?? 0, page, pageSize };
  },
  async findPropertyBySlug(slug, tenantId) {
    const rows = await db().select().from(realEstateProperties).where(
      and(eq(realEstateProperties.slug, slug), eq(realEstateProperties.tenantId, tenantId), eq(realEstateProperties.isPublished, true), isNull(realEstateProperties.deletedAt))
    ).limit(1);
    return rows[0] ? getScoped(rows[0].id, tenantId) : null;
  },
  findPropertyById: getScoped,
  async listByTenant(tenantId) {
    return (await this.listProperties(tenantId, { pageSize: 100 })).properties;
  },
};

export interface PropertyMediaRepository {
  list(propertyId: string, tenantId: string): Promise<PropertyMedia[]>;
  add(propertyId: string, tenantId: string, input: { url: string; filename: string; altText?: string; isHero?: boolean }): Promise<PropertyMedia>;
  reorder(propertyId: string, tenantId: string, ids: string[]): Promise<PropertyMedia[]>;
  replace(id: string, propertyId: string, tenantId: string, input: { url: string; filename: string }): Promise<PropertyMedia | null>;
  remove(id: string, propertyId: string, tenantId: string): Promise<boolean>;
}

export const propertyMediaRepository: PropertyMediaRepository = {
  async list(propertyId, tenantId) {
    const property = await getScoped(propertyId, tenantId);
    if (!property) return [];
    const rows = await db().select().from(realEstatePropertyMedia).where(and(eq(realEstatePropertyMedia.propertyId, propertyId), eq(realEstatePropertyMedia.tenantId, tenantId), isNull(realEstatePropertyMedia.deletedAt))).orderBy(asc(realEstatePropertyMedia.sortOrder));
    return rows.map(mediaFromRow);
  },
  async add(propertyId, tenantId, input) {
    if (!await getScoped(propertyId, tenantId)) throw new Error("Property not found");
    const existing = await this.list(propertyId, tenantId);
    const id = `rem_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    if (input.isHero) await db().update(realEstatePropertyMedia).set({ isHero: false }).where(and(eq(realEstatePropertyMedia.propertyId, propertyId), eq(realEstatePropertyMedia.tenantId, tenantId)));
    const rows = await db().insert(realEstatePropertyMedia).values({ id, propertyId, tenantId, mediaType: "image", url: input.url, filename: input.filename, altText: input.altText ?? "", sortOrder: existing.length, isHero: input.isHero ?? existing.length === 0 }).returning();
    if (rows[0].isHero) await setScoped(propertyId, tenantId, { heroImage: rows[0].url });
    return mediaFromRow(rows[0]);
  },
  async reorder(propertyId, tenantId, ids) {
    if (!await getScoped(propertyId, tenantId)) return [];
    await Promise.all(ids.map((id, sortOrder) => db().update(realEstatePropertyMedia).set({ sortOrder, updatedAt: new Date().toISOString() }).where(and(eq(realEstatePropertyMedia.id, id), eq(realEstatePropertyMedia.propertyId, propertyId), eq(realEstatePropertyMedia.tenantId, tenantId), isNull(realEstatePropertyMedia.deletedAt)))));
    return this.list(propertyId, tenantId);
  },
  async replace(id, propertyId, tenantId, input) {
    if (!await getScoped(propertyId, tenantId)) return null;
    const rows = await db().update(realEstatePropertyMedia).set({ url: input.url, filename: input.filename, updatedAt: new Date().toISOString() }).where(and(eq(realEstatePropertyMedia.id, id), eq(realEstatePropertyMedia.propertyId, propertyId), eq(realEstatePropertyMedia.tenantId, tenantId), isNull(realEstatePropertyMedia.deletedAt))).returning();
    if (!rows[0]) return null;
    if (rows[0].isHero) await setScoped(propertyId, tenantId, { heroImage: input.url });
    return mediaFromRow(rows[0]);
  },
  async remove(id, propertyId, tenantId) {
    if (!await getScoped(propertyId, tenantId)) return false;
    const rows = await db().update(realEstatePropertyMedia).set({ deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }).where(and(eq(realEstatePropertyMedia.id, id), eq(realEstatePropertyMedia.propertyId, propertyId), eq(realEstatePropertyMedia.tenantId, tenantId), isNull(realEstatePropertyMedia.deletedAt))).returning();
    if (rows[0]?.isHero) {
      const remaining = await this.list(propertyId, tenantId);
      const next = remaining[0];
      if (next) {
        await db().update(realEstatePropertyMedia).set({ isHero: true, updatedAt: new Date().toISOString() }).where(and(eq(realEstatePropertyMedia.id, next.id), eq(realEstatePropertyMedia.tenantId, tenantId)));
      }
      await setScoped(propertyId, tenantId, { heroImage: next?.url ?? null });
    }
    return Boolean(rows[0]);
  },
};
