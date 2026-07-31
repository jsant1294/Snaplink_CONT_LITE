export type Lang = "es" | "en";

type UIEntries = typeof UI_DEFS;
export type UIKey = keyof UIEntries;

export const UI_DEFS = {
  // Site name
  siteName: { es: "Southline Living", en: "Southline Living" },
  siteTagline: {
    es: "Ideas para cada hogar. Profesionales de confianza para hacerlas realidad.",
    en: "Ideas for every home. Trusted professionals to bring them to life.",
  },
  siteDescription: {
    es: "Explora espacios inspiradores, planifica tu próximo proyecto y conecta con profesionales locales de confianza.",
    en: "Explore inspiring spaces, plan your next project, and connect with trusted local professionals.",
  },

  // Navigation
  navHome: { es: "Inicio", en: "Home" },
  navIdeas: { es: "Ideas", en: "Ideas" },
  navProjects: { es: "Proyectos", en: "Projects" },
  navDIY: { es: "DIY", en: "DIY" },
  navPros: { es: "Profesionales", en: "Professionals" },
  navBook: { es: "Reservar", en: "Book" },
  navForContractors: { es: "Para contratistas", en: "For contractors" },
  contractorLogin: { es: "Acceso contratistas", en: "Contractor login" },

  // Hero
  heroTitle: {
    es: "Ideas para cada hogar. Profesionales de confianza para hacerlas realidad.",
    en: "Ideas for every home. Trusted professionals to bring them to life.",
  },
  heroSubtitle: {
    es: "Explora espacios inspiradores, planifica tu próximo proyecto y conecta con profesionales locales de Snaplink.",
    en: "Explore inspiring spaces, plan your next project, and connect with local Snaplink professionals.",
  },
  heroSearchPrompt: {
    es: "¿Qué proyecto estás planeando hoy?",
    en: "What project are you planning today?",
  },
  heroExplore: { es: "Explorar ideas", en: "Explore ideas" },
  heroPlan: { es: "Planificar mi proyecto", en: "Plan my project" },
  heroFindPro: { es: "Encontrar un profesional", en: "Find a professional" },
  heroSearch: { es: "Buscar", en: "Search" },

  // Inspiration categories
  inspirationTitle: { es: "Inspírate", en: "Get Inspired" },
  inspirationSubtitle: {
    es: "Explora por categoría y descubre ideas para tu hogar.",
    en: "Browse by category and discover ideas for your home.",
  },
  catCocinas: { es: "Cocinas", en: "Kitchens" },
  catBanos: { es: "Baños", en: "Bathrooms" },
  catPatios: { es: "Patios", en: "Patios" },
  catVidaAlAireLibre: { es: "Vida al aire libre", en: "Outdoor Living" },
  catJardineria: { es: "Jardinería", en: "Gardening" },
  catOficinas: { es: "Oficinas en casa", en: "Home Offices" },
  catGarajes: { es: "Garajes y talleres", en: "Garages & Workshops" },
  catAlmacenamiento: { es: "Almacenamiento", en: "Storage" },
  catAmpliaciones: { es: "Ampliaciones", en: "Home Additions" },
  catReparaciones: { es: "Reparaciones", en: "Repairs" },
  catDIY: { es: "Proyectos DIY", en: "DIY Projects" },
  verMas: { es: "Ver más", en: "See more" },

  // Featured professionals
  featuredTitle: { es: "Profesionales destacados", en: "Featured Professionals" },
  featuredSubtitle: {
    es: "Conecta con profesionales locales de confianza.",
    en: "Connect with trusted local professionals.",
  },
  viewProfile: { es: "Ver perfil", en: "View profile" },
  requestQuote: { es: "Solicitar presupuesto", en: "Request quote" },
  bookNow: { es: "Reservar ahora", en: "Book now" },
  servicesList: { es: "Servicios", en: "Services" },
  serviceArea: { es: "Área de servicio", en: "Service area" },
  verified: { es: "Verificado", en: "Verified" },
  featured: { es: "Destacado", en: "Featured" },
  hablamosEspanol: { es: "Hablamos español", en: "We speak Spanish" },

  // Trending & editorial
  trendingTitle: { es: "Tendencias y proyectos populares", en: "Trending & Popular Projects" },
  trendingSubtitle: {
    es: "Descubre proyectos de temporada, ideas económicas y transformaciones impresionantes.",
    en: "Discover seasonal projects, budget-friendly ideas, and stunning transformations.",
  },
  seasonalTitle: { es: "Proyectos de temporada", en: "Seasonal Projects" },
  budgetTitle: { es: "Mejoras económicas", en: "Budget-Friendly Upgrades" },
  beforeAfterTitle: { es: "Antes y después", en: "Before & After" },
  readMore: { es: "Leer más", en: "Read more" },

  // Project planner (hero CTA)
  plannerTitle: { es: "Planifica tu proyecto", en: "Plan Your Project" },
  plannerDesc: {
    es: "Cuéntanos sobre tu proyecto y recibe un presupuesto estimado, ideas relacionadas y recomendaciones de profesionales.",
    en: "Tell us about your project and get an estimated budget, related ideas, and professional recommendations.",
  },
  startPlanning: { es: "Comenzar a planificar", en: "Start planning" },

  // Contractor recruitment
  forProsTitle: { es: "¿Eres contratista?", en: "Are you a contractor?" },
  forProsSubtitle: {
    es: "Haz crecer tu negocio. Consigue más trabajos locales.",
    en: "Grow your business. Get more local jobs.",
  },
  forProsDesc: {
    es: "Crea una presencia profesional, muestra tu trabajo, recibe oportunidades locales y permite que los propietarios te contacten o reserven directamente.",
    en: "Create a professional presence, showcase your work, receive local opportunities, and let homeowners contact or book you directly.",
  },
  joinSnaplink: { es: "Únete a Snaplink", en: "Join Snaplink" },
  claimBusiness: { es: "Reclama tu negocio", en: "Claim your business" },
  requestDemo: { es: "Solicita una demostración", en: "Request a demo" },

  // Newsletter
  newsletterTitle: { es: "Mantente inspirado", en: "Stay Inspired" },
  newsletterDesc: {
    es: "Recibe ideas, guías de proyectos y consejos directamente en tu bandeja de entrada.",
    en: "Get ideas, project guides, and tips delivered to your inbox.",
  },
  newsletterPlaceholder: { es: "tu@email.com", en: "your@email.com" },
  newsletterSubmit: { es: "Suscribirse", en: "Subscribe" },

  // Footer
  footerTagline: {
    es: "Conectamos propietarios con profesionales de confianza para hacer realidad los proyectos del hogar.",
    en: "Connecting homeowners with trusted professionals to bring home projects to life.",
  },
  footerExplore: { es: "Explorar", en: "Explore" },
  footerContractors: { es: "Contratistas", en: "Contractors" },
  footerJoin: { es: "Únete a Snaplink", en: "Join Snaplink" },
  footerClaim: { es: "Reclama tu negocio", en: "Claim your business" },
  footerCompany: { es: "Compañía", en: "Company" },
  footerAbout: { es: "Acerca de", en: "About" },
  footerContact: { es: "Contacto", en: "Contact" },
  footerPrivacy: { es: "Privacidad", en: "Privacy" },
  footerTerms: { es: "Términos", en: "Terms" },
  footerAccessibility: { es: "Accesibilidad", en: "Accessibility" },
  footerPoweredBy: {
    es: "Southline Living funciona con la tecnología de Snaplink.",
    en: "Southline Living is powered by Snaplink.",
  },
  footerCopyright: {
    es: "© 2026 Southline Living. Todos los derechos reservados.",
    en: "© 2026 Southline Living. All rights reserved.",
  },
  langSwitch: { es: "English", en: "Español" },
  langLabel: { es: "Idioma", en: "Language" },

  // Search
  searchPlaceholder: { es: "Buscar ideas, proyectos, profesionales…", en: "Search ideas, projects, professionals…" },
  searchNoResults: {
    es: "No encontramos resultados para tu búsqueda.",
    en: "No results found for your search.",
  },

  // DIY
  diyTitle: { es: "Proyectos DIY", en: "DIY Projects" },
  diySubtitle: {
    es: "Aprende a hacerlo tú mismo con guías paso a paso.",
    en: "Learn to do it yourself with step-by-step guides.",
  },
  diyDifficulty: { es: "Dificultad", en: "Difficulty" },
  diyTime: { es: "Tiempo estimado", en: "Estimated time" },
  diyBudget: { es: "Presupuesto estimado", en: "Estimated budget" },
  diyEasy: { es: "Fácil", en: "Easy" },
  diyMedium: { es: "Medio", en: "Medium" },
  diyHard: { es: "Avanzado", en: "Advanced" },
  diyHirePro: { es: "Contrata un profesional", en: "Hire a professional" },
  diyStartProject: { es: "Comenzar proyecto", en: "Start project" },
  diyMaterials: { es: "Materiales", en: "Materials" },
  diyTools: { es: "Herramientas", en: "Tools" },
  diySteps: { es: "Pasos", en: "Steps" },

  // Booking
  bookingTitle: { es: "Reserva una consulta", en: "Book a Consultation" },
  bookingDesc: {
    es: "Cuéntanos sobre tu proyecto y un profesional te contactará.",
    en: "Tell us about your project and a professional will reach out.",
  },
  bookingSubmit: { es: "Enviar solicitud", en: "Submit request" },
  bookingConfirm: {
    es: "Solicitud enviada. El profesional te contactará pronto.",
    en: "Request sent. The professional will contact you soon.",
  },
  bookingProjectType: { es: "Tipo de proyecto", en: "Project type" },
  bookingDetails: { es: "Detalles del proyecto", en: "Project details" },
  bookingName: { es: "Nombre completo", en: "Full name" },
  bookingPhone: { es: "Teléfono", en: "Phone" },
  bookingEmail: { es: "Correo electrónico", en: "Email" },
  bookingLocation: { es: "Ubicación del proyecto", en: "Project location" },
  bookingTimeline: { es: "¿Cuándo te gustaría comenzar?", en: "When would you like to start?" },
  bookingBudget: { es: "Rango de presupuesto", en: "Budget range" },
  bookingPhotos: { es: "Agrega fotos (opcional)", en: "Add photos (optional)" },

  // Errors and states
  loading: { es: "Cargando…", en: "Loading…" },
  errorGeneric: {
    es: "Algo salió mal. Intenta de nuevo.",
    en: "Something went wrong. Please try again.",
  },
  emptyState: {
    es: "No hay contenido disponible en este momento.",
    en: "No content available at the moment.",
  },

  // Agent profiles (Snaplink Profile)
  navAgents: { es: "Agentes", en: "Agents" },
  featuredAgentsEyebrow: { es: "Bienes raíces", en: "Real estate" },
  featuredAgentsTitle: {
    es: "Profesionales inmobiliarios destacados",
    en: "Featured Local Real Estate Professionals",
  },
  featuredAgentsSubtitle: {
    es: "Conecta con agentes locales verificados de Snaplink.",
    en: "Connect with verified local Snaplink real estate professionals.",
  },
  agentsDirectoryTitle: { es: "Directorio de agentes", en: "Agent directory" },
  agentsDirectoryEmpty: {
    es: "Aún no hay perfiles activos.",
    en: "No active profiles yet.",
  },
  contactAgent: { es: "Contactar agente", en: "Contact agent" },
  callNow: { es: "Llamar", en: "Call" },
  textUs: { es: "Enviar mensaje", en: "Text" },
  emailAgent: { es: "Correo", en: "Email" },
  aboutAgent: { es: "Acerca del agente", en: "About the agent" },
  specialties: { es: "Especialidades", en: "Specialties" },
  languages: { es: "Idiomas", en: "Languages" },
  serviceAreasLabel: { es: "Áreas de servicio", en: "Featured communities" },
  yearsExperience: { es: "Años de experiencia", en: "Years of experience" },
  agentLicense: { es: "Licencia", en: "License" },
  saveContact: { es: "Guardar contacto", en: "Save Contact" },
  poweredBySnaplinkProfile: {
    es: "Impulsado por Snaplink Profile",
    en: "Powered by Snaplink Profile",
  },

  // Agent recruitment
  agentRecruitmentHeadline: {
    es: "Convierte tu reputación local en una presencia digital profesional.",
    en: "Turn your local reputation into a professional digital presence.",
  },
  agentRecruitmentSubcopy: {
    es: "Tu perfil de Snaplink reúne tus propiedades, reseñas, experiencia local, opciones de contacto y herramientas de reserva en un solo destino profesional.",
    en: "Your Snaplink Profile brings your listings, reviews, local expertise, contact options, and booking tools together in one professional destination.",
  },
  createAgentProfile: { es: "Crea tu perfil de agente", en: "Create your agent profile" },
  claimAgentProfile: { es: "Reclama tu perfil", en: "Claim your profile" },
  requestAgentDemo: { es: "Solicita una demostración", en: "Request a demo" },
  viewAgentPlans: { es: "Ver planes", en: "View profile plans" },
  agentRequestFormTitle: { es: "Solicita tu perfil de Snaplink", en: "Request your Snaplink Profile" },
  agentRequestName: { es: "Nombre completo", en: "Full name" },
  agentRequestEmail: { es: "Correo electrónico", en: "Email" },
  agentRequestPhone: { es: "Teléfono", en: "Phone" },
  agentRequestServiceArea: { es: "Área de servicio", en: "Service area" },
  agentRequestBrokerage: { es: "Correduría", en: "Brokerage" },
  agentRequestSubmit: { es: "Enviar solicitud", en: "Submit request" },
  agentRequestSuccess: {
    es: "¡Gracias! Un operador revisará tu solicitud en breve.",
    en: "Thanks! An operator will review your request shortly.",
  },
};

export function t(key: UIKey, lang: Lang): string {
  return UI_DEFS[key][lang];
}
