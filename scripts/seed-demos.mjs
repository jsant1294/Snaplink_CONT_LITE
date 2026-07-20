// Optional: seed the two demo contractors into Postgres.
//   DATABASE_URL=... node scripts/seed-demos.mjs
import pg from "pg";

const demos = [
  ["ctr_demo", "demo", "111111", "es", "Alpharetta Pro Remodeling", "Miguel Torres", "+16785550142", "+16785550142", "estimates@alpharettapro.com", "Alpharetta · Roswell · Cumming · Johns Creek", JSON.stringify(["Kitchen Remodel","Bathroom Remodel","Flooring","Interior Painting","Countertops","Tile Work","Drywall Install / Repair","Handyman Repair"]), "Licensed & insured. Free estimates. Hablamos español.", "GA Lic. #RBQA-004512 · Fully insured"],
  ["ctr_trees", "northsidetree", "222222", "en", "Northside Tree Service", "Dan Whitfield", "+14045550177", "+14045550177", "dan@northsidetree.com", "North Metro Atlanta", JSON.stringify(["Tree Service","Landscaping","Sod & Turf","Pressure Washing"]), "24/7 storm response. Crane + bucket truck on staff.", "ISA Certified Arborist · Fully insured"],
];

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("localhost") ? undefined : { rejectUnauthorized: false },
});
for (const d of demos) {
  await pool.query(
    `INSERT INTO contractors (id, username, pin, preferred_language, business_name, owner_name, phone, whatsapp, email, service_area, services, tagline, license_info)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     ON CONFLICT (id) DO NOTHING`,
    d
  );
  console.log("seeded:", d[1]);
}
await pool.end();
console.log("done");
