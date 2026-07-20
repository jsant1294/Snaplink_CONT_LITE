// ---------------------------------------------------------------------------
// SnapLink Contractor i18n — client-facing surfaces are fully EN/ES.
// Canonical data (answer values, statuses) is stored in English so the
// contractor dashboard and AI pipeline stay consistent; Spanish is a
// display + generation layer. Lead records the client's language.
// ---------------------------------------------------------------------------

export type Lang = "en" | "es";

export const UI = {
  // Public page
  requestEstimate: { en: "Request Estimate", es: "Solicitar Presupuesto" },
  uploadPhotos: { en: "Upload Project Photos", es: "Subir Fotos del Proyecto" },
  callNow: { en: "Call Now", es: "Llamar Ahora" },
  textUs: { en: "Text Us", es: "Envíanos un Texto" },
  whatsapp: { en: "WhatsApp", es: "WhatsApp" },
  viewServices: { en: "View Services", es: "Ver Servicios" },
  beforeAfter: { en: "See Before & After", es: "Ver Antes y Después" },
  readReviews: { en: "Read Reviews", es: "Leer Reseñas" },
  bookWalkthrough: { en: "Book Walkthrough", es: "Agendar Visita" },
  saveContact: { en: "Save Contact", es: "Guardar Contacto" },
  services: { en: "Services", es: "Servicios" },
  getEstimate: { en: "Get estimate →", es: "Pedir presupuesto →" },
  poweredBy: { en: "Powered by", es: "Con tecnología de" },

  // Wizard
  whatsTheProject: { en: "What's the project?", es: "¿Cuál es el proyecto?" },
  pickClosest: { en: "Pick the closest match — takes 2 minutes.", es: "Elige la opción más cercana — toma 2 minutos." },
  quickDetails: { en: "A few quick details help us quote faster.", es: "Unos detalles rápidos nos ayudan a cotizar más rápido." },
  continue: { en: "Continue", es: "Continuar" },
  addPhotos: { en: "Add photos", es: "Agrega fotos" },
  photosHelp: {
    en: "Photos help us estimate accurately. Up to 6 total — optional but recommended.",
    es: "Las fotos nos ayudan a cotizar con precisión. Hasta 6 en total — opcional pero recomendado.",
  },
  tapToAdd: { en: "Tap to take or choose photos", es: "Toca para tomar o elegir fotos" },
  removePhoto: { en: "Remove photo", es: "Quitar foto" },
  howReachYou: { en: "How do we reach you?", es: "¿Cómo te contactamos?" },
  onlyFollowUp: {
    en: "We'll only use this to follow up on your project.",
    es: "Solo usaremos esto para dar seguimiento a tu proyecto.",
  },
  name: { en: "Name *", es: "Nombre *" },
  phone: { en: "Phone *", es: "Teléfono *" },
  email: { en: "Email", es: "Correo electrónico" },
  projectAddress: { en: "Project address", es: "Dirección del proyecto" },
  addressPlaceholder: { en: "Street, city", es: "Calle, ciudad" },
  preferredContact: { en: "Preferred contact method", es: "Método de contacto preferido" },
  bestTime: { en: "Best time to contact", es: "Mejor horario para contactarte" },
  bestTimePlaceholder: { en: "e.g. Weekdays after 5pm", es: "ej. Entre semana después de las 5pm" },
  timeline: { en: "Timeline", es: "Plazo" },
  budgetRange: { en: "Budget range", es: "Rango de presupuesto" },
  anythingElse: { en: "Anything else we should know?", es: "¿Algo más que debamos saber?" },
  reviewRequest: { en: "Review request", es: "Revisar solicitud" },
  reviewAndSend: { en: "Review & send", es: "Revisar y enviar" },
  project: { en: "Project", es: "Proyecto" },
  contactVia: { en: "Contact via", es: "Contactar por" },
  photos: { en: "Photos", es: "Fotos" },
  attached: { en: "attached", es: "adjuntas" },
  sending: { en: "Sending…", es: "Enviando…" },
  sendTo: { en: "Send to", es: "Enviar a" },
  requestSent: { en: "Request sent", es: "Solicitud enviada" },
  requestSentBody: {
    en: "received your project details and will reach out",
    es: "recibió los detalles de tu proyecto y te contactará",
  },
  soon: { en: "soon", es: "pronto" },
  backToPage: { en: "Back to page", es: "Volver a la página" },
  somethingWrong: { en: "Something went wrong. Please try again.", es: "Algo salió mal. Inténtalo de nuevo." },
  couldntRead: { en: "Couldn't read", es: "No se pudo leer" },
  tryDifferent: { en: "Try a different photo.", es: "Intenta con otra foto." },
  walkthroughNote: { en: "Client requested a walkthrough.", es: "El cliente solicitó una visita." },
} as const;

