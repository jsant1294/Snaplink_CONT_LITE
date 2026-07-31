// ---------------------------------------------------------------------------
// Southline Living / SnapLink FAQ knowledge base — seed content in code, same
// pattern as lib/southline-diy.ts's SEED_PROJECTS and lib/profession-types.ts's
// PROFESSION_TYPES. Powers both the public /faq page and (later) Lucio's FAQ
// retrieval tool, so the two can never disagree — one data source.
//
// Answers are deliberately conservative: where this app doesn't actually have a
// feature yet (a formal written privacy policy, professional ratings/reviews,
// license-registry verification), the answer says so honestly rather than
// describing a capability that doesn't exist.
// ---------------------------------------------------------------------------

export type FaqCategory =
  | "southline_living"
  | "snaplink"
  | "homes_and_listings"
  | "agents"
  | "professionals"
  | "quotes"
  | "booking"
  | "cost_estimates"
  | "diy"
  | "verification"
  | "privacy"
  | "professional_membership";

export const FAQ_CATEGORIES: { id: FaqCategory; en: string; es: string }[] = [
  { id: "southline_living", en: "Southline Living", es: "Southline Living" },
  { id: "snaplink", en: "SnapLink", es: "SnapLink" },
  { id: "homes_and_listings", en: "Homes & Listings", es: "Casas y Propiedades" },
  { id: "agents", en: "Agents", es: "Agentes" },
  { id: "professionals", en: "Professionals", es: "Profesionales" },
  { id: "quotes", en: "Quotes", es: "Cotizaciones" },
  { id: "booking", en: "Booking", es: "Reservas" },
  { id: "cost_estimates", en: "Cost Estimates", es: "Estimados de Costo" },
  { id: "diy", en: "DIY", es: "Hazlo tú mismo" },
  { id: "verification", en: "Verification", es: "Verificación" },
  { id: "privacy", en: "Privacy", es: "Privacidad" },
  { id: "professional_membership", en: "Professional Membership", es: "Membresía Profesional" },
];

export interface FaqEntry {
  id: string;
  category: FaqCategory;
  questionEn: string;
  questionEs: string;
  answerEn: string;
  answerEs: string;
  published: boolean;
  lastReviewed: string;
  sourceRef?: string;
}

