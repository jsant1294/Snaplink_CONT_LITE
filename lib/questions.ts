import type { ProjectType } from "./types";
import type { Lang, BiOption } from "./i18n";

export interface Question {
  id: string;
  label: { en: string; es: string };
  type: "select" | "text" | "photos";
  options?: BiOption[];
  photoKind?: "current" | "inspiration" | "damage";
  placeholder?: { en: string; es: string };
}

export function qLabel(q: Question, lang: Lang): string {
  return q.label[lang];
}
export function qPlaceholder(q: Question, lang: Lang): string | undefined {
  return q.placeholder?.[lang];
}

const yesNoNotSure: BiOption[] = [
  { value: "Yes", es: "Sí" },
  { value: "No", es: "No" },
  { value: "Not sure", es: "No estoy seguro" },
];

const remodeling: Question[] = [
  {
    id: "roomArea",
    label: { en: "Which room or area?", es: "¿Qué habitación o área?" },
    type: "text",
    placeholder: { en: "e.g. Master bathroom, kitchen + pantry", es: "ej. Baño principal, cocina + despensa" },
  },
  {
    id: "fullOrRepair",
    label: { en: "Full remodel or repair?", es: "¿Remodelación completa o reparación?" },
    type: "select",
    options: [
      { value: "Full remodel", es: "Remodelación completa" },
      { value: "Partial remodel", es: "Remodelación parcial" },
      { value: "Repair only", es: "Solo reparación" },
      { value: "Not sure", es: "No estoy seguro" },
    ],
  },
  {
    id: "hasMeasurements",
    label: { en: "Do you have measurements?", es: "¿Tienes medidas?" },
    type: "select",
    options: [
      { value: "Yes", es: "Sí" },
      { value: "No", es: "No" },
      { value: "Rough idea", es: "Una idea aproximada" },
    ],
  },
  {
    id: "materialsSelected",
    label: { en: "Are materials already selected?", es: "¿Ya seleccionaste los materiales?" },
    type: "select",
    options: [
      { value: "Yes, purchased", es: "Sí, ya comprados" },
      { value: "Yes, picked but not purchased", es: "Sí, elegidos pero sin comprar" },
      { value: "No, need help choosing", es: "No, necesito ayuda para elegir" },
    ],
  },
  {
    id: "inspirationPhotos",
    label: { en: "Upload inspiration photos", es: "Sube fotos de inspiración" },
    type: "photos",
    photoKind: "inspiration",
  },
  {
    id: "currentPhotos",
    label: { en: "Upload current condition photos", es: "Sube fotos del estado actual" },
    type: "photos",
    photoKind: "current",
  },
];

const roofing: Question[] = [
  {
    id: "repairOrReplace",
    label: { en: "Repair or replacement?", es: "¿Reparación o reemplazo?" },
    type: "select",
    options: [
      { value: "Repair", es: "Reparación" },
      { value: "Full replacement", es: "Reemplazo completo" },
      { value: "Not sure — need inspection", es: "No estoy seguro — necesito inspección" },
    ],
  },
  {
    id: "leaks",
    label: { en: "Any leaks?", es: "¿Hay goteras?" },
    type: "select",
    options: [
      { value: "Yes, active leak", es: "Sí, gotera activa" },
      { value: "Yes, past leaks", es: "Sí, goteras anteriores" },
      { value: "No leaks", es: "Sin goteras" },
    ],
  },
  {
    id: "stories",
    label: { en: "One story or two story?", es: "¿Un piso o dos pisos?" },
    type: "select",
    options: [
      { value: "One story", es: "Un piso" },
      { value: "Two story", es: "Dos pisos" },
      { value: "Three or more", es: "Tres o más" },
    ],
  },
  {
    id: "insuranceClaim",
    label: { en: "Insurance claim?", es: "¿Reclamo de seguro?" },
    type: "select",
    options: [
      { value: "Yes, claim filed", es: "Sí, reclamo presentado" },
      { value: "Planning to file", es: "Planeo presentarlo" },
      { value: "No / paying out of pocket", es: "No / pago por mi cuenta" },
    ],
  },
  {
    id: "roofPhotos",
    label: { en: "Upload roof / damage photos", es: "Sube fotos del techo / daños" },
    type: "photos",
    photoKind: "damage",
  },
];

