// ---------------------------------------------------------------------------
// SnapLink Contractor — Service Library
// General-contractor + handyman catalog: 45+ services grouped by trade,
// fully bilingual, each mapped to a question set. Canonical value = EN name.
// ---------------------------------------------------------------------------

import type { Lang } from "./i18n";

export interface ServiceCategory {
  id: string;
  en: string;
  es: string;
}

export interface ServiceDef {
  name: string; // canonical EN — stored on leads
  es: string;
  category: string; // category id
  questionSet: string; // key into QUESTION_SET_MAP (lib/questions.ts)
}

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  { id: "remodeling", en: "Remodeling & Interior", es: "Remodelación e Interiores" },
  { id: "paint_drywall", en: "Painting & Drywall", es: "Pintura y Tablaroca" },
  { id: "flooring", en: "Flooring", es: "Pisos" },
  { id: "roof_exterior", en: "Roofing & Exterior", es: "Techos y Exterior" },
  { id: "plumbing", en: "Plumbing", es: "Plomería" },
  { id: "electrical", en: "Electrical", es: "Electricidad" },
  { id: "hvac", en: "HVAC", es: "Climatización (HVAC)" },
  { id: "outdoor", en: "Outdoor & Landscape", es: "Exteriores y Jardín" },
  { id: "concrete", en: "Concrete & Masonry", es: "Concreto y Albañilería" },
  { id: "handyman", en: "Handyman & General", es: "Reparaciones Generales" },
];

