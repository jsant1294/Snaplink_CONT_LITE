import type { CrmRecord, CrmResource } from "./crm-repositories";

const allowed: Record<CrmResource, string[]> = {
  brokerages: ["organizationId", "name", "logoUrl", "description", "addressLine1", "addressLine2", "city", "state", "postalCode", "country", "phone", "email", "website", "brandColor", "serviceAreas", "socialLinks", "isArchived"],
  agents: ["organizationId", "brokerageId", "firstName", "lastName", "email", "phone", "photoUrl", "biography", "licenseNumber", "licenseState", "specialties", "serviceAreas", "languages", "certifications", "isActive"],
  buyers: ["assignedAgentId", "name", "email", "phone", "budgetMinCents", "budgetMaxCents", "preferredCities", "bedrooms", "bathrooms", "propertyTypes", "financingStatus", "pipelineStage", "notes"],
  sellers: ["assignedAgentId", "ownerName", "email", "phone", "propertyAddress", "timeline", "askingExpectationCents", "repairs", "mortgageEstimateCents", "pipelineStage", "notes"],
  leads: ["assignedAgentId", "buyerId", "sellerId", "leadType", "stage", "name", "email", "phone", "source", "notes"],
  showings: ["propertyId", "buyerId", "assignedAgentId", "requestedAt", "status", "isApproved", "notes"],
  "open-houses": ["propertyId", "assignedAgentId", "startsAt", "endsAt", "attendeeCount", "isPublished", "notes"],
  tasks: ["assignedAgentId", "title", "dueAt", "status"],
};

const required: Record<CrmResource, string[]> = {
  brokerages: ["organizationId", "name"],
  agents: ["organizationId", "brokerageId", "firstName", "lastName", "email"],
  buyers: ["name"],
  sellers: ["ownerName", "propertyAddress"],
  leads: ["name", "leadType", "stage"],
  showings: ["propertyId", "assignedAgentId", "requestedAt"],
  "open-houses": ["propertyId", "assignedAgentId", "startsAt", "endsAt"],
  tasks: ["title"],
};

export function validateCrmInput(resource: CrmResource, body: unknown, partial = false) {
  const input = typeof body === "object" && body ? body as Record<string, unknown> : {};
  const errors: Record<string, string> = {};
  if (!partial) for (const key of required[resource]) {
    if (input[key] === undefined || String(input[key]).trim() === "") errors[key] = `${key} is required`;
  }
  if (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(input.email))) errors.email = "Enter a valid email";
  if (resource === "open-houses" && input.startsAt && input.endsAt && new Date(String(input.endsAt)) <= new Date(String(input.startsAt))) errors.endsAt = "End time must be after start time";
  const data: CrmRecord = {};
  for (const key of allowed[resource]) {
    const value = input[key];
    if (value === undefined) continue;
    if (["budgetMinCents", "budgetMaxCents", "askingExpectationCents", "mortgageEstimateCents", "attendeeCount", "bedrooms", "bathrooms"].includes(key)) data[key] = value === "" || value === null ? null : Number(value);
    else if (["isArchived", "isActive", "isApproved", "isPublished"].includes(key)) data[key] = value === true;
    else if (["serviceAreas", "specialties", "languages", "certifications", "preferredCities", "propertyTypes"].includes(key)) data[key] = Array.isArray(value) ? value.map(String).filter(Boolean) : String(value).split(",").map((item) => item.trim()).filter(Boolean);
    else if (key === "socialLinks") {
      if (typeof value === "object" && value) data[key] = value as Record<string, string>;
      else {
        try { data[key] = JSON.parse(String(value)) as Record<string, string>; }
        catch { errors.socialLinks = "Social links must be valid JSON"; }
      }
    }
    else data[key] = value === null ? null : String(value).trim();
  }
  return { valid: Object.keys(errors).length === 0, errors, data };
}