export function t(key: keyof typeof UI, lang: Lang): string {
  return UI[key][lang];
}

// --- Bilingual option lists (canonical value = English) ---------------------

export interface BiOption {
  value: string; // stored canonically (EN)
  es: string;
}

export function optLabel(o: BiOption, lang: Lang): string {
  return lang === "es" ? o.es : o.value;
}

export const CONTACT_METHOD_OPTIONS: BiOption[] = [
  { value: "Call", es: "Llamada" },
  { value: "Text", es: "Mensaje de texto" },
  { value: "WhatsApp", es: "WhatsApp" },
  { value: "Email", es: "Correo" },
];

export const TIMELINE_OPTIONS: BiOption[] = [
  { value: "ASAP / Emergency", es: "Lo antes posible / Emergencia" },
  { value: "Within 2 weeks", es: "Dentro de 2 semanas" },
  { value: "Within a month", es: "Dentro de un mes" },
  { value: "1-3 months", es: "1-3 meses" },
  { value: "Just planning", es: "Solo estoy planeando" },
];

export const BUDGET_OPTIONS: BiOption[] = [
  { value: "Under $1,000", es: "Menos de $1,000" },
  { value: "$1,000 – $5,000", es: "$1,000 – $5,000" },
  { value: "$5,000 – $15,000", es: "$5,000 – $15,000" },
  { value: "$15,000 – $40,000", es: "$15,000 – $40,000" },
  { value: "$40,000+", es: "$40,000+" },
  { value: "Not sure yet", es: "Aún no lo sé" },
];

// --- Contractor-facing admin surface (dashboard + estimator) ----------------
// Renders in the CONTRACTOR's preferredLanguage. Status VALUES stay canonical
// EN in storage; these are display labels only.