const flooring: Question[] = [
  {
    id: "floorType",
    label: { en: "Flooring type", es: "Tipo de piso" },
    type: "select",
    options: [
      { value: "LVP / Vinyl plank", es: "Vinil / LVP" },
      { value: "Hardwood", es: "Madera" },
      { value: "Laminate", es: "Laminado" },
      { value: "Tile", es: "Losa / Azulejo" },
      { value: "Carpet", es: "Alfombra" },
      { value: "Not sure", es: "No estoy seguro" },
    ],
  },
  {
    id: "sqft",
    label: { en: "Approximate square footage", es: "Pies cuadrados aproximados" },
    type: "text",
    placeholder: { en: "e.g. ~800 sq ft", es: "ej. ~800 pies²" },
  },
  {
    id: "removeOld",
    label: { en: "Remove old flooring?", es: "¿Quitar el piso viejo?" },
    type: "select",
    options: [
      { value: "Yes", es: "Sí" },
      { value: "No, already removed", es: "No, ya está quitado" },
      { value: "Not sure", es: "No estoy seguro" },
    ],
  },
  {
    id: "stairs",
    label: { en: "Stairs?", es: "¿Escaleras?" },
    type: "select",
    options: [
      { value: "Yes", es: "Sí" },
      { value: "No", es: "No" },
    ],
  },
  {
    id: "clientMaterial",
    label: { en: "Client supplied material?", es: "¿Quién pone el material?" },
    type: "select",
    options: [
      { value: "I'm buying the material", es: "Yo compro el material" },
      { value: "Contractor supplies material", es: "El contratista pone el material" },
      { value: "Not sure", es: "No estoy seguro" },
    ],
  },
  {
    id: "floorPhotos",
    label: { en: "Upload photos of the space", es: "Sube fotos del espacio" },
    type: "photos",
    photoKind: "current",
  },
];

const treeService: Question[] = [
  {
    id: "serviceKind",
    label: { en: "What do you need?", es: "¿Qué necesitas?" },
    type: "select",
    options: [
      { value: "Removal", es: "Remoción" },
      { value: "Trimming", es: "Poda" },
      { value: "Stump grinding", es: "Triturado de tocón" },
      { value: "Emergency / storm damage", es: "Emergencia / daño por tormenta" },
    ],
  },
  {
    id: "treeCount",
    label: { en: "How many trees?", es: "¿Cuántos árboles?" },
    type: "text",
    placeholder: { en: "e.g. 2 large oaks", es: "ej. 2 robles grandes" },
  },
  {
    id: "powerLines",
    label: { en: "Near power lines?", es: "¿Cerca de cables eléctricos?" },
    type: "select",
    options: yesNoNotSure,
  },
  {
    id: "equipmentAccess",
    label: { en: "Equipment access (gate, backyard, slope)?", es: "¿Acceso para equipo (portón, patio, pendiente)?" },
    type: "select",
    options: [
      { value: "Easy access", es: "Acceso fácil" },
      { value: "Tight access", es: "Acceso reducido" },
      { value: "Backyard only / fenced", es: "Solo patio trasero / cercado" },
      { value: "Not sure", es: "No estoy seguro" },
    ],
  },
  {
    id: "treePhotos",
    label: { en: "Upload photos", es: "Sube fotos" },
    type: "photos",
    photoKind: "current",
  },
];

