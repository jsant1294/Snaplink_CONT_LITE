// ---------------------------------------------------------------------------
// Seed one demo Snaplink Profile, reusing the identity of the existing
// lib/real-estate/fixtures.ts demoAgents[0] (Elena Martinez) by name/slug
// only — there is no relationship or FK between this table and the
// multi-tenant real_estate_agents data. This just makes the homepage
// "Featured Local Real Estate Professionals" section and the /homes
// "Listed by Elena Martinez" link both point at a real, coherent profile
// (agent_profiles.status is "active" so it actually renders).
//
// Also seeds one non-real-estate professional (a photographer) on the SAME
// unified agent_profiles model — profession_type "photographer", with the
// shared brokerage_name field holding the studio name and no license — proving
// the model serves every profession without a parallel profile system.
//
//   node scripts/seed-agent-profiles-demo.mjs
//
// ALL DATA IS FICTIONAL DEMO CONTENT, same convention as scripts/seed-demo-ridgeline.mjs.
// Idempotent (ON CONFLICT DO NOTHING). Never auto-run.
// ---------------------------------------------------------------------------
import { config } from "dotenv";
config({ path: ".env" });
import pg from "pg";
import { assertNotProductionDatabase } from "../lib/local-db-guard.ts";

const DB_URL = (process.env.DATABASE_URL || process.env.POSTGRES_URL || "").trim();
if (!DB_URL) {
  console.error("No DATABASE_URL (or POSTGRES_URL) set. Add it to .env or pass it inline.");
  process.exit(1);
}
assertNotProductionDatabase(DB_URL, "scripts/seed-agent-profiles-demo.mjs");

const pool = new pg.Pool({
  connectionString: DB_URL,
  ssl: /localhost|127\.0\.0\.1/.test(DB_URL) ? undefined : { rejectUnauthorized: false },
});

await pool.query(
  `INSERT INTO agent_profiles (
     id, slug, status, name, brokerage_name, license_number, phone, email,
     service_area, bio, languages, specialties, service_areas, years_experience, photo_url, is_demo
   ) VALUES (
     'apx_demo_elena_martinez', 'elena-martinez', 'active', 'Elena Martinez',
     'Southline Realty Group', 'GA 412908', '(678) 555-0142', 'elena@example.com',
     'North Atlanta', 'Thoughtful residential representation throughout North Atlanta.',
     '["English","Español"]'::jsonb, '["Luxury residential","Relocation","New construction"]'::jsonb,
     '["Alpharetta","Milton","Roswell"]'::jsonb, 12,
     'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=85',
     true
   )
   ON CONFLICT (slug) DO NOTHING`
);

await pool.query(
  `INSERT INTO agent_profiles (
     id, slug, status, name, profession_type, brokerage_name, phone, email,
     service_area, bio, tagline, languages, specialties, service_areas, years_experience, photo_url,
     southline_status, is_demo
   ) VALUES (
     'apx_demo_camila_ruiz', 'camila-ruiz-photography', 'active', 'Camila Ruiz',
     'photographer', 'Camila Ruiz Studio', '(470) 555-0177', 'camila@example.com',
     'Decatur', 'Editorial and architectural photography for homes, listings, and interiors.',
     'Homes that photograph as beautifully as they live.', '["English","Español"]'::jsonb,
     '["Architecture","Interior","Real estate listing","Editorial"]'::jsonb,
     '["Decatur","Oakhurst","Avondale Estates"]'::jsonb, 9,
     'https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=800&q=85',
     'published', true
   )
   ON CONFLICT (slug) DO NOTHING`
);

console.log("Seeded demo profiles: elena-martinez (realtor) + camila-ruiz-photography (photographer).");
await pool.end();
