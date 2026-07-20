// ---------------------------------------------------------------------------
// Estimator Line-Item Library — GC + handyman catalog of common scope items.
// Bilingual descriptions + standard units. NO prices are shipped: the
// contractor enters their own rates. SnapLink never invents pricing.
// ---------------------------------------------------------------------------

import type { Lang } from "./i18n";

export type Unit = "sqft" | "lnft" | "each" | "hour" | "day" | "job" | "room" | "yard";

export const UNIT_LABELS: Record<Unit, { en: string; es: string }> = {
  sqft: { en: "sq ft", es: "pie²" },
  lnft: { en: "ln ft", es: "pie lineal" },
  each: { en: "each", es: "c/u" },
  hour: { en: "hour", es: "hora" },
  day: { en: "day", es: "día" },
  job: { en: "job", es: "trabajo" },
  room: { en: "room", es: "habitación" },
  yard: { en: "cu yd", es: "yd³" },
};

export function unitLabel(u: Unit, lang: Lang): string {
  return UNIT_LABELS[u][lang];
}

export interface EstimateItemDef {
  id: string;
  en: string;
  es: string;
  unit: Unit;
  category: string; // matches SERVICE_CATEGORIES ids + "general"
}

function i(id: string, en: string, es: string, unit: Unit, category: string): EstimateItemDef {
  return { id, en, es, unit, category };
}