const painting: Question[] = [
  {
    id: "intExt",
    label: { en: "Interior or exterior?", es: "¿Interior o exterior?" },
    type: "select",
    options: [
      { value: "Interior", es: "Interior" },
      { value: "Exterior", es: "Exterior" },
      { value: "Both", es: "Ambos" },
    ],
  },
  {
    id: "areas",
    label: { en: "Rooms / areas", es: "Habitaciones / áreas" },
    type: "text",
    placeholder: { en: "e.g. Living room, hallway, 2 bedrooms", es: "ej. Sala, pasillo, 2 recámaras" },
  },
  {
    id: "sqft",
    label: { en: "Approximate square footage", es: "Pies cuadrados aproximados" },
    type: "text",
    placeholder: { en: "e.g. ~1,200 sq ft", es: "ej. ~1,200 pies²" },
  },
  {
    id: "paintSupplied",
    label: { en: "Paint supplied?", es: "¿Quién pone la pintura?" },
    type: "select",
    options: [
      { value: "I'm supplying paint", es: "Yo pongo la pintura" },
      { value: "Contractor supplies paint", es: "El contratista pone la pintura" },
      { value: "Not sure", es: "No estoy seguro" },
    ],
  },
  {
    id: "repairsNeeded",
    label: { en: "Repairs needed (drywall, trim, caulk)?", es: "¿Se necesitan reparaciones (tablaroca, molduras, sellado)?" },
    type: "select",
    options: yesNoNotSure,
  },
  {
    id: "paintPhotos",
    label: { en: "Upload photos of the areas", es: "Sube fotos de las áreas" },
    type: "photos",
    photoKind: "current",
  },
];


const drywall: Question[] = [
  {
    id: "drywallScope",
    label: { en: "What's needed?", es: "¿Qué se necesita?" },
    type: "select",
    options: [
      { value: "New drywall install", es: "Instalación de tablaroca nueva" },
      { value: "Patch / repair holes", es: "Parchar / reparar hoyos" },
      { value: "Water damage repair", es: "Reparación por daño de agua" },
      { value: "Texture / finish match", es: "Igualar textura / acabado" },
      { value: "Popcorn ceiling removal", es: "Remoción de techo de palomita" },
    ],
  },
  {
    id: "drywallArea",
    label: { en: "Rooms / areas affected", es: "Habitaciones / áreas afectadas" },
    type: "text",
    placeholder: { en: "e.g. Garage ceiling, hallway wall", es: "ej. Techo del garaje, pared del pasillo" },
  },
  {
    id: "drywallSize",
    label: { en: "Approximate size of damage or area", es: "Tamaño aproximado del daño o área" },
    type: "text",
    placeholder: { en: "e.g. 2 holes about 1 ft each", es: "ej. 2 hoyos de ~30 cm cada uno" },
  },
  { id: "paintAfter", label: { en: "Paint after repair?", es: "¿Pintar después de la reparación?" }, type: "select", options: yesNoNotSure },
  { id: "drywallPhotos", label: { en: "Upload photos of the damage / area", es: "Sube fotos del daño / área" }, type: "photos", photoKind: "current" },
];

const gutters: Question[] = [
  {
    id: "gutterScope",
    label: { en: "What's needed?", es: "¿Qué se necesita?" },
    type: "select",
    options: [
      { value: "New gutters", es: "Canaletas nuevas" },
      { value: "Repair / re-secure", es: "Reparar / reasegurar" },
      { value: "Cleaning", es: "Limpieza" },
      { value: "Gutter guards", es: "Protectores de canaleta" },
    ],
  },
  {
    id: "stories",
    label: { en: "One story or two story?", es: "¿Un piso o dos pisos?" },
    type: "select",
    options: [
      { value: "One story", es: "Un piso" },
      { value: "Two story", es: "Dos pisos" },
      { value: "Three or more", es: "Tres o más" },
    ],
  },
  {
    id: "linearFeet",
    label: { en: "Approximate linear feet (if known)", es: "Pies lineales aproximados (si los sabes)" },
    type: "text",
    placeholder: { en: "e.g. ~150 ln ft", es: "ej. ~150 pies lineales" },
  },
  { id: "gutterPhotos", label: { en: "Upload photos", es: "Sube fotos" }, type: "photos", photoKind: "current" },
];