export const FAQ_ENTRIES: FaqEntry[] = [
  {
    id: "faq-what-is-southline",
    category: "southline_living",
    questionEn: "What is Southline Living?",
    questionEs: "¿Qué es Southline Living?",
    answerEn: "Southline Living is a consumer marketplace for everything home: finding a home, finding trusted professionals, remodeling ideas, DIY guidance, project estimates, and booking services — all in one connected platform, powered by SnapLink.",
    answerEs: "Southline Living es un mercado para todo lo relacionado con el hogar: encontrar una casa, encontrar profesionales de confianza, ideas de remodelación, guías DIY, estimados de proyectos y reservar servicios, todo en una plataforma conectada, impulsada por SnapLink.",
    published: true,
    lastReviewed: "2026-07-31",
  },
  {
    id: "faq-what-languages",
    category: "southline_living",
    questionEn: "What languages are supported?",
    questionEs: "¿Qué idiomas son compatibles?",
    answerEn: "Southline Living is available in English and Spanish. Use the language toggle in the header to switch at any time.",
    answerEs: "Southline Living está disponible en inglés y español. Usa el selector de idioma en el encabezado para cambiar en cualquier momento.",
    published: true,
    lastReviewed: "2026-07-31",
  },
  {
    id: "faq-what-is-snaplink",
    category: "snaplink",
    questionEn: "What is SnapLink?",
    questionEs: "¿Qué es SnapLink?",
    answerEn: "SnapLink is the technology platform behind Southline Living. It powers every professional's digital profile, booking, leads, and customer connection — including smart NFC and QR products that let a professional share their profile with a tap or a scan.",
    answerEs: "SnapLink es la plataforma tecnológica detrás de Southline Living. Impulsa el perfil digital, las reservas, los clientes potenciales y la conexión con el cliente de cada profesional, incluyendo productos NFC y QR inteligentes que permiten a un profesional compartir su perfil con un toque o un escaneo.",
    published: true,
    lastReviewed: "2026-07-31",
  },
  {
    id: "faq-what-is-snaplink-profile",
    category: "snaplink",
    questionEn: "What is a SnapLink Profile?",
    questionEs: "¿Qué es un Perfil SnapLink?",
    answerEn: "A SnapLink Profile is a professional's public digital business card and profile page — business details, services, service area, and ways to get in touch, request a quote, or book a consultation.",
    answerEs: "Un Perfil SnapLink es la tarjeta de presentación digital y página de perfil pública de un profesional: detalles del negocio, servicios, área de servicio y formas de contactar, solicitar una cotización o reservar una consulta.",
    published: true,
    lastReviewed: "2026-07-31",
  },
  {
    id: "faq-what-are-nfc-cards",
    category: "snaplink",
    questionEn: "What are NFC Cards?",
    questionEs: "¿Qué son las tarjetas NFC?",
    answerEn: "NFC (Near Field Communication) cards are physical SnapLink products — cards, table displays, or similar — that a professional can tap against a customer's phone to instantly open their SnapLink Profile, no app or typing required.",
    answerEs: "Las tarjetas NFC (comunicación de campo cercano) son productos físicos de SnapLink — tarjetas, exhibidores de mesa, entre otros — que un profesional puede acercar al teléfono de un cliente para abrir instantáneamente su Perfil SnapLink, sin necesidad de una aplicación ni de escribir nada.",
    published: true,
    lastReviewed: "2026-07-31",
  },
  {
    id: "faq-how-qr-codes-work",
    category: "snaplink",
    questionEn: "How do QR codes work?",
    questionEs: "¿Cómo funcionan los códigos QR?",
    answerEn: "Every SnapLink Profile has a QR code. Scanning it with a phone camera opens the professional's profile directly — useful on yard signs, business cards, or printed materials.",
    answerEs: "Cada Perfil SnapLink tiene un código QR. Escanearlo con la cámara del teléfono abre directamente el perfil del profesional, útil en letreros de jardín, tarjetas de presentación o materiales impresos.",
    published: true,
    lastReviewed: "2026-07-31",
  },
  {
    id: "faq-homes-how-published",
    category: "homes_and_listings",
    questionEn: "Where do the home listings come from?",
    questionEs: "¿De dónde provienen las publicaciones de casas?",
    answerEn: "Listings on Southline Living are published by local SnapLink real-estate professionals. Each listing shows real details — price, address, beds, baths, square footage — provided by the listing agent.",
    answerEs: "Las publicaciones en Southline Living son creadas por profesionales locales de bienes raíces de SnapLink. Cada publicación muestra detalles reales —precio, dirección, habitaciones, baños, metros cuadrados— proporcionados por el agente que la publica.",
    published: true,
    lastReviewed: "2026-07-31",
  },
  {
    id: "faq-agents-who-are-they",
    category: "agents",
    questionEn: "Who are the agents on Southline Living?",
    questionEs: "¿Quiénes son los agentes en Southline Living?",
    answerEn: "Agents are licensed real-estate professionals with a SnapLink Profile, listed with their brokerage, service areas, and specialties. You can contact an agent directly from their profile or a listing they represent.",
    answerEs: "Los agentes son profesionales inmobiliarios con licencia y un Perfil SnapLink, con su firma, áreas de servicio y especialidades. Puedes contactar a un agente directamente desde su perfil o desde una propiedad que representa.",
    published: true,
    lastReviewed: "2026-07-31",
  },
  {
    id: "faq-what-industries",
    category: "professionals",
    questionEn: "What industries are supported?",
    questionEs: "¿Qué industrias son compatibles?",
    answerEn: "SnapLink supports a wide range of home-related professionals: general contractors, remodelers, home builders, architects, interior designers, landscapers, electricians, plumbers, HVAC, roofing, painting, flooring, cabinet makers, home inspectors, window companies, solar installers, pool builders, and real-estate agents.",
    answerEs: "SnapLink es compatible con una amplia gama de profesionales relacionados con el hogar: contratistas generales, remodeladores, constructores, arquitectos, diseñadores de interiores, paisajistas, electricistas, plomeros, técnicos de HVAC, techadores, pintores, instaladores de pisos, ebanistas, inspectores de casas, empresas de ventanas, instaladores solares, constructores de piscinas y agentes de bienes raíces.",
    published: true,
    lastReviewed: "2026-07-31",
  },
  {
    id: "faq-how-reviews-work",
    category: "professionals",
    questionEn: "How do reviews work?",
    questionEs: "¿Cómo funcionan las reseñas?",
    answerEn: "Southline Living doesn't yet have a built-in ratings or review system on the platform itself. Some professionals link out to reviews on other platforms from their profile when available — we won't state a rating or review count that isn't real.",
    answerEs: "Southline Living aún no cuenta con un sistema de calificaciones o reseñas integrado en la plataforma. Algunos profesionales enlazan a reseñas en otras plataformas desde su perfil cuando están disponibles; no mostramos una calificación o número de reseñas que no sea real.",
    published: true,
    lastReviewed: "2026-07-31",
  },
  {
    id: "faq-how-request-quote",
    category: "quotes",
    questionEn: "How do homeowners request quotes?",
    questionEs: "¿Cómo solicitan los propietarios una cotización?",
    answerEn: "From any professional's profile, click \"Request Quote,\" share a few details about your project, and the professional receives it as a lead and follows up directly.",
    answerEs: "Desde el perfil de cualquier profesional, haz clic en \"Solicitar cotización\", comparte algunos detalles sobre tu proyecto, y el profesional lo recibe como una oportunidad de negocio y te contacta directamente.",
    published: true,
    lastReviewed: "2026-07-31",
  },
  {
    id: "faq-can-book-online",
    category: "booking",
    questionEn: "Can I book online?",
    questionEs: "¿Puedo reservar en línea?",
    answerEn: "Yes. Use \"Book a Consultation\" on the homepage or a professional's profile to submit your project details online — the professional confirms the appointment directly with you.",
    answerEs: "Sí. Usa \"Reservar una consulta\" en la página principal o en el perfil de un profesional para enviar los detalles de tu proyecto en línea; el profesional confirma la cita directamente contigo.",
    published: true,
    lastReviewed: "2026-07-31",
  },
  {
    id: "faq-how-bookings-work",
    category: "booking",
    questionEn: "How do bookings work?",
    questionEs: "¿Cómo funcionan las reservas?",
    answerEn: "A booking request creates a lead for the professional with your name, phone, and project details. The professional reaches out to confirm a time — Southline Living doesn't yet show a live availability calendar.",
    answerEs: "Una solicitud de reserva genera una oportunidad de negocio para el profesional con tu nombre, teléfono y detalles del proyecto. El profesional te contacta para confirmar un horario; Southline Living aún no muestra un calendario de disponibilidad en tiempo real.",
    published: true,
    lastReviewed: "2026-07-31",
  },
  {
    id: "faq-cost-estimator",
    category: "cost_estimates",
    questionEn: "How accurate is the cost estimator?",
    questionEs: "¿Qué tan preciso es el estimador de costos?",
    answerEn: "The project estimator at /planner gives a planning-stage estimate based on the details you provide. It's a starting point, not a final quote — a professional's actual quote may differ once they've assessed your project.",
    answerEs: "El estimador de proyectos en /planner ofrece un estimado en etapa de planificación según los detalles que proporciones. Es un punto de partida, no una cotización final; la cotización real de un profesional puede variar una vez que evalúe tu proyecto.",
    published: true,
    lastReviewed: "2026-07-31",
  },
  {
    id: "faq-diy-vs-pro",
    category: "diy",
    questionEn: "How do I know if a project is DIY or needs a professional?",
    questionEs: "¿Cómo sé si un proyecto es DIY o necesita un profesional?",
    answerEn: "Each DIY guide on Southline Living lists a difficulty level and the tools/materials involved. For electrical, plumbing, structural, roofing, or other regulated or hazardous work, we recommend a licensed professional rather than a DIY approach.",
    answerEs: "Cada guía DIY en Southline Living indica un nivel de dificultad y las herramientas/materiales necesarios. Para trabajos eléctricos, de plomería, estructurales, de techado u otros trabajos regulados o peligrosos, recomendamos un profesional con licencia en lugar de un enfoque DIY.",
    published: true,
    lastReviewed: "2026-07-31",
  },
  {
    id: "faq-how-verified",
    category: "verification",
    questionEn: "How are professionals verified?",
    questionEs: "¿Cómo se verifican los profesionales?",
    answerEn: "Every professional profile on Southline Living is set up through SnapLink's operator-managed onboarding — it isn't an open, unmoderated signup. Professionals may list license information on their profile, but Southline Living does not independently verify licenses against a state registry today.",
    answerEs: "Cada perfil profesional en Southline Living se configura a través del proceso de incorporación gestionado por el equipo de SnapLink; no es un registro abierto sin moderación. Los profesionales pueden incluir información de licencia en su perfil, pero Southline Living aún no verifica licencias de forma independiente contra un registro estatal.",
    published: true,
    lastReviewed: "2026-07-31",
  },
  {
    id: "faq-privacy-policy",
    category: "privacy",
    questionEn: "How is my personal information protected?",
    questionEs: "¿Cómo se protege mi información personal?",
    answerEn: "Information you submit through a quote or booking request is shared only with the professional or agent you're contacting. Southline Living does not have a separate published privacy policy document yet — this answer will be updated with a link once one exists.",
    answerEs: "La información que envías a través de una solicitud de cotización o reserva se comparte únicamente con el profesional o agente al que estás contactando. Southline Living aún no tiene un documento de política de privacidad publicado por separado; esta respuesta se actualizará con un enlace en cuanto exista.",
    published: true,
    lastReviewed: "2026-07-31",
    sourceRef: "No formal privacy policy published yet — flagged for follow-up.",
  },
  {
    id: "faq-how-professionals-join",
    category: "professional_membership",
    questionEn: "How do professionals join SnapLink?",
    questionEs: "¿Cómo se unen los profesionales a SnapLink?",
    answerEn: "Reach out through \"Join SnapLink\" or \"Claim Your Business\" on Southline Living, and the SnapLink team will set up your profile and get you started.",
    answerEs: "Comunícate a través de \"Únete a SnapLink\" o \"Reclama tu negocio\" en Southline Living, y el equipo de SnapLink configurará tu perfil y te ayudará a comenzar.",
    published: true,
    lastReviewed: "2026-07-31",
  },
  {
    id: "faq-membership-includes",
    category: "professional_membership",
    questionEn: "What's included with a SnapLink Profile?",
    questionEs: "¿Qué incluye un Perfil SnapLink?",
    answerEn: "A public digital profile, lead and quote requests routed to you, a booking request flow, and a shareable QR code. Specific plans and pricing vary — reach out via \"Join SnapLink\" for current details.",
    answerEs: "Un perfil digital público, solicitudes de cotización y clientes potenciales dirigidos a ti, un flujo de solicitudes de reserva y un código QR compartible. Los planes y precios específicos varían; comunícate a través de \"Únete a SnapLink\" para conocer los detalles actuales.",
    published: true,
    lastReviewed: "2026-07-31",
  },
];

