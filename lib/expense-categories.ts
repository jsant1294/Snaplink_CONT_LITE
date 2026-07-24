// ---------------------------------------------------------------------------
// Default expense categories, seeded for local/JSON-mode dev.
// Kept in sync with scripts/seed-categories.mjs (the Postgres equivalent).
// System defaults: contractorId is left unset so they apply to everyone.
// ---------------------------------------------------------------------------

import type { ExpenseCategory } from "./money-types";

export const DEFAULT_CATEGORY_SEEDS: ExpenseCategory[] = [
  { id: "cat_job_materials", key: "job_materials", labelEn: "Job materials", labelEs: "Materiales del trabajo", scheduleCLine: "38", isJobMaterial: true, sortOrder: 10 },
  { id: "cat_subcontractor", key: "subcontractor", labelEn: "Subcontractor labor", labelEs: "Mano de obra de subcontratista", scheduleCLine: "11", isJobMaterial: true, sortOrder: 20 },
  { id: "cat_equipment_rental", key: "equipment_rental", labelEn: "Equipment rental", labelEs: "Renta de equipo", scheduleCLine: "20a", isJobMaterial: true, sortOrder: 30 },
  { id: "cat_dump_fees", key: "dump_fees", labelEn: "Dump / disposal fees", labelEs: "Tiradero / basura", scheduleCLine: "27a", isJobMaterial: true, sortOrder: 40 },
  { id: "cat_permits", key: "permits", labelEn: "Permits & inspections", labelEs: "Permisos e inspecciones", scheduleCLine: "27a", isJobMaterial: true, sortOrder: 50 },
  { id: "cat_fuel", key: "fuel", labelEn: "Gas / fuel", labelEs: "Gasolina", scheduleCLine: "9", isJobMaterial: false, sortOrder: 60 },
  { id: "cat_vehicle", key: "vehicle", labelEn: "Vehicle repair & maintenance", labelEs: "Reparación y mantenimiento del vehículo", scheduleCLine: "9", isJobMaterial: false, sortOrder: 70 },
  { id: "cat_tools", key: "tools", labelEn: "Tools & small equipment", labelEs: "Herramienta y equipo pequeño", scheduleCLine: "22", isJobMaterial: false, sortOrder: 80 },
  { id: "cat_meals", key: "meals", labelEn: "Meals", labelEs: "Comida", scheduleCLine: "24b", isJobMaterial: false, sortOrder: 90 },
  { id: "cat_insurance", key: "insurance", labelEn: "Insurance", labelEs: "Seguro", scheduleCLine: "15", isJobMaterial: false, sortOrder: 100 },
  { id: "cat_phone", key: "phone", labelEn: "Phone & internet", labelEs: "Teléfono e internet", scheduleCLine: "25", isJobMaterial: false, sortOrder: 110 },
  { id: "cat_software", key: "software", labelEn: "Software & subscriptions", labelEs: "Software y suscripciones", scheduleCLine: "27a", isJobMaterial: false, sortOrder: 120 },
  { id: "cat_advertising", key: "advertising", labelEn: "Advertising & marketing", labelEs: "Publicidad y marketing", scheduleCLine: "8", isJobMaterial: false, sortOrder: 130 },
  { id: "cat_office", key: "office", labelEn: "Office supplies", labelEs: "Papelería y oficina", scheduleCLine: "18", isJobMaterial: false, sortOrder: 140 },
  { id: "cat_professional", key: "professional", labelEn: "Accounting & legal", labelEs: "Contador y abogado", scheduleCLine: "17", isJobMaterial: false, sortOrder: 150 },
  { id: "cat_bank_fees", key: "bank_fees", labelEn: "Bank & card fees", labelEs: "Comisiones de banco y tarjeta", scheduleCLine: "27a", isJobMaterial: false, sortOrder: 160 },
  { id: "cat_other", key: "other", labelEn: "Other", labelEs: "Otro", scheduleCLine: "27a", isJobMaterial: false, sortOrder: 999 },
];