const exterior: Question[] = [
  {
    id: "extScope",
    label: { en: "Install new or repair existing?", es: "¿Instalar nuevo o reparar existente?" },
    type: "select",
    options: [
      { value: "New install / replacement", es: "Instalación nueva / reemplazo" },
      { value: "Repair", es: "Reparación" },
      { value: "Not sure", es: "No estoy seguro" },
    ],
  },
  {
    id: "extCount",
    label: { en: "How many units / how large an area?", es: "¿Cuántas unidades / qué tan grande el área?" },
    type: "text",
    placeholder: { en: "e.g. 6 windows, or ~1,800 sq ft siding", es: "ej. 6 ventanas, o ~1,800 pies² de revestimiento" },
  },
  {
    id: "materialPref",
    label: { en: "Material preference (if any)", es: "Preferencia de material (si tienes)" },
    type: "text",
    placeholder: { en: "e.g. vinyl, fiber cement, steel door", es: "ej. vinil, fibrocemento, puerta de acero" },
  },
  {
    id: "stories",
    label: { en: "One story or two story?", es: "¿Un piso o dos pisos?" },
    type: "select",
    options: [
      { value: "One story", es: "Un piso" },
      { value: "Two story", es: "Dos pisos" },
    ],
  },
  { id: "extPhotos", label: { en: "Upload photos", es: "Sube fotos" }, type: "photos", photoKind: "current" },
];

const pressureWash: Question[] = [
  {
    id: "pwSurfaces",
    label: { en: "What needs washing?", es: "¿Qué se necesita lavar?" },
    type: "select",
    options: [
      { value: "House / siding", es: "Casa / revestimiento" },
      { value: "Driveway / concrete", es: "Entrada / concreto" },
      { value: "Deck / fence", es: "Terraza / cerca" },
      { value: "Roof (soft wash)", es: "Techo (lavado suave)" },
      { value: "Multiple surfaces", es: "Varias superficies" },
    ],
  },
  {
    id: "pwSize",
    label: { en: "Approximate size", es: "Tamaño aproximado" },
    type: "text",
    placeholder: { en: "e.g. 2-story house + 2-car driveway", es: "ej. Casa de 2 pisos + entrada para 2 autos" },
  },
  { id: "waterOnSite", label: { en: "Water spigot available on site?", es: "¿Hay llave de agua disponible?" }, type: "select", options: yesNoNotSure },
  { id: "pwPhotos", label: { en: "Upload photos", es: "Sube fotos" }, type: "photos", photoKind: "current" },
];

const plumbing: Question[] = [
  {
    id: "plumbIssue",
    label: { en: "What's the issue or project?", es: "¿Cuál es el problema o proyecto?" },
    type: "select",
    options: [
      { value: "Active leak", es: "Fuga activa" },
      { value: "Clog / slow drain", es: "Tapado / drenaje lento" },
      { value: "Fixture install / replace", es: "Instalar / reemplazar accesorio" },
      { value: "Water heater issue", es: "Problema de calentador de agua" },
      { value: "Repipe / new line", es: "Retubería / línea nueva" },
      { value: "Other", es: "Otro" },
    ],
  },
  {
    id: "plumbLocation",
    label: { en: "Where in the home?", es: "¿En qué parte de la casa?" },
    type: "text",
    placeholder: { en: "e.g. Master bath, kitchen sink, basement", es: "ej. Baño principal, fregadero, sótano" },
  },
  { id: "waterOff", label: { en: "Is water currently shut off?", es: "¿El agua está cerrada actualmente?" }, type: "select", options: yesNoNotSure },
  { id: "plumbAge", label: { en: "Approximate age of home / unit", es: "Edad aproximada de la casa / equipo" }, type: "text", placeholder: { en: "e.g. house 1998, heater ~10 yrs", es: "ej. casa 1998, calentador ~10 años" } },
  { id: "plumbPhotos", label: { en: "Upload photos", es: "Sube fotos" }, type: "photos", photoKind: "current" },
];