export const SERVICE_LIBRARY: ServiceDef[] = [
  // Remodeling & Interior
  { name: "Kitchen Remodel", es: "Remodelación de Cocina", category: "remodeling", questionSet: "remodeling" },
  { name: "Bathroom Remodel", es: "Remodelación de Baño", category: "remodeling", questionSet: "remodeling" },
  { name: "Basement Finishing", es: "Acabado de Sótano", category: "remodeling", questionSet: "remodeling" },
  { name: "Room Addition", es: "Ampliación de Habitación", category: "remodeling", questionSet: "remodeling" },
  { name: "Countertops", es: "Encimeras / Cubiertas", category: "remodeling", questionSet: "remodeling" },
  { name: "Cabinets & Vanities", es: "Gabinetes y Tocadores", category: "remodeling", questionSet: "remodeling" },
  { name: "Tile Work", es: "Trabajo de Azulejo", category: "remodeling", questionSet: "remodeling" },
  { name: "Trim & Molding", es: "Molduras y Acabados", category: "remodeling", questionSet: "remodeling" },
  { name: "Closet Systems", es: "Sistemas de Clóset", category: "remodeling", questionSet: "remodeling" },

  // Painting & Drywall
  { name: "Interior Painting", es: "Pintura Interior", category: "paint_drywall", questionSet: "painting" },
  { name: "Exterior Painting", es: "Pintura Exterior", category: "paint_drywall", questionSet: "painting" },
  { name: "Cabinet Painting", es: "Pintura de Gabinetes", category: "paint_drywall", questionSet: "painting" },
  { name: "Drywall Install / Repair", es: "Instalación / Reparación de Tablaroca", category: "paint_drywall", questionSet: "drywall" },
  { name: "Popcorn Ceiling Removal", es: "Remoción de Techo de Palomita", category: "paint_drywall", questionSet: "drywall" },

  // Flooring
  { name: "Flooring", es: "Instalación de Pisos", category: "flooring", questionSet: "flooring" },
  { name: "Hardwood Refinishing", es: "Pulido de Madera", category: "flooring", questionSet: "flooring" },
  { name: "Epoxy Garage Floor", es: "Piso Epóxico de Garaje", category: "flooring", questionSet: "flooring" },
  { name: "Carpet Install", es: "Instalación de Alfombra", category: "flooring", questionSet: "flooring" },

  // Roofing & Exterior
  { name: "Roofing", es: "Techos", category: "roof_exterior", questionSet: "roofing" },
  { name: "Gutters & Downspouts", es: "Canaletas y Bajantes", category: "roof_exterior", questionSet: "gutters" },
  { name: "Siding", es: "Revestimiento Exterior", category: "roof_exterior", questionSet: "exterior" },
  { name: "Windows", es: "Ventanas", category: "roof_exterior", questionSet: "exterior" },
  { name: "Exterior Doors", es: "Puertas Exteriores", category: "roof_exterior", questionSet: "exterior" },
  { name: "Garage Door", es: "Puerta de Garaje", category: "roof_exterior", questionSet: "exterior" },
  { name: "Pressure Washing", es: "Lavado a Presión", category: "roof_exterior", questionSet: "pressureWash" },

  // Plumbing
  { name: "Plumbing Repair", es: "Reparación de Plomería", category: "plumbing", questionSet: "plumbing" },
  { name: "Water Heater", es: "Calentador de Agua", category: "plumbing", questionSet: "plumbing" },
  { name: "Faucets & Fixtures", es: "Llaves y Accesorios", category: "plumbing", questionSet: "plumbing" },
  { name: "Toilet Install / Repair", es: "Instalación / Reparación de Inodoro", category: "plumbing", questionSet: "plumbing" },
  { name: "Drain Cleaning", es: "Destape de Drenajes", category: "plumbing", questionSet: "plumbing" },

  // Electrical
  { name: "Electrical Repair", es: "Reparación Eléctrica", category: "electrical", questionSet: "electrical" },
  { name: "Panel Upgrade", es: "Actualización de Panel", category: "electrical", questionSet: "electrical" },
  { name: "Lighting & Ceiling Fans", es: "Iluminación y Ventiladores", category: "electrical", questionSet: "electrical" },
  { name: "EV Charger Install", es: "Instalación de Cargador EV", category: "electrical", questionSet: "electrical" },
  { name: "Outlets & Switches", es: "Contactos e Interruptores", category: "electrical", questionSet: "electrical" },

  // HVAC
  { name: "HVAC Repair", es: "Reparación de HVAC", category: "hvac", questionSet: "hvac" },
  { name: "HVAC Replacement", es: "Reemplazo de HVAC", category: "hvac", questionSet: "hvac" },
  { name: "Ductwork", es: "Ductos", category: "hvac", questionSet: "hvac" },

  // Outdoor & Landscape
  { name: "Landscaping", es: "Jardinería / Paisajismo", category: "outdoor", questionSet: "landscaping" },
  { name: "Tree Service", es: "Servicio de Árboles", category: "outdoor", questionSet: "treeService" },
  { name: "Irrigation / Sprinklers", es: "Riego / Aspersores", category: "outdoor", questionSet: "landscaping" },
  { name: "Sod & Turf", es: "Pasto / Césped", category: "outdoor", questionSet: "landscaping" },
  { name: "Fence Install / Repair", es: "Instalación / Reparación de Cerca", category: "outdoor", questionSet: "deckFence" },
  { name: "Deck Build / Repair", es: "Construcción / Reparación de Terraza", category: "outdoor", questionSet: "deckFence" },
  { name: "Pergola / Patio Cover", es: "Pérgola / Cubierta de Patio", category: "outdoor", questionSet: "deckFence" },

  // Concrete & Masonry
  { name: "Concrete Driveway / Patio", es: "Entrada / Patio de Concreto", category: "concrete", questionSet: "concrete" },
  { name: "Concrete Repair", es: "Reparación de Concreto", category: "concrete", questionSet: "concrete" },
  { name: "Masonry & Brick", es: "Albañilería y Ladrillo", category: "concrete", questionSet: "concrete" },
  { name: "Paver Patio / Walkway", es: "Patio / Andador de Adoquín", category: "concrete", questionSet: "concrete" },
  { name: "Retaining Wall", es: "Muro de Contención", category: "concrete", questionSet: "concrete" },

  // Handyman & General
  { name: "Handyman Repair", es: "Reparaciones Generales", category: "handyman", questionSet: "generic" },
  { name: "TV Mounting", es: "Montaje de TV", category: "handyman", questionSet: "generic" },
  { name: "Furniture Assembly", es: "Ensamblaje de Muebles", category: "handyman", questionSet: "generic" },
  { name: "Door Repair / Adjustment", es: "Reparación / Ajuste de Puertas", category: "handyman", questionSet: "generic" },
  { name: "Caulking & Sealing", es: "Sellado y Calafateo", category: "handyman", questionSet: "generic" },
  { name: "Insulation", es: "Aislamiento", category: "handyman", questionSet: "generic" },
  { name: "Demolition", es: "Demolición", category: "handyman", questionSet: "generic" },
  { name: "Junk Removal", es: "Retiro de Escombro", category: "handyman", questionSet: "generic" },
  { name: "Other", es: "Otro", category: "handyman", questionSet: "generic" },
];

export function getService(name: string): ServiceDef | undefined {
  return SERVICE_LIBRARY.find((s) => s.name === name);
}

export function serviceLabel(name: string, lang: Lang): string {
  if (lang === "es") return getService(name)?.es ?? name;
  return name;
}

export function categoryLabel(id: string, lang: Lang): string {
  const c = SERVICE_CATEGORIES.find((x) => x.id === id);
  return c ? (lang === "es" ? c.es : c.en) : id;
}

/** Services grouped by category, optionally filtered to a contractor's list. */
export function groupedServices(filterNames?: string[]): { category: ServiceCategory; services: ServiceDef[] }[] {
  const filter = filterNames && filterNames.length ? new Set([...filterNames, "Other"]) : null;
  return SERVICE_CATEGORIES.map((category) => ({
    category,
    services: SERVICE_LIBRARY.filter(
      (s) => s.category === category.id && (!filter || filter.has(s.name))
    ),
  })).filter((g) => g.services.length > 0);
}
