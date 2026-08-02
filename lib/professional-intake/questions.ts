// ---------------------------------------------------------------------------
// Southline Professional Intake — question registry.
// Adapted from the SnapLink intake pattern (docs/professional-intake/00-*):
// that system hardcodes a fixed 15-step form with no profession branching.
// This registry is data-driven and profession-conditional instead, because
// Southline serves 15+ profession types across two identity systems where
// SnapLink's source only ever onboards one kind of client.
//
// IDs are generic (shared by both owner types) — lib/professional-intake/
// profile-map.ts resolves each id into the real contractor or agent field.
// Taxonomy/profession options are pulled live from the existing registries
// (lib/home-service-taxonomy.ts, lib/profession-types.ts) — never duplicated.
// ---------------------------------------------------------------------------

import { HOME_SERVICE_CATEGORIES } from "../home-service-taxonomy.ts";
import { PROFESSION_TYPES, LICENSED_PROFESSION_TYPES } from "../profession-types.ts";
import type { IntakeOwnerType, IntakeQuestion, IntakeQuestionOption } from "./types.ts";

const SERVICE_OPTIONS: IntakeQuestionOption[] = HOME_SERVICE_CATEGORIES.filter((c) => c.active).map((c) => ({
  value: c.id,
  labelEn: c.labelEn,
  labelEs: c.labelEs,
}));

const PROFESSION_OPTIONS: IntakeQuestionOption[] = (() => {
  const seen = new Set<string>();
  const options: IntakeQuestionOption[] = [];
  for (const p of [...PROFESSION_TYPES, ...LICENSED_PROFESSION_TYPES]) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    options.push({ value: p.id, labelEn: p.en, labelEs: p.es });
  }
  return options;
})();

const LANGUAGE_OPTIONS: IntakeQuestionOption[] = [
  { value: "en", labelEn: "English", labelEs: "Inglés" },
  { value: "es", labelEn: "Spanish", labelEs: "Español" },
  { value: "other", labelEn: "Other", labelEs: "Otro" },
];

const CTA_OPTIONS: IntakeQuestionOption[] = [
  { value: "request_quote", labelEn: "Request a quote", labelEs: "Solicitar una cotización" },
  { value: "book_consultation", labelEn: "Book a consultation", labelEs: "Reservar una consulta" },
  { value: "call_now", labelEn: "Call now", labelEs: "Llamar ahora" },
  { value: "view_portfolio", labelEn: "View portfolio", labelEs: "Ver portafolio" },
  { value: "send_message", labelEn: "Send a message", labelEs: "Enviar un mensaje" },
];

// ---------------------------------------------------------------------------
// Core questions — every owner type/profession sees these (23 questions
// across 15 steps; several steps group related fields, e.g. service area).
// ---------------------------------------------------------------------------

