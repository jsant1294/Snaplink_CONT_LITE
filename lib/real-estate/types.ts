export type RealEstateRole =
  | "broker_owner"
  | "administrator"
  | "office_manager"
  | "listing_agent"
  | "marketing_coordinator"
  | "transaction_coordinator";

export type PropertyStatus =
  | "draft"
  | "coming_soon"
  | "active"
  | "pending"
  | "sold"
  | "rental"
  | "archived";

export type LeadStage =
  | "new"
  | "contacted"
  | "qualified"
  | "buyer_consultation"
  | "seller_consultation"
  | "showing_scheduled"
  | "offer_submitted"
  | "under_contract"
  | "closed"
  | "lost"
  | "long_term_follow_up";

export type AppointmentType =
  | "buyer_consultation"
  | "seller_consultation"
  | "property_showing"
  | "virtual_showing"
  | "open_house"
  | "photography_session"
  | "inspection"
  | "closing_meeting";

export interface RealEstateTenant {
  id: string;
  name: string;
  slug: string;
  preferredLanguage: "en" | "es";
}

export interface RealEstateUser {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: RealEstateRole;
}

export interface Agent {
  id: string;
  tenantId: string;
  slug: string;
  name: string;
  brokerageName: string;
  licenseNumber: string;
  biography: string;
  languages: string[];
  serviceAreas: string[];
  specialties: string[];
  yearsExperience: number;
  certifications: string[];
  phone: string;
  email: string;
  website?: string;
  photoUrl?: string;
  published: boolean;
}

export interface Brokerage {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  website?: string;
  brokerName: string;
  officeLocations: string[];
}

export interface Property {
  id: string;
  tenantId: string;
  organizationId: string;
  brokerageId: string;
  agentId: string;
  title: string;
  slug: string;
  status: PropertyStatus;
  published: boolean;
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
  propertyType: string;
  yearBuilt?: number;
  mlsNumber?: string;
  neighborhood?: string;
  schoolDistrict?: string;
  hoa?: string;
  taxes?: string;
  description: string;
  shortDescription: string;
  features: string[];
  amenities: string[];
  showingInstructions?: string;
  openHouseDates: string[];
  imageUrls: string[];
  viewCount: number;
  qrScanCount: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface PropertyMedia {
  id: string;
  propertyId: string;
  tenantId: string;
  mediaType: "image" | "floor_plan" | "video" | "virtual_tour";
  url: string;
  filename: string;
  altText: string;
  sortOrder: number;
  isHero: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface RealEstateLead {
  id: string;
  tenantId: string;
  assignedAgentId?: string;
  type: "buyer" | "seller";
  stage: LeadStage;
  name: string;
  email: string;
  phone: string;
  budget?: string;
  preferredCities: string[];
  timeline?: string;
  source: string;
  lastActivityAt: string;
}

export interface Appointment {
  id: string;
  tenantId: string;
  agentId: string;
  propertyId?: string;
  leadId?: string;
  type: AppointmentType;
  startsAt: string;
  status: "requested" | "confirmed" | "completed" | "cancelled";
}
