// Seed the default expense categories into Postgres.
//   DATABASE_URL=... node scripts/seed-categories.mjs
// Safe to re-run: ON CONFLICT DO NOTHING.
import "dotenv/config";
import pg from "pg";

const DB_URL = (process.env.DATABASE_URL || process.env.POSTGRES_URL || "").trim();
if (!DB_URL) {
  console.error("No DATABASE_URL (or POSTGRES_URL) set. Add it to .env or pass it inline.");
  process.exit(1);
}

const CATEGORIES = [
  ["cat_job_materials", "job_materials", "Job materials", "Materiales del trabajo", "38", "true", 10],
  ["cat_subcontractor", "subcontractor", "Subcontractor labor", "Mano de obra de subcontratista", "11", "true", 20],
  ["cat_equipment_rental", "equipment_rental", "Equipment rental", "Renta de equipo", "20a", "true", 30],
  ["cat_dump_fees", "dump_fees", "Dump / disposal fees", "Tiradero / basura", "27a", "true", 40],
  ["cat_permits", "permits", "Permits & inspections", "Permisos e inspecciones", "27a", "true", 50],
  ["cat_fuel", "fuel", "Gas / fuel", "Gasolina", "9", "false", 60],
  ["cat_vehicle", "vehicle", "Vehicle repair & maintenance", "Reparación y mantenimiento del vehículo", "9", "false", 70],
  ["cat_tools", "tools", "Tools & small equipment", "Herramienta y equipo pequeño", "22", "false", 80],
  ["cat_meals", "meals", "Meals", "Comida", "24b", "false", 90],
  ["cat_insurance", "insurance", "Insurance", "Seguro", "15", "false", 100],
  ["cat_phone", "phone", "Phone & internet", "Teléfono e internet", "25", "false", 110],
  ["cat_software", "software", "Software & subscriptions", "Software y suscripciones", "27a", "false", 120],
  ["cat_advertising", "advertising", "Advertising & marketing", "Publicidad y marketing", "8", "false", 130],
  ["cat_office", "office", "Office supplies", "Papelería y oficina", "18", "false", 140],
  ["cat_professional", "professional", "Accounting & legal", "Contador y abogado", "17", "false", 150],
  ["cat_bank_fees", "bank_fees", "Bank & card fees", "Comisiones de banco y tarjeta", "27a", "false", 160],
  ["cat_other", "other", "Other", "Otro", "27a", "false", 999],
];

const pool = new pg.Pool({
  connectionString: DB_URL,
  ssl: /localhost|127\.0\.0\.1/.test(DB_URL) ? undefined : { rejectUnauthorized: false },
});

for (const c of CATEGORIES) {
  await pool.query(
    `INSERT INTO expense_categories
       (id, contractor_id, key, label_en, label_es, schedule_c_line, is_job_material, sort_order)
     VALUES ($1, NULL, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (id) DO NOTHING`,
    c
  );
  console.log("seeded category:", c[1]);
}
await pool.end();
console.log("done");