const electrical: Question[] = [
  {
    id: "elecScope",
    label: { en: "What's needed?", es: "¿Qué se necesita?" },
    type: "select",
    options: [
      { value: "Repair / troubleshooting", es: "Reparación / diagnóstico" },
      { value: "New fixture / fan install", es: "Instalar lámpara / ventilador" },
      { value: "Add outlets / switches", es: "Agregar contactos / interruptores" },
      { value: "Panel upgrade", es: "Actualizar panel" },
      { value: "EV charger", es: "Cargador EV" },
      { value: "Other", es: "Otro" },
    ],
  },
  {
    id: "elecLocation",
    label: { en: "Where in the home?", es: "¿En qué parte de la casa?" },
    type: "text",
    placeholder: { en: "e.g. Kitchen, garage, exterior", es: "ej. Cocina, garaje, exterior" },
  },
  { id: "breakerTrips", label: { en: "Any breakers tripping or burning smell?", es: "¿Se botan los breakers o huele a quemado?" }, type: "select", options: yesNoNotSure },
  { id: "panelAccess", label: { en: "Is the electrical panel accessible?", es: "¿El panel eléctrico está accesible?" }, type: "select", options: yesNoNotSure },
  { id: "elecPhotos", label: { en: "Upload photos", es: "Sube fotos" }, type: "photos", photoKind: "current" },
];

const hvac: Question[] = [
  {
    id: "hvacIssue",
    label: { en: "What's going on?", es: "¿Qué está pasando?" },
    type: "select",
    options: [
      { value: "No cooling", es: "No enfría" },
      { value: "No heat", es: "No calienta" },
      { value: "Weak airflow / uneven temps", es: "Poco flujo / temperaturas disparejas" },
      { value: "Strange noise / smell", es: "Ruido / olor extraño" },
      { value: "Replacement quote", es: "Cotización de reemplazo" },
      { value: "Maintenance / tune-up", es: "Mantenimiento" },
    ],
  },
  {
    id: "systemType",
    label: { en: "System type (if known)", es: "Tipo de sistema (si lo sabes)" },
    type: "select",
    options: [
      { value: "Central AC + furnace", es: "AC central + calefactor" },
      { value: "Heat pump", es: "Bomba de calor" },
      { value: "Mini-split", es: "Mini-split" },
      { value: "Not sure", es: "No estoy seguro" },
    ],
  },
  { id: "systemAge", label: { en: "Approximate system age", es: "Edad aproximada del sistema" }, type: "text", placeholder: { en: "e.g. ~12 years", es: "ej. ~12 años" } },
  { id: "hvacPhotos", label: { en: "Upload photos (unit + label if possible)", es: "Sube fotos (equipo + etiqueta si es posible)" }, type: "photos", photoKind: "current" },
];

const landscaping: Question[] = [
  {
    id: "landScope",
    label: { en: "What's the project?", es: "¿Cuál es el proyecto?" },
    type: "select",
    options: [
      { value: "New landscape design", es: "Diseño nuevo de jardín" },
      { value: "Cleanup / maintenance", es: "Limpieza / mantenimiento" },
      { value: "Sod / turf install", es: "Instalación de pasto" },
      { value: "Irrigation / sprinklers", es: "Riego / aspersores" },
      { value: "Planting / beds", es: "Plantas / jardineras" },
      { value: "Other", es: "Otro" },
    ],
  },
  {
    id: "yardSize",
    label: { en: "Approximate yard / area size", es: "Tamaño aproximado del jardín / área" },
    type: "text",
    placeholder: { en: "e.g. front + back, ~1/4 acre", es: "ej. frente + atrás, ~1/4 acre" },
  },
  { id: "gateAccess", label: { en: "Gate / equipment access?", es: "¿Acceso por portón / para equipo?" }, type: "select", options: yesNoNotSure },
  { id: "landPhotos", label: { en: "Upload photos of the area", es: "Sube fotos del área" }, type: "photos", photoKind: "current" },
];

