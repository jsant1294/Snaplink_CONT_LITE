// ---------------------------------------------------------------------------
// Landing page starter copy, one preset per profession type (lib/profession-types.ts).
// "Start from a template" fills these into the editor; the contractor can edit
// everything after. Deliberately generic — no per-contractor specifics.
// ---------------------------------------------------------------------------

export interface LandingTemplate {
  headlineEn: string;
  headlineEs: string;
  subheadlineEn: string;
  subheadlineEs: string;
  ctaLabelEn: string;
  ctaLabelEs: string;
}

export const LANDING_TEMPLATES: Record<string, LandingTemplate> = {
  contractor: {
    headlineEn: "Quality work, done right the first time.",
    headlineEs: "Trabajo de calidad, bien hecho desde el principio.",
    subheadlineEn: "Licensed and insured general contracting for projects big and small.",
    subheadlineEs: "Contratista general con licencia y seguro para proyectos grandes y pequeños.",
    ctaLabelEn: "Get a Free Quote",
    ctaLabelEs: "Pedir Presupuesto Gratis",
  },
  remodeler: {
    headlineEn: "Your home, reimagined.",
    headlineEs: "Tu casa, renovada.",
    subheadlineEn: "Kitchen, bath, and whole-home remodels built around how you actually live.",
    subheadlineEs: "Remodelaciones de cocina, baño y toda la casa, hechas para cómo realmente vives.",
    ctaLabelEn: "Start Your Remodel",
    ctaLabelEs: "Comenzar mi Remodelación",
  },
  home_builder: {
    headlineEn: "Custom homes, built to last.",
    headlineEs: "Casas a medida, hechas para durar.",
    subheadlineEn: "From foundation to finish, we build the home you've been planning.",
    subheadlineEs: "Desde los cimientos hasta el último detalle, construimos la casa que has estado planeando.",
    ctaLabelEn: "Talk to a Builder",
    ctaLabelEs: "Hablar con un Constructor",
  },
  interior_designer: {
    headlineEn: "Spaces that feel like you.",
    headlineEs: "Espacios que se sienten como tú.",
    subheadlineEn: "Full-service interior design, from concept to the last throw pillow.",
    subheadlineEs: "Diseño de interiores completo, desde el concepto hasta el último detalle.",
    ctaLabelEn: "Book a Design Consult",
    ctaLabelEs: "Agendar una Consulta",
  },
  architect: {
    headlineEn: "Thoughtful design, built to code.",
    headlineEs: "Diseño cuidadoso, construido conforme al código.",
    subheadlineEn: "Residential and light commercial architecture, from first sketch to permit.",
    subheadlineEs: "Arquitectura residencial y comercial ligera, desde el primer boceto hasta el permiso.",
    ctaLabelEn: "Discuss Your Project",
    ctaLabelEs: "Hablar de mi Proyecto",
  },
  landscaper: {
    headlineEn: "Outdoor spaces worth coming home to.",
    headlineEs: "Espacios exteriores que vale la pena disfrutar.",
    subheadlineEn: "Design, install, and maintenance for lawns and landscapes that thrive.",
    subheadlineEs: "Diseño, instalación y mantenimiento para jardines que prosperan.",
    ctaLabelEn: "Get a Free Estimate",
    ctaLabelEs: "Pedir Presupuesto Gratis",
  },
  electrician: {
    headlineEn: "Licensed electrical work, done safely.",
    headlineEs: "Trabajo eléctrico con licencia, hecho con seguridad.",
    subheadlineEn: "Repairs, upgrades, and installs from a licensed, insured electrician.",
    subheadlineEs: "Reparaciones, mejoras e instalaciones de un electricista con licencia y seguro.",
    ctaLabelEn: "Request Service",
    ctaLabelEs: "Solicitar Servicio",
  },
  plumber: {
    headlineEn: "Fast, reliable plumbing you can trust.",
    headlineEs: "Plomería rápida y confiable en la que puedes confiar.",
    subheadlineEn: "From leaky faucets to full repipes — licensed plumbing, done right.",
    subheadlineEs: "Desde grifos que gotean hasta repiping completo — plomería con licencia, bien hecha.",
    ctaLabelEn: "Request Service",
    ctaLabelEs: "Solicitar Servicio",
  },
  hvac: {
    headlineEn: "Stay comfortable, all year long.",
    headlineEs: "Comodidad todo el año.",
    subheadlineEn: "Heating and cooling repair, replacement, and maintenance you can count on.",
    subheadlineEs: "Reparación, reemplazo y mantenimiento de calefacción y aire acondicionado en los que puedes confiar.",
    ctaLabelEn: "Schedule Service",
    ctaLabelEs: "Agendar Servicio",
  },
  roofing: {
    headlineEn: "A roof that protects what matters.",
    headlineEs: "Un techo que protege lo que importa.",
    subheadlineEn: "Repairs, replacements, and inspections from a trusted local roofing crew.",
    subheadlineEs: "Reparaciones, reemplazos e inspecciones de un equipo de techado local de confianza.",
    ctaLabelEn: "Get a Free Roof Estimate",
    ctaLabelEs: "Pedir Presupuesto de Techo Gratis",
  },
  painting: {
    headlineEn: "A fresh coat changes everything.",
    headlineEs: "Una mano de pintura nueva lo cambia todo.",
    subheadlineEn: "Interior and exterior painting with clean lines and no shortcuts.",
    subheadlineEs: "Pintura interior y exterior con líneas limpias y sin atajos.",
    ctaLabelEn: "Get a Free Quote",
    ctaLabelEs: "Pedir Presupuesto Gratis",
  },
  flooring: {
    headlineEn: "Floors that make an entrance.",
    headlineEs: "Pisos que hacen una entrada.",
    subheadlineEn: "Hardwood, tile, LVP, and carpet — installed clean, on schedule.",
    subheadlineEs: "Madera, azulejo, LVP y alfombra — instalados con limpieza y a tiempo.",
    ctaLabelEn: "Get a Free Estimate",
    ctaLabelEs: "Pedir Presupuesto Gratis",
  },
  cabinet_maker: {
    headlineEn: "Cabinetry built for how you live.",
    headlineEs: "Gabinetes hechos para cómo vives.",
    subheadlineEn: "Custom cabinets and built-ins, crafted to fit your space exactly.",
    subheadlineEs: "Gabinetes y muebles empotrados a medida, hechos para tu espacio exacto.",
    ctaLabelEn: "Start a Custom Order",
    ctaLabelEs: "Iniciar un Pedido a Medida",
  },
  home_inspector: {
    headlineEn: "Know before you close.",
    headlineEs: "Infórmate antes de cerrar.",
    subheadlineEn: "Thorough, honest home inspections with a report you can actually use.",
    subheadlineEs: "Inspecciones de vivienda minuciosas y honestas, con un informe que realmente puedes usar.",
    ctaLabelEn: "Schedule an Inspection",
    ctaLabelEs: "Agendar una Inspección",
  },
  window_company: {
    headlineEn: "Windows that pay for themselves.",
    headlineEs: "Ventanas que se pagan solas.",
    subheadlineEn: "Energy-efficient window replacement and installation, measured twice, installed once.",
    subheadlineEs: "Reemplazo e instalación de ventanas eficientes, medidas dos veces, instaladas una sola vez.",
    ctaLabelEn: "Get a Free Quote",
    ctaLabelEs: "Pedir Presupuesto Gratis",
  },
  solar: {
    headlineEn: "Own your power.",
    headlineEs: "Sé dueño de tu energía.",
    subheadlineEn: "Solar design and installation that actually lowers your bill.",
    subheadlineEs: "Diseño e instalación solar que realmente reduce tu factura.",
    ctaLabelEn: "Get a Free Solar Quote",
    ctaLabelEs: "Pedir Cotización Solar Gratis",
  },
  pool_builder: {
    headlineEn: "Your backyard, upgraded.",
    headlineEs: "Tu patio, mejorado.",
    subheadlineEn: "Custom pool design and construction, from first dig to first swim.",
    subheadlineEs: "Diseño y construcción de piscinas a medida, desde la excavación hasta el primer chapuzón.",
    ctaLabelEn: "Get a Free Pool Quote",
    ctaLabelEs: "Pedir Cotización de Piscina Gratis",
  },
};

export function landingTemplateFor(professionTypeId: string): LandingTemplate {
  return LANDING_TEMPLATES[professionTypeId] ?? LANDING_TEMPLATES.contractor;
}
