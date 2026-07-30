import type { CrmResource } from "./crm-repositories";

export interface CrmField {
  key: string;
  label: string;
  type?: "text" | "email" | "number" | "textarea" | "datetime-local" | "checkbox" | "select" | "image";
  options?: { value: string; label: string }[];
  required?: boolean;
}

const stages = ["new", "contacted", "qualified", "appointment_scheduled", "showing_scheduled", "active", "under_contract", "closed", "lost"].map((value) => ({ value, label: value.replaceAll("_", " ") }));

export const CRM_CONFIG: Record<CrmResource, { title: string; singular: string; fields: CrmField[]; columns: string[] }> = {
  brokerages: { title: "Brokerages", singular: "Brokerage", columns: ["name", "city", "phone", "website"], fields: [
    { key: "organizationId", label: "Organization ID", required: true }, { key: "name", label: "Office name", required: true },
    { key: "logoUrl", label: "Logo", type: "image" }, { key: "description", label: "Description", type: "textarea" },
    { key: "addressLine1", label: "Office address" }, { key: "addressLine2", label: "Address line 2" },
    { key: "city", label: "City" }, { key: "state", label: "State" }, { key: "postalCode", label: "Postal code" },
    { key: "country", label: "Country" }, { key: "phone", label: "Phone" }, { key: "email", label: "Email", type: "email" },
    { key: "website", label: "Website" }, { key: "brandColor", label: "Brand color" },
    { key: "serviceAreas", label: "Service areas (comma separated)", type: "textarea" },
    { key: "socialLinks", label: "Social links (JSON)", type: "textarea" },
  ]},
  agents: { title: "Agents", singular: "Agent", columns: ["firstName", "lastName", "email", "licenseNumber", "isActive"], fields: [
    { key: "organizationId", label: "Organization ID", required: true }, { key: "brokerageId", label: "Brokerage ID", required: true },
    { key: "firstName", label: "First name", required: true }, { key: "lastName", label: "Last name", required: true },
    { key: "email", label: "Email", type: "email", required: true }, { key: "phone", label: "Phone" },
    { key: "photoUrl", label: "Profile photo", type: "image" }, { key: "biography", label: "Biography", type: "textarea" },
    { key: "licenseNumber", label: "License number" }, { key: "licenseState", label: "License state" },
    { key: "specialties", label: "Specialties", type: "textarea" }, { key: "serviceAreas", label: "Service areas", type: "textarea" },
    { key: "languages", label: "Languages", type: "textarea" }, { key: "certifications", label: "Certifications", type: "textarea" },
    { key: "isActive", label: "Active", type: "checkbox" },
  ]},
  buyers: { title: "Buyer CRM", singular: "Buyer", columns: ["name", "email", "budgetMinCents", "budgetMaxCents", "pipelineStage"], fields: [
    { key: "name", label: "Name", required: true }, { key: "email", label: "Email", type: "email" }, { key: "phone", label: "Phone" },
    { key: "budgetMinCents", label: "Minimum budget (cents)", type: "number" }, { key: "budgetMaxCents", label: "Maximum budget (cents)", type: "number" },
    { key: "preferredCities", label: "Preferred cities", type: "textarea" }, { key: "bedrooms", label: "Bedrooms", type: "number" },
    { key: "bathrooms", label: "Bathrooms", type: "number" }, { key: "propertyTypes", label: "Property types", type: "textarea" },
    { key: "financingStatus", label: "Financing status" }, { key: "assignedAgentId", label: "Assigned agent ID" },
    { key: "pipelineStage", label: "Pipeline stage", type: "select", options: stages }, { key: "notes", label: "Notes", type: "textarea" },
  ]},
  sellers: { title: "Seller CRM", singular: "Seller", columns: ["ownerName", "propertyAddress", "timeline", "pipelineStage"], fields: [
    { key: "ownerName", label: "Owner name", required: true }, { key: "email", label: "Email", type: "email" }, { key: "phone", label: "Phone" },
    { key: "propertyAddress", label: "Property address", required: true }, { key: "timeline", label: "Timeline" },
    { key: "askingExpectationCents", label: "Asking expectation (cents)", type: "number" }, { key: "mortgageEstimateCents", label: "Mortgage estimate (cents)", type: "number" },
    { key: "repairs", label: "Repairs needed", type: "textarea" }, { key: "assignedAgentId", label: "Assigned agent ID" },
    { key: "pipelineStage", label: "Pipeline stage", type: "select", options: stages }, { key: "notes", label: "Notes", type: "textarea" },
  ]},
  leads: { title: "Lead Pipeline", singular: "Lead", columns: ["name", "leadType", "stage", "source", "assignedAgentId"], fields: [
    { key: "name", label: "Name", required: true }, { key: "leadType", label: "Lead type", type: "select", required: true, options: [{ value: "buyer", label: "Buyer" }, { value: "seller", label: "Seller" }, { value: "general", label: "General inquiry" }] },
    { key: "stage", label: "Stage", type: "select", required: true, options: stages }, { key: "email", label: "Email", type: "email" }, { key: "phone", label: "Phone" },
    { key: "source", label: "Source" }, { key: "assignedAgentId", label: "Assigned agent ID" }, { key: "notes", label: "Notes", type: "textarea" },
  ]},
  showings: { title: "Showing Requests", singular: "Showing", columns: ["propertyId", "buyerId", "requestedAt", "status", "isApproved"], fields: [
    { key: "propertyId", label: "Property ID", required: true }, { key: "buyerId", label: "Buyer ID" }, { key: "assignedAgentId", label: "Assigned agent ID", required: true },
    { key: "requestedAt", label: "Requested date", type: "datetime-local", required: true }, { key: "status", label: "Status", type: "select", options: ["requested", "approved", "completed", "cancelled"].map((value) => ({ value, label: value })) },
    { key: "isApproved", label: "Approved", type: "checkbox" }, { key: "notes", label: "Notes", type: "textarea" },
  ]},
  "open-houses": { title: "Open Houses", singular: "Open House", columns: ["propertyId", "startsAt", "endsAt", "attendeeCount", "isPublished"], fields: [
    { key: "propertyId", label: "Property ID", required: true }, { key: "assignedAgentId", label: "Assigned agent ID", required: true },
    { key: "startsAt", label: "Start", type: "datetime-local", required: true }, { key: "endsAt", label: "End", type: "datetime-local", required: true },
    { key: "attendeeCount", label: "Attendees", type: "number" }, { key: "isPublished", label: "Published", type: "checkbox" }, { key: "notes", label: "Notes", type: "textarea" },
  ]},
  tasks: { title: "Assigned Tasks", singular: "Task", columns: ["title", "dueAt", "status", "assignedAgentId"], fields: [
    { key: "title", label: "Task", required: true }, { key: "assignedAgentId", label: "Assigned agent ID" },
    { key: "dueAt", label: "Due date", type: "datetime-local" }, { key: "status", label: "Status", type: "select", options: ["open", "completed", "cancelled"].map((value) => ({ value, label: value })) },
  ]},
};
