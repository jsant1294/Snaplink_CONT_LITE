import type { PropertyInput } from "./repositories";
import type { PropertyStatus } from "./types";

export interface ValidationResult<T> {
  valid: boolean;
  data?: T;
  errors: Record<string, string>;
}

const STATUSES: PropertyStatus[] = ["draft", "coming_soon", "active", "pending", "sold", "rental", "archived"];
const PROPERTY_TYPES = ["single_family", "townhome", "condo", "multi_family", "land", "commercial", "rental"];

const text = (value: unknown) => String(value ?? "").trim();
const number = (value: unknown) => Number(value);
const list = (value: unknown) => Array.isArray(value) ? value.map(text).filter(Boolean) : text(value).split("\n").map((item) => item.trim()).filter(Boolean);

export function slugifyProperty(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

export function validatePropertyInput(input: unknown, partial = false): ValidationResult<Partial<PropertyInput>> {
  const body = typeof input === "object" && input ? input as Record<string, unknown> : {};
  const errors: Record<string, string> = {};
  const required = (key: string, label: string) => {
    if (!partial && !text(body[key])) errors[key] = `${label} is required`;
  };
  required("title", "Title"); required("slug", "Slug"); required("propertyType", "Property type");
  required("propertyStatus", "Status"); required("address", "Address"); required("city", "City");
  required("state", "State"); required("postalCode", "Postal code"); required("country", "Country");
  required("organizationId", "Organization"); required("brokerageId", "Brokerage"); required("listingAgentId", "Listing agent");

  const title = text(body.title);
  const slug = slugifyProperty(text(body.slug));
  if (body.title !== undefined && (title.length < 3 || title.length > 140)) errors.title = "Title must be between 3 and 140 characters";
  if (body.slug !== undefined && (!slug || slug.length < 3)) errors.slug = "Enter a valid slug";
  if (body.propertyType !== undefined && !PROPERTY_TYPES.includes(text(body.propertyType))) errors.propertyType = "Select a valid property type";
  if (body.propertyStatus !== undefined && !STATUSES.includes(text(body.propertyStatus) as PropertyStatus)) errors.propertyStatus = "Select a valid property status";
  if (body.state !== undefined && (text(body.state).length < 2 || text(body.state).length > 60)) errors.state = "Enter a valid state";
  if (body.postalCode !== undefined && !/^[A-Za-z0-9 -]{3,12}$/.test(text(body.postalCode))) errors.postalCode = "Enter a valid postal code";
  if (body.country !== undefined && !/^[A-Za-z]{2}$/.test(text(body.country))) errors.country = "Use a 2-letter country code";

  for (const [key, label, min, max] of [
    ["price", "Price", 0, 1_000_000_000], ["bedrooms", "Bedrooms", 0, 100],
    ["bathrooms", "Bathrooms", 0, 100], ["squareFeet", "Square footage", 0, 10_000_000],
  ] as const) {
    if (body[key] !== undefined) {
      const value = number(body[key]);
      if (!Number.isFinite(value) || value < min || value > max) errors[key] = `${label} must be between ${min} and ${max}`;
    } else if (!partial) errors[key] = `${label} is required`;
  }
  if (body.yearBuilt !== undefined && text(body.yearBuilt)) {
    const year = number(body.yearBuilt);
    if (!Number.isInteger(year) || year < 1600 || year > new Date().getFullYear() + 2) errors.yearBuilt = "Enter a valid year built";
  }
  if (body.lotSize !== undefined && text(body.lotSize).length > 80) errors.lotSize = "Lot size must be 80 characters or fewer";
  if (body.isPublished === true && text(body.propertyStatus) === "draft") errors.isPublished = "Draft properties cannot be published";

  const data: Partial<PropertyInput> = {};
  const assignText = (key: keyof PropertyInput) => { if (body[key] !== undefined) Object.assign(data, { [key]: text(body[key]) }); };
  ["organizationId", "brokerageId", "listingAgentId", "title", "propertyType", "address", "addressLine2", "city", "state", "postalCode", "country", "lotSize", "shortDescription", "description", "heroImage"].forEach((key) => assignText(key as keyof PropertyInput));
  if (body.slug !== undefined) data.slug = slug;
  if (body.propertyStatus !== undefined) data.propertyStatus = text(body.propertyStatus) as PropertyStatus;
  ["price", "bedrooms", "bathrooms", "squareFeet"].forEach((key) => { if (body[key] !== undefined) Object.assign(data, { [key]: number(body[key]) }); });
  if (body.yearBuilt !== undefined) data.yearBuilt = text(body.yearBuilt) ? number(body.yearBuilt) : undefined;
  if (body.features !== undefined) data.features = list(body.features);
  if (body.amenities !== undefined) data.amenities = list(body.amenities);
  if (body.isPublished !== undefined) data.isPublished = body.isPublished === true;
  return { valid: Object.keys(errors).length === 0, data: Object.keys(errors).length ? undefined : data, errors };
}
