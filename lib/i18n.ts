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

// --- Lucio Financial Copilot (money module) ---------------------------------
// Contractor-facing. Renders in the contractor's preferredLanguage.

export const MONEY = {
  moneyTab: { en: "Money", es: "Dinero" },
  moneyTitle: { en: "Money", es: "Dinero" },
  poweredByLfc: { en: "Powered by Lucio Financial Copilot", es: "Con tecnología de Lucio Financial Copilot" },
  backToLeads: { en: "← Leads", es: "← Prospectos" },
  thisYear: { en: "Year", es: "Año" },

  // Summary
  incomeYtd: { en: "Income received", es: "Ingreso recibido" },
  overheadYtd: { en: "Business expenses", es: "Gastos del negocio" },
  materialsYtd: { en: "Job materials", es: "Materiales de trabajos" },
  netYtd: { en: "Net", es: "Neto" },
  setAside: { en: "Suggested set-aside", es: "Apartado sugerido" },
  setAsideHelp: { en: "You choose this percent. Confirm it with your tax professional.", es: "Tú eliges este porcentaje. Confírmalo con tu profesional de impuestos." },
  unbilledMaterials: { en: "Materials not yet billed", es: "Materiales sin cobrar" },
  unbilledHelp: { en: "Job materials you may still need to charge the client.", es: "Materiales que quizá aún debes cobrarle al cliente." },
  byCategory: { en: "By category", es: "Por categoría" },

  // Add expense
  addExpense: { en: "Add expense", es: "Agregar gasto" },
  amount: { en: "Amount", es: "Monto" },
  date: { en: "Date", es: "Fecha" },
  vendor: { en: "Vendor / store", es: "Proveedor / tienda" },
  vendorPlaceholder: { en: "e.g. Home Depot", es: "ej. Home Depot" },
  category: { en: "Category", es: "Categoría" },
  note: { en: "Note", es: "Nota" },
  notePlaceholder: { en: "Optional", es: "Opcional" },
  receipt: { en: "Receipt photo", es: "Foto del recibo" },
  takePhoto: { en: "Tap to take or choose a photo", es: "Toca para tomar o elegir una foto" },
  removePhoto: { en: "Remove photo", es: "Quitar foto" },
  jobOrOverhead: { en: "What kind of expense?", es: "¿Qué tipo de gasto?" },
  jobMaterial: { en: "Job material (bill the client)", es: "Material de trabajo (se le cobra al cliente)" },
  overhead: { en: "Business expense (deduction)", es: "Gasto del negocio (deducción)" },
  whichJob: { en: "Which job?", es: "¿Cuál trabajo?" },
  pickJob: { en: "Pick a job", es: "Elige un trabajo" },
  save: { en: "Save expense", es: "Guardar gasto" },
  saving: { en: "Saving…", es: "Guardando…" },
  saved: { en: "Expense saved", es: "Gasto guardado" },
  cancel: { en: "Cancel", es: "Cancelar" },

  // List
  expenses: { en: "Expenses", es: "Gastos" },
  noExpenses: { en: "No expenses logged yet. Add your first one above.", es: "Aún no hay gastos. Agrega el primero arriba." },
  loading: { en: "Loading…", es: "Cargando…" },
  deleteExpense: { en: "Delete", es: "Borrar" },
  confirmDelete: { en: "Delete this expense?", es: "¿Borrar este gasto?" },
  deleted: { en: "Expense deleted", es: "Gasto borrado" },
  billedToClient: { en: "Billed", es: "Cobrado" },
  notBilled: { en: "Not billed", es: "Sin cobrar" },
  markBilled: { en: "Mark billed", es: "Marcar cobrado" },
  markUnbilled: { en: "Mark not billed", es: "Marcar sin cobrar" },
  viewReceipt: { en: "Receipt", es: "Recibo" },

  // Tax settings
  taxSettings: { en: "Tax settings", es: "Ajustes de impuestos" },
  entityType: { en: "Business type", es: "Tipo de negocio" },
  soleProp: { en: "Sole proprietor", es: "Propietario único" },
  llcSingle: { en: "LLC — single owner", es: "LLC — un solo dueño" },
  llcMulti: { en: "LLC — multiple owners", es: "LLC — varios dueños" },
  sCorp: { en: "S-Corp", es: "S-Corp" },
  setAsidePercent: { en: "Set-aside percent", es: "Porcentaje a apartar" },
  businessLegalName: { en: "Legal business name", es: "Nombre legal del negocio" },
  settingsSaved: { en: "Settings saved", es: "Ajustes guardados" },

  // Disclaimer — required, both languages
  disclaimerTitle: { en: "Record-keeping, not tax advice", es: "Registro de gastos, no asesoría fiscal" },
  disclaimerBody: {
    en: "This organizes your records and estimates what to set aside. It does not file taxes and is not tax advice. Confirm your numbers with a licensed tax professional.",
    es: "Esto organiza tus registros y estima cuánto apartar. No presenta impuestos y no es asesoría fiscal. Confirma tus números con un profesional de impuestos con licencia.",
  },
} as const;