export const CORE_QUESTIONS: IntakeQuestion[] = [
  {
    id: "professionType",
    step: 1,
    type: "select",
    labelEn: "What kind of professional or business are you?",
    labelEs: "¿Qué tipo de profesional o negocio eres?",
    required: true,
    options: PROFESSION_OPTIONS,
    profileTargets: ["professionType"],
  },
  {
    id: "displayName",
    step: 2,
    type: "text",
    labelEn: "What name should appear on your profile?",
    labelEs: "¿Qué nombre debe aparecer en tu perfil?",
    required: true,
    maxLength: 120,
    profileTargets: ["displayName", "businessName", "ownerName"],
  },
  {
    id: "companyName",
    step: 3,
    type: "text",
    labelEn: "What is your company or business name?",
    labelEs: "¿Cuál es el nombre de tu empresa o negocio?",
    helpEn: "Optional for solo professionals.",
    helpEs: "Opcional para profesionales independientes.",
    required: false,
    maxLength: 120,
    profileTargets: ["businessName", "brokerageName"],
  },
  {
    id: "primaryService",
    step: 4,
    type: "select",
    labelEn: "What is your main service?",
    labelEs: "¿Cuál es tu principal servicio?",
    required: true,
    options: SERVICE_OPTIONS,
    profileTargets: ["categories"],
  },
  {
    id: "additionalServices",
    step: 5,
    type: "multiselect",
    labelEn: "What other services do you offer?",
    labelEs: "¿Qué otros servicios ofreces?",
    required: false,
    maxItems: 8,
    options: SERVICE_OPTIONS,
    profileTargets: ["categories", "services"],
  },
  {
    id: "serviceAreaCity",
    step: 6,
    type: "text",
    labelEn: "City",
    labelEs: "Ciudad",
    required: true,
    maxLength: 80,
    profileTargets: ["serviceArea"],
  },
  {
    id: "serviceAreaState",
    step: 6,
    type: "text",
    labelEn: "State",
    labelEs: "Estado",
    required: true,
    maxLength: 40,
    profileTargets: ["serviceArea"],
  },
  {
    id: "serviceAreaZips",
    step: 6,
    type: "text",
    labelEn: "ZIP codes served (comma-separated)",
    labelEs: "Códigos postales atendidos (separados por comas)",
    required: false,
    maxLength: 200,
    profileTargets: ["serviceArea"],
  },
  {
    id: "serviceRadius",
    step: 6,
    type: "text",
    labelEn: "Service radius (miles)",
    labelEs: "Radio de servicio (millas)",
    required: false,
    maxLength: 10,
    profileTargets: ["serviceRadius"],
  },
  {
    id: "idealCustomer",
    step: 7,
    type: "textarea",
    labelEn: "Who do you help most?",
    labelEs: "¿A quién ayudas más?",
    required: false,
    maxLength: 400,
    profileTargets: ["marketplaceSummary"],
  },
  {
    id: "customerProblem",
    step: 8,
    type: "textarea",
    labelEn: "What problem do customers usually hire you to solve?",
    labelEs: "¿Qué problema suelen contratarte para resolver los clientes?",
    required: false,
    maxLength: 400,
    profileTargets: ["marketplaceSummary"],
  },
  {
    id: "differentiator",
    step: 9,
    type: "textarea",
    labelEn: "What makes your service different?",
    labelEs: "¿Qué hace diferente a tu servicio?",
    required: false,
    maxLength: 400,
    profileTargets: ["marketplaceSummary", "tagline"],
  },
  {
    id: "experienceQualifications",
    step: 10,
    type: "textarea",
    labelEn: "Tell us about your experience, licenses, insurance, or certifications.",
    labelEs: "Cuéntanos sobre tu experiencia, licencias, seguros o certificaciones.",
    helpEn: "Shown to the operator only. Never published without review.",
    helpEs: "Solo se muestra al operador. Nunca se publica sin revisión.",
    required: false,
    maxLength: 600,
    profileTargets: ["licenseInfo"],
  },
  {
    id: "languages",
    step: 11,
    type: "multiselect",
    labelEn: "Which languages do you serve customers in?",
    labelEs: "¿En qué idiomas atiendes a los clientes?",
    required: false,
    maxItems: 5,
    options: LANGUAGE_OPTIONS,
    profileTargets: ["languages", "preferredLanguage"],
  },
  {
    id: "phone",
    step: 12,
    type: "phone",
    labelEn: "Phone",
    labelEs: "Teléfono",
    required: true,
    profileTargets: ["phone"],
  },
  {
    id: "email",
    step: 12,
    type: "email",
    labelEn: "Email",
    labelEs: "Correo electrónico",
    required: false,
    profileTargets: ["email"],
  },
  {
    id: "whatsapp",
    step: 12,
    type: "phone",
    labelEn: "WhatsApp",
    labelEs: "WhatsApp",
    required: false,
    profileTargets: ["whatsapp"],
  },
  {
    id: "website",
    step: 12,
    type: "url",
    labelEn: "Website",
    labelEs: "Sitio web",
    required: false,
    profileTargets: ["website"],
  },
  {
    id: "bookingLink",
    step: 13,
    type: "url",
    labelEn: "How should customers request an appointment or consultation?",
    labelEs: "¿Cómo deben solicitar los clientes una cita o consulta?",
    helpEn: "Paste an existing booking link. This does not create a new booking system.",
    helpEs: "Pega un enlace de reservas existente. Esto no crea un nuevo sistema de reservas.",
    required: false,
    profileTargets: ["bookingLink"],
  },
  {
    id: "profilePhoto",
    step: 14,
    type: "image",
    labelEn: "Profile photo or logo",
    labelEs: "Foto de perfil o logo",
    required: false,
    maxItems: 1,
    profileTargets: ["avatarUrl", "photoUrl"],
  },
  {
    id: "coverPhoto",
    step: 14,
    type: "image",
    labelEn: "Cover image",
    labelEs: "Imagen de portada",
    required: false,
    maxItems: 1,
    profileTargets: ["coverPhotoUrl"],
  },
  {
    id: "galleryPhotos",
    step: 14,
    type: "image",
    labelEn: "Portfolio / gallery images",
    labelEs: "Imágenes de portafolio / galería",
    required: false,
    maxItems: 6,
    profileTargets: ["galleryUrls"],
  },
  {
    id: "primaryCta",
    step: 15,
    type: "select",
    labelEn: "What should the primary button on your profile say?",
    labelEs: "¿Qué debe decir el botón principal de tu perfil?",
    required: true,
    options: CTA_OPTIONS,
    profileTargets: ["primaryCta"],
  },
];