export const ESTIMATE_LIBRARY: EstimateItemDef[] = [
  // --- General / applies to any job ---
  i("gen_labor", "General labor", "Mano de obra general", "hour", "general"),
  i("gen_helper", "Helper / second man", "Ayudante", "hour", "general"),
  i("gen_demo", "Demolition & tear-out", "Demolición y retiro", "job", "general"),
  i("gen_debris", "Debris haul-off & disposal", "Retiro y disposición de escombro", "job", "general"),
  i("gen_dumpster", "Dumpster rental", "Renta de contenedor", "each", "general"),
  i("gen_permit", "Permit & inspection fees", "Permisos e inspecciones", "job", "general"),
  i("gen_materials", "Materials (at cost + markup)", "Materiales (costo + margen)", "job", "general"),
  i("gen_protect", "Floor / furniture protection & masking", "Protección de pisos / muebles", "job", "general"),
  i("gen_cleanup", "Final cleanup", "Limpieza final", "job", "general"),
  i("gen_trip", "Trip / service call fee", "Cargo por visita de servicio", "each", "general"),
  i("gen_supervision", "Project management / supervision", "Gestión / supervisión de proyecto", "day", "general"),

  // --- Remodeling & Interior ---
  i("rem_design", "Design & planning", "Diseño y planeación", "job", "remodeling"),
  i("rem_cab_install", "Cabinet installation", "Instalación de gabinetes", "lnft", "remodeling"),
  i("rem_cab_demo", "Cabinet removal", "Retiro de gabinetes", "lnft", "remodeling"),
  i("rem_counter_install", "Countertop install", "Instalación de encimera", "sqft", "remodeling"),
  i("rem_counter_template", "Countertop template & fabrication", "Plantilla y fabricación de encimera", "job", "remodeling"),
  i("rem_backsplash", "Backsplash tile install", "Instalación de backsplash", "sqft", "remodeling"),
  i("rem_tile_floor", "Floor tile install", "Instalación de piso de azulejo", "sqft", "remodeling"),
  i("rem_tile_shower", "Shower tile install (walls + pan)", "Azulejo de regadera (paredes + base)", "job", "remodeling"),
  i("rem_shower_pan", "Shower pan / waterproofing", "Base de regadera / impermeabilización", "job", "remodeling"),
  i("rem_tub_install", "Tub install / replacement", "Instalación / reemplazo de tina", "each", "remodeling"),
  i("rem_vanity", "Vanity install", "Instalación de tocador", "each", "remodeling"),
  i("rem_trim", "Baseboard / trim install", "Instalación de zoclo / moldura", "lnft", "remodeling"),
  i("rem_crown", "Crown molding install", "Instalación de moldura de corona", "lnft", "remodeling"),
  i("rem_door_int", "Interior door install", "Instalación de puerta interior", "each", "remodeling"),
  i("rem_closet", "Closet system install", "Instalación de sistema de clóset", "each", "remodeling"),
  i("rem_frame", "Framing (walls / openings)", "Estructura (muros / aberturas)", "lnft", "remodeling"),

  // --- Painting & Drywall ---
  i("pnt_walls", "Paint walls (2 coats)", "Pintar paredes (2 manos)", "sqft", "paint_drywall"),
  i("pnt_ceiling", "Paint ceiling", "Pintar techo", "sqft", "paint_drywall"),
  i("pnt_trim", "Paint trim / baseboards", "Pintar molduras / zoclos", "lnft", "paint_drywall"),
  i("pnt_door", "Paint door (both sides)", "Pintar puerta (ambos lados)", "each", "paint_drywall"),
  i("pnt_cabinets", "Paint cabinets (prep + spray)", "Pintar gabinetes (preparación + pistola)", "job", "paint_drywall"),
  i("pnt_exterior", "Exterior paint (prep + 2 coats)", "Pintura exterior (preparación + 2 manos)", "sqft", "paint_drywall"),
  i("pnt_pressure_prep", "Pressure wash prep", "Preparación con lavado a presión", "job", "paint_drywall"),
  i("dw_hang", "Drywall hang", "Colocación de tablaroca", "sqft", "paint_drywall"),
  i("dw_finish", "Drywall tape & finish (level 4)", "Encintado y acabado de tablaroca", "sqft", "paint_drywall"),
  i("dw_patch", "Drywall patch (per patch)", "Parche de tablaroca (por parche)", "each", "paint_drywall"),
  i("dw_texture", "Texture match", "Igualar textura", "sqft", "paint_drywall"),
  i("dw_popcorn", "Popcorn ceiling removal", "Remoción de techo de palomita", "sqft", "paint_drywall"),
  i("pnt_caulk", "Caulk & seal", "Sellado con silicón", "lnft", "paint_drywall"),

  // --- Flooring ---
  i("flr_lvp", "LVP / laminate install", "Instalación de vinil / laminado", "sqft", "flooring"),
  i("flr_hardwood", "Hardwood install", "Instalación de madera", "sqft", "flooring"),
  i("flr_refinish", "Hardwood sand & refinish", "Lijado y acabado de madera", "sqft", "flooring"),
  i("flr_tile", "Tile floor install", "Instalación de piso de azulejo", "sqft", "flooring"),
  i("flr_carpet", "Carpet install (with pad)", "Instalación de alfombra (con bajo alfombra)", "sqft", "flooring"),
  i("flr_removal", "Old flooring removal", "Retiro de piso viejo", "sqft", "flooring"),
  i("flr_leveling", "Subfloor prep / leveling", "Preparación / nivelación de subpiso", "sqft", "flooring"),
  i("flr_stairs", "Stair treads (per step)", "Escalones (por escalón)", "each", "flooring"),
  i("flr_transitions", "Transitions & thresholds", "Transiciones y umbrales", "each", "flooring"),
  i("flr_epoxy", "Epoxy floor coating", "Recubrimiento epóxico", "sqft", "flooring"),

  // --- Roofing & Exterior ---
  i("rf_replace", "Roof replacement (architectural shingle)", "Reemplazo de techo (teja arquitectónica)", "sqft", "roof_exterior"),
  i("rf_repair", "Roof repair", "Reparación de techo", "job", "roof_exterior"),
  i("rf_decking", "Replace decking (per sheet)", "Reemplazo de triplay (por hoja)", "each", "roof_exterior"),
  i("rf_flashing", "Flashing / boot replacement", "Reemplazo de flashing / botas", "each", "roof_exterior"),
  i("rf_tarp", "Emergency tarp", "Lona de emergencia", "job", "roof_exterior"),
  i("gut_install", "Gutter install (seamless)", "Instalación de canaleta (sin costura)", "lnft", "roof_exterior"),
  i("gut_guards", "Gutter guards", "Protectores de canaleta", "lnft", "roof_exterior"),
  i("gut_clean", "Gutter cleaning", "Limpieza de canaletas", "job", "roof_exterior"),
  i("sid_install", "Siding install", "Instalación de revestimiento", "sqft", "roof_exterior"),
  i("sid_repair", "Siding repair", "Reparación de revestimiento", "job", "roof_exterior"),
  i("win_install", "Window install (retrofit)", "Instalación de ventana", "each", "roof_exterior"),
  i("door_ext", "Exterior door install", "Instalación de puerta exterior", "each", "roof_exterior"),
  i("gar_door", "Garage door install", "Instalación de puerta de garaje", "each", "roof_exterior"),
  i("gar_opener", "Garage door opener install", "Instalación de motor de garaje", "each", "roof_exterior"),
  i("pw_house", "Pressure wash — house", "Lavado a presión — casa", "job", "roof_exterior"),
  i("pw_concrete", "Pressure wash — concrete", "Lavado a presión — concreto", "sqft", "roof_exterior"),

  // --- Plumbing ---
  i("plm_service", "Plumbing service / diagnostic", "Servicio / diagnóstico de plomería", "hour", "plumbing"),
  i("plm_faucet", "Faucet install", "Instalación de llave", "each", "plumbing"),
  i("plm_toilet", "Toilet install", "Instalación de inodoro", "each", "plumbing"),
  i("plm_disposal", "Garbage disposal install", "Instalación de triturador", "each", "plumbing"),
  i("plm_wh_tank", "Water heater replacement (tank)", "Reemplazo de calentador (tanque)", "each", "plumbing"),
  i("plm_wh_tankless", "Tankless water heater install", "Instalación de calentador instantáneo", "each", "plumbing"),
  i("plm_drain", "Drain clearing", "Destape de drenaje", "each", "plumbing"),
  i("plm_leak", "Leak repair", "Reparación de fuga", "job", "plumbing"),
  i("plm_valve", "Shut-off valve replacement", "Reemplazo de válvula de paso", "each", "plumbing"),
  i("plm_repipe", "Repipe / new supply line", "Retubería / línea nueva", "lnft", "plumbing"),

  // --- Electrical ---
  i("elc_service", "Electrical service / diagnostic", "Servicio / diagnóstico eléctrico", "hour", "electrical"),
  i("elc_outlet", "Outlet / switch install", "Instalación de contacto / interruptor", "each", "electrical"),
  i("elc_gfci", "GFCI outlet install", "Instalación de contacto GFCI", "each", "electrical"),
  i("elc_fixture", "Light fixture install", "Instalación de lámpara", "each", "electrical"),
  i("elc_fan", "Ceiling fan install", "Instalación de ventilador de techo", "each", "electrical"),
  i("elc_recessed", "Recessed light (per can)", "Luz empotrada (por unidad)", "each", "electrical"),
  i("elc_circuit", "New dedicated circuit", "Circuito dedicado nuevo", "each", "electrical"),
  i("elc_panel", "Panel upgrade (200A)", "Actualización de panel (200A)", "job", "electrical"),
  i("elc_ev", "EV charger install (Level 2)", "Instalación de cargador EV (Nivel 2)", "each", "electrical"),

  // --- HVAC ---
  i("hv_service", "HVAC service / diagnostic", "Servicio / diagnóstico HVAC", "each", "hvac"),
  i("hv_tuneup", "Seasonal tune-up", "Mantenimiento de temporada", "each", "hvac"),
  i("hv_capacitor", "Capacitor / contactor replacement", "Reemplazo de capacitor / contactor", "each", "hvac"),
  i("hv_refrigerant", "Refrigerant recharge (per lb)", "Recarga de refrigerante (por libra)", "each", "hvac"),
  i("hv_replace", "System replacement (condenser + coil)", "Reemplazo de sistema (condensador + serpentín)", "job", "hvac"),
  i("hv_minisplit", "Mini-split install (per zone)", "Instalación de mini-split (por zona)", "each", "hvac"),
  i("hv_duct", "Ductwork (install / repair)", "Ductos (instalación / reparación)", "lnft", "hvac"),
  i("hv_thermostat", "Smart thermostat install", "Instalación de termostato inteligente", "each", "hvac"),

  // --- Outdoor & Landscape ---
  i("lnd_design", "Landscape design", "Diseño de jardín", "job", "outdoor"),
  i("lnd_cleanup", "Yard cleanup", "Limpieza de jardín", "job", "outdoor"),
  i("lnd_sod", "Sod install", "Instalación de pasto", "sqft", "outdoor"),
  i("lnd_mulch", "Mulch install", "Instalación de mantillo", "yard", "outdoor"),
  i("lnd_plant", "Shrub / plant install", "Plantación de arbustos / plantas", "each", "outdoor"),
  i("lnd_irrigation", "Irrigation zone (install)", "Zona de riego (instalación)", "each", "outdoor"),
  i("lnd_irr_repair", "Sprinkler repair", "Reparación de aspersores", "job", "outdoor"),
  i("tre_removal", "Tree removal", "Remoción de árbol", "each", "outdoor"),
  i("tre_trim", "Tree trimming", "Poda de árbol", "each", "outdoor"),
  i("tre_stump", "Stump grinding", "Triturado de tocón", "each", "outdoor"),
  i("fen_wood", "Wood fence install", "Instalación de cerca de madera", "lnft", "outdoor"),
  i("fen_gate", "Gate install", "Instalación de portón", "each", "outdoor"),
  i("fen_repair", "Fence repair", "Reparación de cerca", "job", "outdoor"),
  i("dck_build", "Deck build (framing + decking)", "Construcción de terraza", "sqft", "outdoor"),
  i("dck_rail", "Deck railing", "Barandal de terraza", "lnft", "outdoor"),
  i("dck_stain", "Deck stain & seal", "Teñido y sellado de terraza", "sqft", "outdoor"),
  i("prg_build", "Pergola / patio cover build", "Construcción de pérgola / cubierta", "job", "outdoor"),

  // --- Concrete & Masonry ---
  i("con_flatwork", "Concrete flatwork (4in pour)", "Concreto plano (colado de 4 pulg)", "sqft", "concrete"),
  i("con_removal", "Concrete removal", "Retiro de concreto", "sqft", "concrete"),
  i("con_stamped", "Stamped / decorative upgrade", "Acabado estampado / decorativo", "sqft", "concrete"),
  i("con_crack", "Crack repair / sealing", "Reparación / sellado de grietas", "lnft", "concrete"),
  i("con_pavers", "Paver install", "Instalación de adoquín", "sqft", "concrete"),
  i("con_retaining", "Retaining wall (block)", "Muro de contención (bloque)", "sqft", "concrete"),
  i("con_footing", "Footings / piers", "Zapatas / pilares", "each", "concrete"),
  i("mas_brick", "Brick / block work", "Trabajo de ladrillo / bloque", "sqft", "concrete"),
  i("mas_tuckpoint", "Tuckpointing / mortar repair", "Reparación de juntas / mortero", "sqft", "concrete"),

  // --- Handyman ---
  i("hm_hour", "Handyman labor", "Mano de obra de reparaciones", "hour", "handyman"),
  i("hm_halfday", "Handyman half-day rate", "Tarifa de medio día", "each", "handyman"),
  i("hm_fullday", "Handyman full-day rate", "Tarifa de día completo", "day", "handyman"),
  i("hm_tv", "TV mount (up to 65\")", "Montaje de TV (hasta 65\")", "each", "handyman"),
  i("hm_furniture", "Furniture assembly (per item)", "Ensamblaje de muebles (por pieza)", "each", "handyman"),
  i("hm_door_adjust", "Door adjustment / hardware", "Ajuste de puerta / herrajes", "each", "handyman"),
  i("hm_caulk_bath", "Re-caulk tub / shower", "Resellar tina / regadera", "each", "handyman"),
  i("hm_insulation", "Attic insulation (blown-in)", "Aislamiento de ático (soplado)", "sqft", "handyman"),
  i("hm_junk", "Junk removal (per load)", "Retiro de escombro (por carga)", "each", "handyman"),
  i("hm_smoke", "Smoke / CO detector install", "Instalación de detector de humo / CO", "each", "handyman"),
];

export function itemLabel(item: EstimateItemDef, lang: Lang): string {
  return lang === "es" ? item.es : item.en;
}

export function searchItems(query: string, category?: string): EstimateItemDef[] {
  const q = query.trim().toLowerCase();
  return ESTIMATE_LIBRARY.filter((it) => {
    if (category && category !== "all" && it.category !== category) return false;
    if (!q) return true;
    return it.en.toLowerCase().includes(q) || it.es.toLowerCase().includes(q);
  });
}