export function mt(key: keyof typeof MONEY, lang: Lang): string {
  return MONEY[key][lang];
}

// --- LFC: batch receipt capture ---------------------------------------------

export const BATCH = {
  batchReceipts: { en: "Batch receipts", es: "Recibos en lote" },
  batchTitle: { en: "Catch up on your receipt pile", es: "Ponte al día con tu montón de recibos" },
  batchIntro: {
    en: "Pick all your receipt photos at once. We'll read each one and fill in what we can — you check the numbers and save.",
    es: "Elige todas las fotos de tus recibos de una vez. Leemos cada una y llenamos lo que podamos — tú revisas los números y guardas.",
  },
  choosePhotos: { en: "Choose receipt photos", es: "Elegir fotos de recibos" },
  addMore: { en: "Add more photos", es: "Agregar más fotos" },
  scanning: { en: "Reading…", es: "Leyendo…" },
  readyToConfirm: { en: "Check & save", es: "Revisa y guarda" },
  savedItem: { en: "Saved", es: "Guardado" },
  couldNotRead: { en: "Couldn't read it — type the fields", es: "No se pudo leer — escribe los datos" },
  readBy: { en: "Read by", es: "Leído por" },
  alwaysCheck: {
    en: "Always check the amount before saving. The reader can be wrong.",
    es: "Siempre revisa el monto antes de guardar. El lector se puede equivocar.",
  },
  saveThis: { en: "Save", es: "Guardar" },
  skipThis: { en: "Remove", es: "Quitar" },
  saveAllReady: { en: "Save all checked", es: "Guardar todos los revisados" },
  batchDone: { en: "receipts saved", es: "recibos guardados" },
  queueEmpty: { en: "No receipts in the queue yet.", es: "Aún no hay recibos en la fila." },
  closeBatch: { en: "Done", es: "Listo" },
  needAmount: { en: "Amount required", es: "Falta el monto" },
  ofCount: { en: "of", es: "de" },
} as const;

export function bt(key: keyof typeof BATCH, lang: Lang): string {
  return BATCH[key][lang];
}

// --- LFC Delivery 2: 1099s & subcontractors ---------------------------------

export const FORMS = {
  subs1099: { en: "Subs & 1099s", es: "Subs y 1099" },
  title: { en: "Subcontractors & 1099s", es: "Subcontratistas y 1099" },
  intro: {
    en: "Track who you pay and who pays you, so January isn't a scramble.",
    es: "Lleva cuenta de a quién le pagas y quién te paga, para que enero no sea una carrera.",
  },
  // Payees
  whoIPay: { en: "Who I pay", es: "A quién le pago" },
  addPayee: { en: "Add subcontractor", es: "Agregar subcontratista" },
  payeeName: { en: "Name", es: "Nombre" },
  payeeNamePh: { en: "Person or company", es: "Persona o empresa" },
  payeeType: { en: "Type", es: "Tipo" },
  individual: { en: "Individual", es: "Persona física" },
  business: { en: "Business", es: "Empresa" },
  legalName: { en: "Legal name (if different)", es: "Nombre legal (si es distinto)" },
  address: { en: "Address", es: "Dirección" },
  tinType: { en: "ID type", es: "Tipo de identificación" },
  ssn: { en: "SSN", es: "SSN" },
  ein: { en: "EIN", es: "EIN" },
  unknown: { en: "Not sure", es: "No sé" },
  tinLast4: { en: "Last 4 digits only", es: "Solo los últimos 4 dígitos" },
  tinWarning: {
    en: "Never type a full SSN or EIN here. Only the last 4 digits are stored — upload the W-9 for the full number.",
    es: "Nunca escribas un SSN o EIN completo aquí. Solo se guardan los últimos 4 dígitos — sube el W-9 para el número completo.",
  },
  w9: { en: "W-9", es: "W-9" },
  w9OnFile: { en: "W-9 on file", es: "W-9 en archivo" },
  w9Missing: { en: "No W-9", es: "Sin W-9" },
  uploadW9: { en: "Upload W-9 photo", es: "Subir foto del W-9" },
  viewW9: { en: "View W-9", es: "Ver W-9" },
  paidThisYear: { en: "Paid this year", es: "Pagado este año" },
  needsW9Alert: { en: "Over threshold, no W-9", es: "Pasa el umbral, sin W-9" },
  needsW9Help: {
    en: "You've paid this person enough that a 1099 is likely required. Get a W-9 before January.",
    es: "Le has pagado lo suficiente para que probablemente se requiera un 1099. Consigue un W-9 antes de enero.",
  },
  thresholdLabel: { en: "1099 alert at", es: "Alerta de 1099 a partir de" },
  thresholdHelp: {
    en: "You set this amount. Confirm the current filing threshold with your accountant.",
    es: "Tú defines este monto. Confirma el umbral actual con tu contador.",
  },
  noPayees: { en: "No subcontractors added yet.", es: "Aún no hay subcontratistas." },
  // 1099s received
  whoPaysMe: { en: "1099s I received", es: "1099 que recibí" },
  add1099: { en: "Add a 1099 I received", es: "Agregar un 1099 que recibí" },
  issuer: { en: "Who issued it", es: "Quién lo emitió" },
  issuerPh: { en: "Company or GC name", es: "Nombre de la empresa o contratista" },
  formType: { en: "Form type", es: "Tipo de forma" },
  taxYear: { en: "Tax year", es: "Año fiscal" },
  amountOnForm: { en: "Amount on the form", es: "Monto en la forma" },
  uploadForm: { en: "Upload photo of the form", es: "Subir foto de la forma" },
  viewForm: { en: "View form", es: "Ver forma" },
  no1099s: { en: "No 1099s recorded for this year.", es: "No hay 1099 registrados para este año." },
  // Reconciliation
  reconcile: { en: "Does it match your records?", es: "¿Cuadra con tus registros?" },
  total1099s: { en: "Total on 1099s received", es: "Total en los 1099 recibidos" },
  yourRecords: { en: "Income you recorded", es: "Ingreso que registraste" },
  difference: { en: "Difference", es: "Diferencia" },
  matchOk: { en: "These line up.", es: "Esto cuadra." },
  matchOff: {
    en: "These don't match. Find out why before you file — bring it to your accountant.",
    es: "Esto no cuadra. Averigua por qué antes de declarar — llévalo a tu contador.",
  },
  // shared
  save: { en: "Save", es: "Guardar" },
  saving: { en: "Saving…", es: "Guardando…" },
  cancel: { en: "Cancel", es: "Cancelar" },
  remove: { en: "Remove", es: "Quitar" },
  confirmRemove: { en: "Remove this entry?", es: "¿Quitar este registro?" },
  notes: { en: "Notes", es: "Notas" },
  optional: { en: "Optional", es: "Opcional" },
  close: { en: "Done", es: "Listo" },
} as const;