// ---------------------------------------------------------------------------
// Conditional questions — profession-specific, appended after the core set.
// Gated by ownerTypes and/or professionTypes; getQuestionsFor() below is the
// single place that resolves which of these actually show for a given
// owner type + profession.
// ---------------------------------------------------------------------------

export const CONDITIONAL_QUESTIONS: IntakeQuestion[] = [
  // --- Contractors and trades -----------------------------------------
  {
    id: "yearsInBusiness",
    step: 16,
    type: "text",
    labelEn: "How many years have you been in business?",
    labelEs: "¿Cuántos años llevas en el negocio?",
    required: false,
    maxLength: 4,
    ownerTypes: ["contractor"],
    profileTargets: ["licenseInfo"],
  },
  {
    id: "licenseInfo",
    step: 16,
    type: "text",
    labelEn: "License number",
    labelEs: "Número de licencia",
    required: false,
    maxLength: 80,
    ownerTypes: ["contractor"],
    profileTargets: ["licenseInfo"],
  },
  {
    id: "insuranceCarried",
    step: 16,
    type: "boolean",
    labelEn: "Do you carry liability insurance?",
    labelEs: "¿Cuentas con seguro de responsabilidad civil?",
    required: false,
    ownerTypes: ["contractor"],
    profileTargets: ["licenseInfo"],
  },
  {
    id: "estimatesOffered",
    step: 16,
    type: "boolean",
    labelEn: "Do you offer free estimates?",
    labelEs: "¿Ofreces estimaciones gratuitas?",
    required: false,
    ownerTypes: ["contractor"],
    profileTargets: ["marketplaceSummary"],
  },
  {
    id: "emergencyService",
    step: 16,
    type: "boolean",
    labelEn: "Do you offer emergency service?",
    labelEs: "¿Ofreces servicio de emergencia?",
    required: false,
    ownerTypes: ["contractor"],
    profileTargets: ["marketplaceSummary"],
  },
  {
    id: "projectSizeFocus",
    step: 16,
    type: "select",
    labelEn: "What project sizes do you focus on?",
    labelEs: "¿En qué tamaños de proyecto te enfocas?",
    required: false,
    ownerTypes: ["contractor"],
    options: [
      { value: "small", labelEn: "Small repairs", labelEs: "Reparaciones pequeñas" },
      { value: "medium", labelEn: "Medium remodels", labelEs: "Remodelaciones medianas" },
      { value: "large", labelEn: "Large builds", labelEs: "Construcciones grandes" },
      { value: "any", labelEn: "Any size", labelEs: "Cualquier tamaño" },
    ],
    profileTargets: ["marketplaceSummary"],
  },
  {
    id: "residentialCommercial",
    step: 16,
    type: "select",
    labelEn: "Residential, commercial, or both?",
    labelEs: "¿Residencial, comercial o ambos?",
    required: false,
    ownerTypes: ["contractor"],
    options: [
      { value: "residential", labelEn: "Residential", labelEs: "Residencial" },
      { value: "commercial", labelEn: "Commercial", labelEs: "Comercial" },
      { value: "both", labelEn: "Both", labelEs: "Ambos" },
    ],
    profileTargets: ["marketplaceSummary"],
  },
  {
    id: "crewSize",
    step: 16,
    type: "text",
    labelEn: "Crew size",
    labelEs: "Tamaño del equipo",
    required: false,
    maxLength: 20,
    ownerTypes: ["contractor"],
    profileTargets: ["marketplaceSummary"],
  },

  // --- Agents and mortgage professionals -------------------------------
  {
    id: "officeName",
    step: 17,
    type: "text",
    labelEn: "Office name",
    labelEs: "Nombre de la oficina",
    required: false,
    maxLength: 120,
    ownerTypes: ["agent"],
    professionTypes: ["realtor", "mortgage_broker"],
    profileTargets: ["officeName"],
  },
  {
    id: "teamName",
    step: 17,
    type: "text",
    labelEn: "Team name",
    labelEs: "Nombre del equipo",
    required: false,
    maxLength: 120,
    ownerTypes: ["agent"],
    professionTypes: ["realtor", "mortgage_broker"],
    profileTargets: ["teamName"],
  },
  {
    id: "licenseNumber",
    step: 17,
    type: "text",
    labelEn: "License number",
    labelEs: "Número de licencia",
    required: false,
    maxLength: 80,
    ownerTypes: ["agent"],
    professionTypes: ["realtor", "mortgage_broker", "home_inspector", "property_manager", "appraiser", "surveyor"],
    profileTargets: ["licenseNumber"],
  },
  {
    id: "licenseState",
    step: 17,
    type: "text",
    labelEn: "License state",
    labelEs: "Estado de la licencia",
    required: false,
    maxLength: 40,
    ownerTypes: ["agent"],
    professionTypes: ["realtor", "mortgage_broker", "home_inspector", "property_manager", "appraiser", "surveyor"],
    profileTargets: ["licenseState"],
  },
  {
    id: "neighborhoodsFocus",
    step: 17,
    type: "textarea",
    labelEn: "Neighborhoods you focus on (comma-separated)",
    labelEs: "Vecindarios en los que te enfocas (separados por comas)",
    required: false,
    maxLength: 300,
    ownerTypes: ["agent"],
    professionTypes: ["realtor", "mortgage_broker"],
    profileTargets: ["neighborhoods"],
  },
  {
    id: "buyerSellerSpecialty",
    step: 17,
    type: "multiselect",
    labelEn: "Buyer or seller specialty?",
    labelEs: "¿Especialidad en comprador o vendedor?",
    required: false,
    maxItems: 3,
    ownerTypes: ["agent"],
    professionTypes: ["realtor"],
    options: [
      { value: "buyer", labelEn: "Buyer's agent", labelEs: "Agente del comprador" },
      { value: "seller", labelEn: "Seller's agent", labelEs: "Agente del vendedor" },
      { value: "investor", labelEn: "Investor clients", labelEs: "Clientes inversionistas" },
    ],
    profileTargets: ["marketplaceSummary"],
  },

  // --- Architects and designers -----------------------------------------
  {
    id: "projectTypesFocus",
    step: 18,
    type: "multiselect",
    labelEn: "What project types do you focus on?",
    labelEs: "¿En qué tipos de proyecto te enfocas?",
    required: false,
    maxItems: 5,
    ownerTypes: ["contractor", "agent"],
    professionTypes: ["architect", "interior_designer"],
    options: [
      { value: "new_build", labelEn: "New build", labelEs: "Construcción nueva" },
      { value: "renovation", labelEn: "Renovation", labelEs: "Renovación" },
      { value: "addition", labelEn: "Addition", labelEs: "Ampliación" },
      { value: "commercial", labelEn: "Commercial", labelEs: "Comercial" },
      { value: "residential", labelEn: "Residential", labelEs: "Residencial" },
    ],
    profileTargets: ["marketplaceSummary"],
  },
  {
    id: "designStyle",
    step: 18,
    type: "text",
    labelEn: "Design style",
    labelEs: "Estilo de diseño",
    required: false,
    maxLength: 100,
    ownerTypes: ["contractor", "agent"],
    professionTypes: ["architect", "interior_designer"],
    profileTargets: ["tagline"],
  },
  {
    id: "consultationModel",
    step: 18,
    type: "select",
    labelEn: "Consultation model",
    labelEs: "Modelo de consulta",
    required: false,
    ownerTypes: ["contractor", "agent"],
    professionTypes: ["architect", "interior_designer"],
    options: [
      { value: "free", labelEn: "Free initial consultation", labelEs: "Consulta inicial gratuita" },
      { value: "paid", labelEn: "Paid consultation", labelEs: "Consulta paga" },
      { value: "hourly", labelEn: "Hourly rate", labelEs: "Tarifa por hora" },
    ],
    profileTargets: ["marketplaceSummary"],
  },
  {
    id: "portfolioSpecialties",
    step: 18,
    type: "textarea",
    labelEn: "Portfolio specialties",
    labelEs: "Especialidades de portafolio",
    required: false,
    maxLength: 400,
    ownerTypes: ["contractor", "agent"],
    professionTypes: ["architect", "interior_designer"],
    profileTargets: ["marketplaceSummary"],
  },

  // --- Property managers ---------------------------------------------
  {
    id: "propertyTypesManaged",
    step: 19,
    type: "multiselect",
    labelEn: "What property types do you manage?",
    labelEs: "¿Qué tipos de propiedades administras?",
    required: false,
    maxItems: 5,
    ownerTypes: ["agent"],
    professionTypes: ["property_manager"],
    options: [
      { value: "single_family", labelEn: "Single family", labelEs: "Unifamiliar" },
      { value: "multi_family", labelEn: "Multi-family", labelEs: "Multifamiliar" },
      { value: "condo", labelEn: "Condo/HOA", labelEs: "Condominio/HOA" },
      { value: "rental", labelEn: "Long-term rental", labelEs: "Alquiler a largo plazo" },
      { value: "vacation", labelEn: "Vacation/getaway rental", labelEs: "Alquiler vacacional" },
    ],
    profileTargets: ["marketplaceSummary"],
  },
  {
    id: "unitsManaged",
    step: 19,
    type: "text",
    labelEn: "Approximate number of units managed",
    labelEs: "Número aproximado de unidades administradas",
    required: false,
    maxLength: 20,
    ownerTypes: ["agent"],
    professionTypes: ["property_manager"],
    profileTargets: ["marketplaceSummary"],
  },
  {
    id: "rentalGetawaySpecialization",
    step: 19,
    type: "boolean",
    labelEn: "Do you specialize in Rentals & Getaways properties?",
    labelEs: "¿Te especializas en propiedades de Alquileres y Escapadas?",
    required: false,
    ownerTypes: ["agent"],
    professionTypes: ["property_manager"],
    profileTargets: ["marketplaceSummary"],
  },

  // --- Photographers ---------------------------------------------------
  {
    id: "sessionTypes",
    step: 20,
    type: "multiselect",
    labelEn: "What session types do you offer?",
    labelEs: "¿Qué tipos de sesiones ofreces?",
    required: false,
    maxItems: 4,
    ownerTypes: ["contractor", "agent"],
    professionTypes: ["photographer"],
    options: [
      { value: "real_estate", labelEn: "Real estate", labelEs: "Bienes raíces" },
      { value: "portrait", labelEn: "Portrait", labelEs: "Retrato" },
      { value: "event", labelEn: "Event", labelEs: "Evento" },
      { value: "commercial", labelEn: "Commercial", labelEs: "Comercial" },
    ],
    profileTargets: ["marketplaceSummary"],
  },
  {
    id: "dronePhotography",
    step: 20,
    type: "boolean",
    labelEn: "Do you offer drone photography?",
    labelEs: "¿Ofreces fotografía con drone?",
    required: false,
    ownerTypes: ["contractor", "agent"],
    professionTypes: ["photographer"],
    profileTargets: ["marketplaceSummary"],
  },
  {
    id: "videoServices",
    step: 20,
    type: "boolean",
    labelEn: "Do you offer video services?",
    labelEs: "¿Ofreces servicios de video?",
    required: false,
    ownerTypes: ["contractor", "agent"],
    professionTypes: ["photographer"],
    profileTargets: ["marketplaceSummary"],
  },
  {
    id: "servicePackages",
    step: 20,
    type: "textarea",
    labelEn: "Describe your service packages",
    labelEs: "Describe tus paquetes de servicio",
    required: false,
    maxLength: 400,
    ownerTypes: ["contractor", "agent"],
    professionTypes: ["photographer"],
    profileTargets: ["marketplaceSummary"],
  },
];

export const ALL_QUESTIONS: IntakeQuestion[] = [...CORE_QUESTIONS, ...CONDITIONAL_QUESTIONS];

function questionApplies(q: IntakeQuestion, ownerType: IntakeOwnerType, professionType: string | undefined): boolean {
  if (q.ownerTypes && !q.ownerTypes.includes(ownerType)) return false;
  if (q.professionTypes && (!professionType || !q.professionTypes.includes(professionType))) return false;
  return true;
}

/** The exact question set a given owner type + profession should see, in step order. */
export function getQuestionsFor(ownerType: IntakeOwnerType, professionType?: string): IntakeQuestion[] {
  return ALL_QUESTIONS.filter((q) => questionApplies(q, ownerType, professionType)).sort((a, b) => a.step - b.step);
}

export function questionById(id: string): IntakeQuestion | undefined {
  return ALL_QUESTIONS.find((q) => q.id === id);
}

export function questionLabel(question: IntakeQuestion, lang: "en" | "es"): string {
  return lang === "es" ? question.labelEs : question.labelEn;
}

export function optionLabel(option: IntakeQuestionOption, lang: "en" | "es"): string {
  return lang === "es" ? option.labelEs : option.labelEn;
}
