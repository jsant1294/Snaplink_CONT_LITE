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
  navHomes: { es: "Casas", en: "Homes" },
  navRentals: { es: "Alquileres y Escapadas", en: "Rentals & Getaways" },
  navIdeas: { es: "Ideas", en: "Ideas" },
  navProjects: { es: "Proyectos", en: "Projects" },
  navDIY: { es: "Hazlo Tú Mismo", en: "DIY" },
  navPros: { es: "Profesionales", en: "Professionals" },
  navBook: { es: "Reservar", en: "Book" },
  navForContractors: { es: "Para contratistas", en: "For contractors" },
  contractorLogin: { es: "Acceso contratistas", en: "Contractor login" },

  // Hero
  heroTitle: {
    es: "Todo el hogar. Un solo lugar de confianza.",
    en: "Everything Home. One Trusted Place.",
  },
  heroSubtitle: {
    es: "Southline Living es el mercado de confianza para el hogar, impulsado por SnapLink. Descubre casas, profesionales de confianza, vecindarios, ideas de remodelación y servicios locales, todo desde una sola plataforma conectada.",
    en: "Southline Living is the trusted home marketplace powered by SnapLink. Discover homes, trusted professionals, neighborhoods, remodeling ideas, and local services — all from one connected platform.",
  },
  heroSearchPrompt: {
    es: "Buscar casas, profesionales, vecindarios, proyectos o ideas...",
    en: "Search homes, professionals, neighborhoods, projects, or ideas...",
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
  seasonalCardDesc: {
    es: "Prepara tu hogar para la temporada con proyectos oportunos y de alto impacto.",
    en: "Get your home ready for the season with timely, high-impact projects.",
  },
  budgetTitle: { es: "Mejoras económicas", en: "Budget-Friendly Upgrades" },
  budgetCardDesc: {
    es: "Mejoras con gran impacto visual sin romper el presupuesto.",
    en: "High-impact upgrades that won't stretch your budget.",
  },
  beforeAfterTitle: { es: "Antes y después", en: "Before & After" },
  beforeAfterCardDesc: {
    es: "Transformaciones reales de hogares hechas por profesionales de Snaplink.",
    en: "Real home transformations completed by Snaplink professionals.",
  },
  viewProjects: { es: "Ver proyectos", en: "View Projects" },
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
  footerProfessionals: { es: "Profesionales", en: "Professionals" },
  footerJoin: { es: "Únete a Snaplink", en: "Join Snaplink" },
  footerClaim: { es: "Reclama tu negocio", en: "Claim your business" },
  footerAgentProfiles: { es: "Perfiles de agentes", en: "Agent profiles" },
  footerCompany: { es: "Compañía", en: "Company" },
  footerAbout: { es: "Acerca de", en: "About" },
  footerContact: { es: "Contacto", en: "Contact" },
  footerFaq: { es: "Preguntas frecuentes", en: "FAQ" },
  footerSnaplink: { es: "SnapLink", en: "SnapLink" },
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
  resultsTitle: { es: "Profesionales del hogar", en: "Home Services & Professionals" },
  resultsSubtitle: {
    es: "Profesionales locales de confianza para tu próximo proyecto.",
    en: "Trusted local professionals for your next project.",
  },
  resultsEmpty: {
    es: "No encontramos profesionales que coincidan con tu búsqueda.",
    en: "No professionals matched your search.",
  },
  resultsAll: { es: "Todos los servicios", en: "All services" },
  resultsFilterLabel: { es: "Filtrar por servicio", en: "Filter by service" },
  resultsViewAll: { es: "Ver todos los resultados", en: "View all results" },
  licensedProfessional: { es: "Profesional certificado", en: "Licensed Professional" },
  catalogEmptyTitle: {
    es: "Aún no hay profesionales publicados en esta categoría.",
    en: "No published professionals are available in this category yet.",
  },
  catalogEmptyBody: {
    es: "Vuelve pronto o explora otro servicio del hogar.",
    en: "Check back soon or explore another home service.",
  },
  catalogEmptyExplore: { es: "Explorar todos los servicios", en: "Explore all services" },

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
  noProfessionalsYet: {
    es: "Aún no tenemos profesionales en esta categoría. Explora todos los servicios disponibles.",
    en: "We don't have professionals in this category yet. Browse all available services.",
  },
  browseAllServices: { es: "Ver todos los servicios", en: "Browse all services" },
  trustedProfessionalsNetwork: {
    es: "Profesionales de confianza a través de la red Snaplink",
    en: "Trusted professionals through the Snaplink network",
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
  visitWebsite: { es: "Visitar sitio web", en: "Visit Website" },
  viewFullSnaplinkProfile: { es: "Ver perfil completo de SnapLink", en: "View Full SnapLink Profile" },

  // Unified professional profile — profession-neutral copy for the shared
  // agent_profiles model, so one identity renders correctly for real estate
  // agents AND trades/services (contractors, architects, photographers, ...).
  professionalDirectoryEyebrow: { es: "Profesionales", en: "Professionals" },
  professionalDirectoryTitle: {
    es: "Directorio de profesionales",
    en: "Professional directory",
  },
  aboutProfessional: { es: "Acerca de", en: "About" },

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

  // Homepage real estate entry block
  heroRealEstateLink: {
    es: "¿Buscas una casa? Explora propiedades locales.",
    en: "Looking for a home? Explore local listings.",
  },
  exploreHomes: { es: "Explorar propiedades", en: "Explore homes" },
  findAnAgent: { es: "Encontrar un agente", en: "Find an agent" },
  exploreCommunities: { es: "Explorar comunidades", en: "Explore communities" },
  viewProperty: { es: "Ver propiedad", en: "View property" },
  viewHome: { es: "Ver casa", en: "View Home" },
  scheduleShowing: { es: "Agendar visita", en: "Schedule Showing" },
  listedBy: { es: "Publicado por", en: "Listed by" },
  verifiedAgent: { es: "Verificado", en: "Verified" },
  realEstateNoProperty: {
    es: "Aún no hay una propiedad destacada.",
    en: "No featured property yet.",
  },
  realEstateRecruitmentHeadline: {
    es: "¿Eres profesional inmobiliario?",
    en: "Are you a real estate professional?",
  },
  realEstateRecruitmentBody: {
    es: "Crea tu presencia digital y permite que compradores y vendedores locales te encuentren con un perfil Snaplink.",
    en: "Build your digital presence and get discovered by local buyers and sellers with a Snaplink Profile.",
  },

  // Homepage: Featured Homes
  featuredHomesEyebrow: { es: "Propiedades", en: "Homes" },
  featuredHomesTitle: { es: "Casas destacadas", en: "Featured Homes" },
  featuredHomesSubtitle: {
    es: "Más propiedades publicadas por profesionales locales de Snaplink.",
    en: "More properties published by local Snaplink real estate professionals.",
  },
  viewAllHomes: { es: "Ver todas las casas", en: "View all homes" },

  // Homepage: Featured Services Marketplace
  featuredServicesEyebrow: { es: "SERVICIOS PARA EL HOGAR • PROFESIONALES DE CONFIANZA", en: "HOME SERVICES • TRUSTED PROFESSIONALS" },
  featuredServicesTitle: {
    es: "Encuentra profesionales de confianza para cada proyecto.",
    en: "Find trusted professionals for every project.",
  },
  featuredServicesSubtitle: {
    es: "Ya sea que estés remodelando, reparando, diseñando o dando mantenimiento a tu hogar, descubre profesionales locales de confianza impulsados por SnapLink. Cada profesional tiene un Perfil SnapLink verificado donde puedes conocer más, solicitar una cotización, agendar citas y mantenerte conectado.",
    en: "Whether you're remodeling, repairing, designing, or maintaining your home, discover trusted local professionals powered by SnapLink. Every professional has a verified SnapLink Profile where you can learn more, request a quote, schedule appointments, and stay connected.",
  },
  featuredProject: { es: "Proyecto destacado", en: "Featured Project" },
  bookConsultationCta2: { es: "Reservar consulta", en: "Book Consultation" },
  snaplinkVerified: { es: "SnapLink Verificado", en: "SnapLink Verified" },
  profilePoweredBySnaplink: { es: "Perfil impulsado por SnapLink", en: "Profile powered by SnapLink" },
  servicesRecruitmentHeadline: { es: "¿Eres un profesional local?", en: "Are you a local professional?" },
  servicesRecruitmentBody: {
    es: "Únete a la red SnapLink y haz crecer tu negocio con un perfil digital moderno, productos NFC inteligentes, reservas, reseñas y generación de clientes potenciales.",
    en: "Join the SnapLink network and grow your business with a modern digital profile, smart NFC products, booking, reviews, and lead generation.",
  },
  createSnaplinkProfile: { es: "Crear perfil SnapLink", en: "Create SnapLink Profile" },
  claimYourBusiness: { es: "Reclama tu negocio", en: "Claim Your Business" },
  viewPlans: { es: "Ver planes", en: "View Plans" },
  exploreProfessionals: { es: "Explorar profesionales", en: "Explore Professionals" },
  findByTrade: { es: "Buscar por oficio", en: "Find by Trade" },
  browseCategories: { es: "Explorar categorías", en: "Browse Categories" },

  // Homepage: Powered by SnapLink
  poweredBySnaplinkEyebrow: { es: "SNAPLINK", en: "SNAPLINK" },
  poweredBySnaplinkTitle: { es: "Impulsado por SnapLink", en: "Powered by SnapLink" },
  poweredBySnaplinkSubtitle: { es: "La tecnología detrás de cada conexión de confianza.", en: "The technology behind every trusted connection." },
  poweredBySnaplinkBody: {
    es: "Southline Living está impulsado por SnapLink, una plataforma profesional que ayuda a negocios locales de confianza a conectar con propietarios a través de perfiles digitales modernos, herramientas de reserva, reseñas, tecnología NFC sin contacto y experiencias inteligentes para el cliente. Ya sea que te conectes con un contratista, agente inmobiliario, arquitecto, diseñador, paisajista o fotógrafo, cada Perfil SnapLink mantiene todo en un solo lugar.",
    en: "Southline Living is powered by SnapLink — a professional platform that helps trusted local businesses connect with homeowners through modern digital profiles, booking tools, reviews, contactless NFC technology, and smart customer experiences. Whether you connect with a contractor, real estate agent, architect, designer, landscaper, or photographer, every SnapLink Profile keeps everything in one place.",
  },
  snaplinkGrowHeadline: { es: "Haz crecer tu negocio con SnapLink", en: "Grow Your Business with SnapLink" },
  snaplinkGrowBody: {
    es: "Ya seas contratista, agente inmobiliario, arquitecto, diseñador, paisajista, fotógrafo u otro profesional local, SnapLink te ayuda a generar confianza, recibir clientes potenciales, simplificar las reservas y hacer crecer tu negocio.",
    en: "Whether you're a contractor, realtor, architect, designer, landscaper, photographer, or another local professional, SnapLink helps you build trust, receive leads, simplify booking, and grow your business.",
  },
  viewDemoProfile: { es: "Ver perfil de muestra", en: "View Demo Profile" },
  learnMore: { es: "Más información", en: "Learn More" },
  professionalLogin: { es: "Acceso profesional", en: "Professional Login" },
  whyTrustSnaplink: { es: "Por qué los propietarios confían en SnapLink", en: "Why Homeowners Trust SnapLink" },
  consumerJourneyTitle: { es: "El recorrido del propietario", en: "The Homeowner Journey" },
  professionalJourneyTitle: { es: "El recorrido del profesional", en: "The Professional Journey" },

  // Lucio assistant
  lucioName: { es: "Lucio", en: "Lucio" },
  lucioTagline: { es: "Tu asistente de planificación del hogar", en: "Your home-planning assistant" },
  startPlanningWithLucio: { es: "Empezar a planificar con Lucio", en: "Start Planning with Lucio" },
  lucioWelcome: {
    es: "Hola, soy Lucio. Puedo ayudarte a encontrar una casa, encontrar un profesional, planificar un proyecto, o responder preguntas.",
    en: "Hi, I'm Lucio. I can help you find a home, find a professional, plan a project, or answer questions.",
  },
  lucioPromptFindHome: { es: "Quiero encontrar una casa", en: "I want to find a home" },
  lucioPromptFindPro: { es: "Necesito un profesional", en: "I need a professional" },
  lucioPromptPlanProject: { es: "Estoy planificando un proyecto", en: "I am planning a project" },
  lucioPromptCostEstimate: { es: "Quiero un estimado de costo", en: "I want a cost estimate" },
  lucioPromptDiyHelp: { es: "Necesito ayuda con DIY", en: "I need DIY help" },
  lucioPromptBook: { es: "Quiero reservar una consulta", en: "I want to book a consultation" },
  lucioInputPlaceholder: { es: "Escribe tu pregunta...", en: "Type your question..." },
  lucioSend: { es: "Enviar", en: "Send" },
  lucioClose: { es: "Cerrar", en: "Close" },
  lucioConfirmLead: { es: "Confirmar solicitud", en: "Confirm Request" },
  lucioConfirmBooking: { es: "Confirmar reserva", en: "Confirm Booking" },
  lucioCancel: { es: "Cancelar", en: "Cancel" },
  lucioLeadSubmitted: { es: "¡Listo! Tu solicitud fue enviada.", en: "Done! Your request has been sent." },
  lucioReviewBeforeSending: { es: "Revisa antes de enviar:", en: "Review before sending:" },

  // Homepage: DIY Learning
  diyLearningEyebrow: { es: "Aprende", en: "Learn" },
  diyLearningTitle: { es: "Centro de aprendizaje DIY", en: "DIY Learning" },
  diyLearningSubtitle: {
    es: "Guías paso a paso con dificultad, tiempo y costo estimado.",
    en: "Step-by-step guides with difficulty, time, and estimated cost.",
  },
  exploreDiyProjects: { es: "Explorar proyectos DIY", en: "Explore DIY projects" },

  // Homepage: Seasonal Ideas
  seasonalIdeasEyebrow: { es: "De temporada", en: "Seasonal" },
  seasonalIdeasHeadline: {
    es: "Ideas de temporada para tu hogar",
    en: "Seasonal ideas for your home",
  },
  seasonalIdeasBody: {
    es: "Desde preparar tu jardín hasta acondicionar tu hogar para el próximo cambio de clima — encuentra inspiración a tiempo.",
    en: "From getting your garden ready to prepping your home for the next season — find inspiration right on time.",
  },
  seasonalIdeasCta: { es: "Ver ideas de temporada", en: "See seasonal ideas" },

  // Homepage: Cost Estimator
  costEstimatorEyebrow: { es: "Planifica", en: "Plan" },
  costEstimatorTitle: { es: "Estima el costo de tu proyecto", en: "Estimate your project cost" },
  costEstimatorBody: {
    es: "Cuéntanos tu idea y te conectamos con un profesional de Snaplink listo para dar el siguiente paso.",
    en: "Tell us your idea and we'll connect you with a Snaplink professional ready for the next step.",
  },
  costEstimatorCta: { es: "Iniciar mi estimado", en: "Start my estimate" },

  // Homepage: Book Consultation
  bookConsultationEyebrow: { es: "Reserva", en: "Book" },
  bookConsultationTitle: { es: "Reserva una consulta", en: "Book a consultation" },
  bookConsultationBody: {
    es: "Agenda una llamada, visita o consulta virtual directamente con un profesional local.",
    en: "Schedule a call, visit, or virtual consultation directly with a local professional.",
  },
  bookConsultationCta: { es: "Reservar ahora", en: "Book now" },

  // Homepage: Become a SnapLink Professional
  becomeAProEyebrow: { es: "Snaplink · Conecta. Toca. Crece.", en: "Snaplink · Connect. Tap. Grow." },
  becomeAProTitle: { es: "Conviértete en profesional Snaplink", en: "Become a SnapLink Professional" },
  becomeAProBody: {
    es: "Contratistas, remodeladores, diseñadores, arquitectos y más — muestra tu trabajo, genera confianza y recibe oportunidades locales con tu propio perfil Snaplink.",
    en: "Contractors, remodelers, designers, architects, and more — showcase your work, build trust, and receive local opportunities with your own Snaplink Profile.",
  },
  becomeAProJoin: { es: "Únete a Snaplink", en: "Join Snaplink" },
  becomeAProClaim: { es: "Reclama tu negocio", en: "Claim your business" },
  becomeAProLogin: { es: "Acceso profesionales", en: "Professional login" },

  // Contact page + business info
  contactEyebrow: { es: "Contacto", en: "Contact" },
  contactHeading: { es: "Hablemos de tu proyecto", en: "Let's talk about your project" },
  contactBody: {
    es: "Estamos aquí para ayudarte a dar el siguiente paso en tu proyecto. Llámanos, escríbenos o visítanos.",
    en: "We're here to help you take the next step on your project. Call, write, or visit us.",
  },
  contactBusinessLabel: { es: "Nuestro negocio", en: "Our business" },
  contactPhoneLabel: { es: "Teléfono", en: "Phone" },
  contactEmailLabel: { es: "Correo electrónico", en: "Email" },
  contactWhatsAppLabel: { es: "WhatsApp", en: "WhatsApp" },
  contactAddressLabel: { es: "Dirección", en: "Address" },
  contactHoursLabel: { es: "Horario de atención", en: "Business hours" },
  contactDirectionsLabel: { es: "Cómo llegar", en: "Get directions" },
  contactCtaLabel: { es: "Contáctanos", en: "Contact us" },
  contactMethodsLabel: { es: "Canales de contacto", en: "Contact methods" },

  // Testimonials
  testimonialsEyebrow: { es: "Testimonios", en: "Testimonials" },
  testimonialsHeading: { es: "Lo que dicen los propietarios", en: "What homeowners say" },
  testimonialsBody: {
    es: "Historias reales de proyectos y conexiones a través de Southline Living.",
    en: "Real stories from projects and connections made through Southline Living.",
  },
  testimonialsReviewCta: { es: "Deja una reseña", en: "Leave a review" },
  testimonialsFeaturedBadge: { es: "Destacado", en: "Featured" },

  // Homepage: SnapLink Local cross-promo
  localPromoEyebrow: { es: "SnapLink Local", en: "SnapLink Local" },
  localPromoTitle: {
    es: "¿Buscas más que servicios para el hogar?",
    en: "Looking for more than home services?",
  },
  localPromoBody: {
    es: "Southline Living se especializa en todo lo que necesitas para ser dueño y cuidar de tu hogar. Cuando quieras explorar el resto de tu vecindario — restaurantes, comercios, servicios y más — SnapLink Local reúne opciones locales verificadas en un solo lugar.",
    en: "Southline Living specializes in everything you need to own and care for your home. When you're ready to explore the rest of your neighborhood — restaurants, shops, services, and more — SnapLink Local brings verified local options together in one place.",
  },
  localPromoCta: { es: "Explorar SnapLink Local", en: "Explore SnapLink Local" },
  localPromoPoweredBy: {
    es: "Impulsado por la red SnapLink",
    en: "Powered by the SnapLink Network",
  },

  // Local discovery (SnapLink directory hand-off)
  localDiscoveryEyebrow: { es: "Local", en: "Local" },
  localDiscoveryTitle: {
    es: "Encuentra profesionales de confianza cerca de ti",
    en: "Find trusted professionals near you",
  },
  localDiscoveryDescription: {
    es: "Ingresa tu código postal para explorar profesionales locales en SnapLink.",
    en: "Enter your ZIP code to browse local professionals powered by SnapLink.",
  },
  localDiscoveryZipLabel: { es: "Código postal (ZIP)", en: "ZIP code" },
  localDiscoveryZipPlaceholder: { es: "ej. 75204", en: "e.g. 75204" },
  localDiscoveryCategoryLabel: { es: "Categoría", en: "Category" },
  localDiscoveryCategoryAny: { es: "Todas las categorías", en: "All categories" },
  localDiscoverySubmit: { es: "Continuar a SnapLink", en: "Continue to SnapLink" },
  localDiscoveryPoweredBy: {
    es: "Impulsado por la red profesional de SnapLink",
    en: "Powered by the SnapLink professional network",
  },
  localDiscoveryExternalNote: {
    es: "Continuarás en SnapLink, el directorio de profesionales.",
    en: "You'll continue to SnapLink, the professional directory.",
  },
  localDiscoveryZipError: {
    es: "Ingresa un código postal válido de EE. UU. (ej. 75204 o 75204-1234).",
    en: "Enter a valid US ZIP code (e.g. 75204 or 75204-1234).",
  },
  localDiscoveryRoutingError: {
    es: "No se pudo abrir esa selección. Inténtalo de nuevo.",
    en: "Couldn't open that selection. Please try again.",
  },
};

export function t(key: UIKey, lang: Lang): string {
  return UI_DEFS[key][lang];
}