export function ft(key: keyof typeof FORMS, lang: Lang): string {
  return FORMS[key][lang];
}

// --- LFC Delivery 3: quarterly + year-end -----------------------------------

export const QTR = {
  quarterlyTab: { en: "Quarterly & year-end", es: "Trimestral y fin de año" },
  title: { en: "Staying current", es: "Mantenerte al corriente" },
  intro: {
    en: "What you made each quarter, what to set aside, and what you actually moved.",
    es: "Lo que ganaste cada trimestre, cuánto apartar y cuánto realmente moviste.",
  },
  quarter: { en: "Quarter", es: "Trimestre" },
  period: { en: "Period", es: "Periodo" },
  income: { en: "Income", es: "Ingreso" },
  expenses: { en: "Expenses", es: "Gastos" },
  net: { en: "Net", es: "Neto" },
  suggested: { en: "Suggested", es: "Sugerido" },
  actuallySetAside: { en: "You set aside", es: "Apartaste" },
  shortfall: { en: "Short", es: "Falta" },
  caughtUp: { en: "Caught up", es: "Al corriente" },
  typicalDue: { en: "Typical date", es: "Fecha típica" },
  dueDateWarning: {
    en: "Dates shown are typical federal estimated-payment dates and can shift. Confirm your actual dates and amounts with your tax professional.",
    es: "Las fechas mostradas son las típicas de pagos estimados federales y pueden cambiar. Confirma tus fechas y montos reales con tu profesional de impuestos.",
  },
  logSetAside: { en: "Log money set aside", es: "Registrar dinero apartado" },
  amount: { en: "Amount", es: "Monto" },
  whichQuarter: { en: "Which quarter", es: "Cuál trimestre" },
  dateMoved: { en: "Date moved", es: "Fecha que lo moviste" },
  note: { en: "Note", es: "Nota" },
  save: { en: "Save", es: "Guardar" },
  saving: { en: "Saving…", es: "Guardando…" },
  cancel: { en: "Cancel", es: "Cancelar" },
  history: { en: "Set-aside history", es: "Historial de apartados" },
  noSetAsides: { en: "Nothing logged yet.", es: "Aún no hay registros." },
  remove: { en: "Remove", es: "Quitar" },
  confirmRemove: { en: "Remove this entry?", es: "¿Quitar este registro?" },
  yearTotals: { en: "Year totals", es: "Totales del año" },
  yearEnd: { en: "Year-end pack for your accountant", es: "Paquete de fin de año para tu contador" },
  yearEndNote: {
    en: "A summary of your records plus a spreadsheet of every expense. Hand both to your accountant.",
    es: "Un resumen de tus registros más una hoja de cálculo con cada gasto. Entrega ambos a tu contador.",
  },
  downloadPdfEn: { en: "Summary PDF (English)", es: "PDF resumen (inglés)" },
  downloadPdfEs: { en: "Summary PDF (Spanish)", es: "PDF resumen (español)" },
  downloadCsv: { en: "Expenses spreadsheet (CSV)", es: "Hoja de gastos (CSV)" },
  close: { en: "Done", es: "Listo" },
  loading: { en: "Loading…", es: "Cargando…" },
} as const;

export function qt(key: keyof typeof QTR, lang: Lang): string {
  return QTR[key][lang];
}