export const ADMIN = {
  leads: { en: "Leads", es: "Prospectos" },
  yourPage: { en: "Your public page", es: "Tu página pública" },
  all: { en: "All", es: "Todos" },
  loadingLeads: { en: "Loading leads…", es: "Cargando prospectos…" },
  noLeadsTitle: { en: "No leads here yet", es: "Aún no hay prospectos" },
  noLeadsBody: {
    en: "Share your SnapLink page — every client request lands on this board.",
    es: "Comparte tu página SnapLink — cada solicitud de cliente llega a este tablero.",
  },
  timelineTbd: { en: "Timeline TBD", es: "Plazo por definir" },
  budgetTbd: { en: "Budget TBD", es: "Presupuesto por definir" },
  prefers: { en: "Prefers", es: "Prefiere" },
  via: { en: "via", es: "vía" },
  speaksSpanish: { en: "🇲🇽 Habla español", es: "🇲🇽 Habla español" },
  speaksEnglish: { en: "Speaks English", es: "🇺🇸 Habla inglés" },
  aiSummary: { en: "AI Summary", es: "Resumen IA" },
  generateAi: { en: "✦ Generate AI summary", es: "✦ Generar resumen IA" },
  generating: { en: "Generating…", es: "Generando…" },
  aiReady: { en: "AI summary ready", es: "Resumen IA listo" },
  aiDetails: { en: "Scope, questions & needs confirmation ▼", es: "Alcance, preguntas y por confirmar ▼" },
  hideDetails: { en: "Hide details ▲", es: "Ocultar detalles ▲" },
  scopeNotes: { en: "Scope notes", es: "Notas de alcance" },
  questionsToAsk: { en: "Questions to ask", es: "Preguntas para el cliente" },
  needsConfirmation: { en: "Needs confirmation", es: "Por confirmar" },
  call: { en: "Call", es: "Llamar" },
  text: { en: "Text", es: "Texto" },
  copyFollowUp: { en: "Copy follow-up", es: "Copiar seguimiento" },
  copied: { en: "Follow-up message copied", es: "Mensaje de seguimiento copiado" },
  proposalPdf: { en: "Proposal PDF", es: "Propuesta PDF" },
  buildEstimate: { en: "Build estimate → PDF", es: "Crear presupuesto → PDF" },
  wrongPin: { en: "Wrong PIN — try again", es: "PIN incorrecto — intenta de nuevo" },
  enterPin: { en: "Enter your 6-digit PIN", es: "Ingresa tu PIN de 6 dígitos" },
  unlock: { en: "Unlock", es: "Entrar" },
  dashboardFor: { en: "Dashboard", es: "Panel" },
  // Estimator
  estimator: { en: "Estimator", es: "Cotizador" },
  dashboard: { en: "Dashboard", es: "Panel" },
  lineItems: { en: "Line items", es: "Partidas" },
  customItem: { en: "+ Custom item", es: "+ Partida personalizada" },
  noItemsYet: {
    en: "No items yet — add from the library below or create a custom item.",
    es: "Sin partidas aún — agrega de la biblioteca o crea una personalizada.",
  },
  itemLibrary: { en: "Item library", es: "Biblioteca de partidas" },
  yourRates: { en: "items — your rates, never guessed", es: "partidas — tus tarifas, nunca inventadas" },
  searchPlaceholder: { en: "Search: drywall, faucet, sod, panel…", es: "Buscar: tablaroca, llave, pasto, panel…" },
  allTrades: { en: "All trades", es: "Todos los oficios" },
  generalAnyJob: { en: "General / any job", es: "General / cualquier trabajo" },
  noMatches: { en: "No matches — add a custom item instead.", es: "Sin resultados — agrega una partida personalizada." },
  per: { en: "per", es: "por" },
  notesLabel: { en: "Notes & exclusions (prints on the PDF)", es: "Notas y exclusiones (se imprimen en el PDF)" },
  notesPlaceholder: {
    en: "e.g. Price excludes permit fees. Client to clear the work area.",
    es: "ej. El precio no incluye permisos. El cliente despeja el área de trabajo.",
  },
  totals: { en: "Totals", es: "Totales" },
  taxRate: { en: "Tax rate %", es: "Impuesto %" },
  discountLbl: { en: "Discount $", es: "Descuento $" },
  depositLbl: { en: "Deposit %", es: "Depósito %" },
  validDaysLbl: { en: "Valid (days)", es: "Válido (días)" },
  subtotal: { en: "Subtotal", es: "Subtotal" },
  discountRow: { en: "Discount", es: "Descuento" },
  tax: { en: "Tax", es: "Impuesto" },
  total: { en: "Total", es: "Total" },
  deposit: { en: "Deposit", es: "Depósito" },
  balance: { en: "Balance", es: "Saldo" },
  saveEstimate: { en: "Save estimate", es: "Guardar presupuesto" },
  saving: { en: "Saving…", es: "Guardando…" },
  saved: { en: "Saved", es: "Guardado" },
  savePdfEn: { en: "Save + PDF (English)", es: "Guardar + PDF (inglés)" },
  savePdfEs: { en: "Save + PDF (Spanish)", es: "Guardar + PDF (español)" },
  pdfInBoth: {
    en: "Generate the client PDF in either language — both always available.",
    es: "Genera el PDF del cliente en cualquier idioma — ambos siempre disponibles.",
  },
  leadNotFound: { en: "Lead not found", es: "Prospecto no encontrado" },
  backToDashboard: { en: "← Back to dashboard", es: "← Volver al panel" },
  noAddress: { en: "No address", es: "Sin dirección" },
  loading: { en: "Loading…", es: "Cargando…" },
  quantity: { en: "Quantity", es: "Cantidad" },
  unitLbl: { en: "Unit", es: "Unidad" },
  descriptionPh: { en: "Description", es: "Descripción" },
} as const;

export function at(key: keyof typeof ADMIN, lang: Lang): string {
  return ADMIN[key][lang];
}

export const STATUS_LABELS_ES: Record<string, string> = {
  New: "Nuevo",
  "Needs Call": "Llamar",
  "Walkthrough Scheduled": "Visita agendada",
  "Estimate Sent": "Presupuesto enviado",
  Approved: "Aprobado",
  "In Progress": "En progreso",
  Completed: "Completado",
  "Follow Up": "Seguimiento",
  Lost: "Perdido",
};

export function statusLabel(status: string, lang: Lang): string {
  return lang === "es" ? STATUS_LABELS_ES[status] ?? status : status;
}