const deckFence: Question[] = [
  {
    id: "dfScope",
    label: { en: "Build new or repair?", es: "¿Construir nuevo o reparar?" },
    type: "select",
    options: [
      { value: "Build new", es: "Construir nuevo" },
      { value: "Repair / replace sections", es: "Reparar / reemplazar secciones" },
      { value: "Stain / seal only", es: "Solo teñir / sellar" },
    ],
  },
  {
    id: "dfSize",
    label: { en: "Approximate size", es: "Tamaño aproximado" },
    type: "text",
    placeholder: { en: "e.g. 12x16 deck, or ~120 ln ft fence", es: "ej. terraza 12x16, o ~120 pies de cerca" },
  },
  {
    id: "dfMaterial",
    label: { en: "Material preference", es: "Preferencia de material" },
    type: "select",
    options: [
      { value: "Pressure-treated wood", es: "Madera tratada" },
      { value: "Cedar", es: "Cedro" },
      { value: "Composite", es: "Composite" },
      { value: "Vinyl / metal", es: "Vinil / metal" },
      { value: "Not sure", es: "No estoy seguro" },
    ],
  },
  { id: "dfPermit", label: { en: "HOA or permit requirements?", es: "¿Requisitos de HOA o permiso?" }, type: "select", options: yesNoNotSure },
  { id: "dfPhotos", label: { en: "Upload photos", es: "Sube fotos" }, type: "photos", photoKind: "current" },
];

const concrete: Question[] = [
  {
    id: "concScope",
    label: { en: "What's the project?", es: "¿Cuál es el proyecto?" },
    type: "select",
    options: [
      { value: "New pour", es: "Colado nuevo" },
      { value: "Repair / crack fill", es: "Reparación / sellado de grietas" },
      { value: "Remove & replace", es: "Quitar y reemplazar" },
      { value: "Pavers / masonry", es: "Adoquín / albañilería" },
      { value: "Retaining wall", es: "Muro de contención" },
    ],
  },
  {
    id: "concSize",
    label: { en: "Approximate size / dimensions", es: "Tamaño / dimensiones aproximadas" },
    type: "text",
    placeholder: { en: "e.g. 20x20 driveway, 30 ln ft wall", es: "ej. entrada 20x20, muro de 30 pies" },
  },
  { id: "concAccess", label: { en: "Truck / equipment access to the area?", es: "¿Acceso de camión / equipo al área?" }, type: "select", options: yesNoNotSure },
  { id: "concFinish", label: { en: "Finish preference (broom, stamped, exposed)?", es: "¿Preferencia de acabado (escobillado, estampado, expuesto)?" }, type: "text", placeholder: { en: "e.g. stamped, gray", es: "ej. estampado, gris" } },
  { id: "concPhotos", label: { en: "Upload photos", es: "Sube fotos" }, type: "photos", photoKind: "current" },
];

const generic: Question[] = [
  {
    id: "describe",
    label: { en: "Describe the project", es: "Describe el proyecto" },
    type: "text",
    placeholder: { en: "Tell us what you need done", es: "Cuéntanos qué necesitas" },
  },
  {
    id: "genericPhotos",
    label: { en: "Upload photos", es: "Sube fotos" },
    type: "photos",
    photoKind: "current",
  },
];

// String-keyed set map — services resolve their set via lib/services.ts
export const QUESTION_SET_MAP: Record<string, Question[]> = {
  remodeling,
  roofing,
  flooring,
  treeService,
  painting,
  drywall,
  gutters,
  exterior,
  pressureWash,
  plumbing,
  electrical,
  hvac,
  landscaping,
  deckFence,
  concrete,
  generic,
};

export function getQuestionSet(setKey: string): Question[] {
  return QUESTION_SET_MAP[setKey] ?? generic;
}