export function publishedFaqEntries(): FaqEntry[] {
  return FAQ_ENTRIES.filter((e) => e.published);
}

export function faqEntriesByCategory(category: FaqCategory): FaqEntry[] {
  return publishedFaqEntries().filter((e) => e.category === category);
}

function score(entry: FaqEntry, query: string, lang: "en" | "es"): number {
  const q = query.toLowerCase();
  const question = (lang === "es" ? entry.questionEs : entry.questionEn).toLowerCase();
  const answer = (lang === "es" ? entry.answerEs : entry.answerEn).toLowerCase();
  let s = 0;
  if (question.includes(q)) s += 3;
  if (answer.includes(q)) s += 1;
  for (const word of q.split(/\s+/).filter((w) => w.length > 2)) {
    if (question.includes(word)) s += 1;
    if (answer.includes(word)) s += 0.5;
  }
  return s;
}

// Deliberately keyword/substring scoring, not vector/embedding search — this is
// the FAQ system's own explicit boundary: retrieval only over this approved,
// reviewed content, never a general-purpose semantic search.
export function searchFaq(query: string, lang: "en" | "es", category?: FaqCategory, limit = 5): FaqEntry[] {
  const pool = category ? faqEntriesByCategory(category) : publishedFaqEntries();
  if (!query.trim()) return pool.slice(0, limit);
  return pool
    .map((entry) => ({ entry, s: score(entry, query, lang) }))
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((r) => r.entry);
}
