// ---------------------------------------------------------------------------
// Seed the Southline Living PUBLIC BETA demo content (living.snaplinkmedia.com).
//
//   npm run db:seed:beta
//
// WHAT THIS SEEDS (public marketplace only — completed verticals):
//   - contractor_profiles  : public contractor pages (/contractor/{username})
//   - agent_profiles       : professional directory (/agents, /results, /p/...)
//   - leads                : a few "New" leads so the contractor inbox is alive
//
// DELIBERATELY NOT SEEDED (unfinished or separate verticals):
//   - Rentals & Getaways, real-estate marketplace, payment/billing records.
//
// DEMO DATA CONVENTION (so it is trivially removable later):
//   - contractors:  id = ctr_demo_<slug>  (plus legacy ctr_demo / ctr_trees /
//                   ctr_ridgeline from the older seed scripts)
//   - agent_profiles: id = apx_demo_<slug>
//   - leads:        id = lead_demo_*
//   - Every row that has a human-visible notes/tagline field says "Demo".
//   - scripts/unseed-beta-demo.mjs deletes ONLY these prefixed rows.
//
// ALL DATA IS FICTIONAL. No real customer data, no real licenses, no real
// money. PINs are printed for the demo contractor accounts on purpose.
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
assertNotProductionDatabase(DB_URL, "scripts/seed-beta-demo.mjs");

const pool = new pg.Pool({
  connectionString: DB_URL,
  ssl: /localhost|127\.0\.0\.1/.test(DB_URL) ? undefined : { rejectUnauthorized: false },
});
const q = (text, params) => pool.query(text, params);

// --- verified Unsplash reference photos -------------------------------------
const P = (id, w = 900) => `https://images.unsplash.com/photo-${id}?w=${w}&q=85`;
const PORTRAITS = [
  P("1494790108377-be9c29b29330"), // woman
  P("1507003211169-0a1dd7228f2d"), // man
  P("1573496359142-b8d87734a5a2"), // woman professional
  P("1500648767791-00dcc994a43e"), // man
  P("1544005313-94ddf0286df2"),    // woman
  P("1560250097-0b93528c311a"),    // man suit
  P("1472099645785-5658abf4ff4e"), // man
  P("1438761681033-6461ffad8d80"), // woman
];

// profession-themed placeholders (verified, same CDN the app already uses)
const COVERS = {
  remodeler: [P("1600585154340-be6161a56a0c"), P("1581092160562-40aa08e78837"), P("1560518883-ce09059eeffa")],
  electrician: [P("1621905251189-08b45d6a269e"), P("1621905252507-b35492cc74b4"), P("1565608087341-404b25492fee")],
  plumber: [P("1558618666-fcd25c85cd64"), P("1584622781564-1d987f7333c1")],
  hvac: [P("1620626011761-996317b8d101"), P("1611273426858-450d8e3c9fce")],
  painting: [P("1541123437800-1bb1317badc2"), P("1562259949-e8e7689d7828"), P("1589939705384-5185137a7f0f")],
  flooring: [P("1600607687920-4e2a09cf159d"), P("1615873968403-89e068629265")],
  landscaping: [P("1416879595882-3373a0480b5b"), P("1558904541-efa843a96f01"), P("1592417817098-8fd3d9eb14a5")],
  interior_designer: [P("1600566752355-35792bedcfea"), P("1616486029423-aaa4789e8c9a"), P("1618221195710-dd6b41faaea6")],
  home_inspector: [P("1523217582562-09d0def993a6"), P("1600585152220-90363fe7e115")],
  photography: [P("1516035069371-29a1b244cc32"), P("1554048612-b6a482bc67e5"), P("1552168324-d612d77725e3")],
  realtor: [P("1503387762-592deb58ef4e"), P("1487958449943-2429e8be8625")],
};
const cover = (k, i = 0) => (COVERS[k] ?? COVERS.remodeler)[i % (COVERS[k] ?? COVERS.remodeler).length];

// --- public contractor profiles ---------------------------------------------
const CONTRACTORS = [
  {
    id: "ctr_demo_brightbuild", username: "demo-brightbuild", pin: "333333", professionType: "remodeler",
    businessName: "Bright Build & Renovation", ownerName: "Evan Caldwell",
    phone: "+16785550131", whatsapp: "+16785550131", email: "office@brightbuild-demo.example",
    serviceArea: "Alpharetta · Roswell · Milton · Cumming",
    services: ["Kitchen Remodel", "Bathroom Remodel", "Basement Finishing", "Room Addition", "Flooring", "Interior Painting", "Cabinets & Vanities", "Countertops"],
    tagline: "Design-build remodeling done on schedule and on budget.",
    licenseInfo: "GA Lic. #DEMO-1041 · fictional",
    website: "https://brightbuild-demo.example", brandColor: "#b45309", coverIdx: 0,
  },
  {
    id: "ctr_demo_libertyelectric", username: "demo-libertyelectric", pin: "444444", professionType: "electrician",
    businessName: "Liberty Electric Co.", ownerName: "Jorge Sandoval",
    phone: "+16785550132", whatsapp: "+16785550132", email: "service@libertyelectric-demo.example",
    serviceArea: "North Atlanta · Alpharetta · Roswell · Sandy Springs",
    services: ["Electrical Repair", "Panel Upgrade", "Lighting & Ceiling Fans", "EV Charger Install", "Outlets & Switches"],
    tagline: "Licensed electricians for panel, lighting, and EV charger work.",
    licenseInfo: "GA Lic. #DEMO-2022 · fictional",
    website: "https://libertyelectric-demo.example", brandColor: "#2563eb", coverIdx: 0,
  },
  {
    id: "ctr_demo_pineplumbing", username: "demo-pineplumbing", pin: "555555", professionType: "plumber",
    businessName: "Pine Plumbing Co.", ownerName: "Whitney Brooks",
    phone: "+14705550141", whatsapp: "+14705550141", email: "hello@pineplumbing-demo.example",
    serviceArea: "Decatur · Tucker · Stone Mountain · Oakhurst",
    services: ["Plumbing Repair", "Water Heater", "Faucets & Fixtures", "Drain Cleaning", "Toilet Install / Repair"],
    tagline: "Fast, clean plumbing repair and water heater replacement.",
    licenseInfo: "GA Lic. #DEMO-3033 · fictional",
    website: "https://pineplumbing-demo.example", brandColor: "#0f766e", coverIdx: 0,
  },
  {
    id: "ctr_demo_peachtreepaint", username: "demo-peachtreepaint", pin: "666666", professionType: "painting",
    businessName: "Peachtree Painting Co.", ownerName: "Alyssa Rangel",
    phone: "+14705550142", whatsapp: "+14705550142", email: "quotes@peachtreepaint-demo.example",
    serviceArea: "Atlanta · Buckhead · Midtown · Decatur",
    services: ["Interior Painting", "Exterior Painting", "Cabinet Painting", "Drywall Install / Repair", "Popcorn Ceiling Removal"],
    tagline: "Interior and exterior paint, cabinet refinishing, and drywall.",
    licenseInfo: "GA Lic. #DEMO-4044 · fictional",
    website: "https://peachtreepaint-demo.example", brandColor: "#dc2626", coverIdx: 0,
  },
  {
    id: "ctr_demo_sunbelthvac", username: "demo-sunbelthvac", pin: "777777", professionType: "hvac",
    businessName: "Sunbelt Climate Solutions", ownerName: "Devin Marsh",
    phone: "+16785550145", whatsapp: "+16785550145", email: "service@sunbelthvac-demo.example",
    serviceArea: "Gwinnett · Lawrenceville · Duluth · Suwanee",
    services: ["HVAC Repair", "HVAC Replacement", "Ductwork"],
    tagline: "Heating and cooling repair, replacement, and ductwork.",
    licenseInfo: "GA Lic. #DEMO-5055 · fictional",
    website: "https://sunbelthvac-demo.example", brandColor: "#ea580c", coverIdx: 0,
  },
  {
    id: "ctr_demo_hilltopoutdoor", username: "demo-hilltopoutdoor", pin: "888888", professionType: "landscaper",
    businessName: "Hilltop Outdoor Living", ownerName: "Cora Nwosu",
    phone: "+16785550148", whatsapp: "+16785550148", email: "hello@hilltopoutdoor-demo.example",
    serviceArea: "Marietta · Kennesaw · Smyrna · Acworth",
    services: ["Landscaping", "Irrigation / Sprinklers", "Sod & Turf", "Fence Install / Repair", "Pergola / Patio Cover", "Concrete Driveway / Patio"],
    tagline: "Landscape design, irrigation, hardscaping, and outdoor living.",
    licenseInfo: "Demo license #DEMO-6066 · fictional",
    website: "https://hilltopoutdoor-demo.example", brandColor: "#15803d", coverIdx: 0,
  },
];

console.log(`seeding ${CONTRACTORS.length} public contractor profiles...`);
let portraitIdx = 0;
for (const c of CONTRACTORS) {
  const avatar = PORTRAITS[portraitIdx++ % PORTRAITS.length];
  await q(
    `INSERT INTO contractors (
       id, username, pin, preferred_language, profession_type, business_name, owner_name,
       phone, whatsapp, email, service_area, services, tagline, license_info,
       website, brand_color, avatar_url, gallery_urls, is_demo
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,true)
     ON CONFLICT (id) DO NOTHING`,
    [c.id, c.username, c.pin, "en", c.professionType, c.businessName, c.ownerName,
     c.phone, c.whatsapp, c.email, c.serviceArea, JSON.stringify(c.services), c.tagline,
     c.licenseInfo, c.website, c.brandColor, avatar,
     JSON.stringify([cover(c.professionType, 0), cover(c.professionType, 1), cover(c.professionType, 2)])]
  );
  console.log("  contractor:", c.username);
}

// --- professional directory (agent_profiles) --------------------------------
// status=active + southline_status published/featured => visible in /agents + /results.
// snaplink_status published => /p/<username> resolves. One featured for the block.
const AGENTS = [
  {
    id: "apx_demo_maya_chen", slug: "maya-chen", professionType: "realtor",
    name: "Maya Chen", brokerageName: "Southline Realty Group",
    licenseNumber: "DEMO-1001", licenseState: "GA", phone: "(678) 555-0151", email: "maya.chen@example.com",
    serviceArea: "North Atlanta", bio: "Buyer's and seller's representation across North Atlanta's top communities.",
    tagline: "Your advocate from first tour to closing table.", languages: ["English", "中文"],
    specialties: ["Residential sales", "Relocation", "New construction"],
    serviceAreas: ["Alpharetta", "Milton", "Johns Creek", "Roswell"],
    categories: ["real-estate"], neighborhoods: ["Windward", "Cambridge", "River Springs"],
    serviceRadius: 25, yearsExperience: 11, featured: true, southlineStatus: "featured", portrait: 0,
  },
  {
    id: "apx_demo_sarah_kim", slug: "sarah-kim", professionType: "realtor",
    name: "Sarah Kim", brokerageName: "Blue Atlas Realty",
    licenseNumber: "DEMO-1002", licenseState: "GA", phone: "(470) 555-0152", email: "sarah.kim@example.com",
    serviceArea: "Dunwoody · Sandy Springs", bio: "Full-service residential brokerage focused on the Perimeter market.",
    tagline: "Selling homes with clarity and follow-through.", languages: ["English", "한국어"],
    specialties: ["First-time buyers", "Condo & townhome", "Luxury listings"],
    serviceAreas: ["Dunwoody", "Sandy Springs", "Brookhaven"],
    categories: ["real-estate"], neighborhoods: ["Perimeter Center", "Brookhaven", "North Springs"],
    serviceRadius: 20, yearsExperience: 8, featured: false, southlineStatus: "published", portrait: 2,
  },
  {
    id: "apx_demo_marcus_reed", slug: "marcus-reed-renovations", professionType: "remodeler",
    name: "Marcus Reed", brokerageName: "Reed & Co. Renovations",
    phone: "(770) 555-0153", email: "marcus@reedco-demo.example",
    serviceArea: "East Cobb · Roswell", bio: "Whole-home renovations and kitchen & bath remodels with an in-house crew.",
    tagline: "We sweat the details so you don't have to.", languages: ["English"],
    specialties: ["Kitchen remodeling", "Bathroom remodeling", "Room additions", "Basement finishing"],
    serviceAreas: ["East Cobb", "Roswell", "Marietta"],
    categories: ["construction-remodeling"], neighborhoods: ["Hampton Hall", "Woodland Brook"],
    serviceRadius: 30, yearsExperience: 15, featured: false, southlineStatus: "published", portrait: 1,
  },
  {
    id: "apx_demo_derek_okafor", slug: "derek-okafor-electric", professionType: "electrician",
    name: "Derek Okafor", brokerageName: "Okafor Electric",
    licenseNumber: "DEMO-1003", licenseState: "GA", phone: "(404) 555-0154", email: "derek@okaforelectric-demo.example",
    serviceArea: "Atlanta · Decatur", bio: "Residential electrical service: panels, lighting, EV chargers, and smart home.",
    tagline: "Powered by precision, built on safety.", languages: ["English", "Igbo"],
    specialties: ["Panel upgrades", "EV charging", "Lighting design"],
    serviceAreas: ["Atlanta", "Decatur", "Avondale Estates"],
    categories: ["electrical"], neighborhoods: ["Kirkwood", "Oakhurst", "Edgewood"],
    serviceRadius: 25, yearsExperience: 13, featured: false, southlineStatus: "published", portrait: 3,
  },
  {
    id: "apx_demo_leah_whitfield", slug: "leah-whitfield-interiors", professionType: "interior_designer",
    name: "Leah Whitfield", brokerageName: "Whitfield Studio",
    phone: "(678) 555-0155", email: "leah@whitfieldstudio-demo.example",
    serviceArea: "Buckhead · Midtown", bio: "Interior design for kitchens, baths, and whole homes — spaces that live as well as they look.",
    tagline: "Spaces designed around the way you actually live.", languages: ["English"],
    specialties: ["Kitchen & bath design", "Whole-home styling", "Space planning"],
    serviceAreas: ["Buckhead", "Midtown", "Virginia Highland"],
    categories: ["architecture-design"], neighborhoods: ["Peachtree Hills", "Ansley Park", "Morningside"],
    serviceRadius: 20, yearsExperience: 10, featured: false, southlineStatus: "published", portrait: 4,
  },
  {
    id: "apx_demo_tomas_herrera", slug: "tomas-herrera-plumbing", professionType: "plumber",
    name: "Tomás Herrera", brokerageName: "Herrera Plumbing",
    licenseNumber: "DEMO-1004", licenseState: "GA", phone: "(470) 555-0156", email: "tomas@herreraplumbing-demo.example",
    serviceArea: "Gwinnett County", bio: "Repairs, water heaters, and remodels — up-front pricing, done right the first time.",
    tagline: "Honest plumbing. Straightforward pricing.", languages: ["English", "Español"],
    specialties: ["Water heaters", "Drain cleaning", "Fixture installation"],
    serviceAreas: ["Lawrenceville", "Duluth", "Suwanee"],
    categories: ["plumbing"], neighborhoods: ["Old Peachtree", "River Plantation"],
    serviceRadius: 25, yearsExperience: 12, featured: false, southlineStatus: "published", portrait: 5,
  },
  {
    id: "apx_demo_danielle_cho", slug: "danielle-cho-photography", professionType: "photographer",
    name: "Danielle Cho", brokerageName: "Cho Visuals",
    phone: "(404) 555-0157", email: "danielle@chovisual-demo.example",
    serviceArea: "Metro Atlanta", bio: "Architectural and listing photography for homes, interiors, and builders.",
    tagline: "Homes that photograph as well as they live.", languages: ["English", "Español"],
    specialties: ["Listing photography", "Architecture", "Interiors"],
    serviceAreas: ["Metro Atlanta", "Athens", "Marietta"],
    categories: ["photography"], neighborhoods: ["Buckhead", "Inman Park", "Historic Roswell"],
    serviceRadius: 50, yearsExperience: 9, featured: false, southlineStatus: "published", portrait: 6,
  },
  {
    id: "apx_demo_isaac_nolan", slug: "isaac-nolan-home-inspections", professionType: "home_inspector",
    name: "Isaac Nolan", brokerageName: "Nolan Home Inspection",
    licenseNumber: "DEMO-1005", licenseState: "GA", phone: "(770) 555-0158", email: "isaac@nolancinspect-demo.example",
    serviceArea: "North Fulton · Forsyth", bio: "ASHI-compliant home inspections with same-week scheduling and photo-rich reports.",
    tagline: "Know exactly what you're buying.", languages: ["English"],
    specialties: ["Pre-purchase inspections", "Radon testing", "New construction inspections"],
    serviceAreas: ["Alpharetta", "Cumming", "Canton"],
    categories: ["inspection-testing"], neighborhoods: ["Crabapple", "Milton", "Coal Mountain"],
    serviceRadius: 35, yearsExperience: 7, featured: false, southlineStatus: "published", portrait: 7,
  },
];

console.log(`seeding ${AGENTS.length} professional directory profiles...`);
for (const a of AGENTS) {
  const photo = PORTRAITS[a.portrait % PORTRAITS.length];
  await q(
    `INSERT INTO agent_profiles (
       id, slug, username, status, pin, name, first_name, last_name, display_name,
       profession_type, brokerage_name, license_number, license_state, phone, email,
       service_area, bio, tagline, photo_url, cover_photo_url, website, instagram,
       languages, specialties, service_areas, categories, neighborhoods,
       service_radius, years_experience, featured, snaplink_status, southline_status, is_demo
     ) VALUES ($1,$2,$3,'active',$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,'published',$30,true)
     ON CONFLICT (id) DO NOTHING`,
    [a.id, a.slug, a.slug, "987654", a.name, a.name.split(" ")[0], a.name.split(" ").slice(1).join(" "), a.name,
     a.professionType, a.brokerageName, a.licenseNumber ?? "", a.licenseState ?? "", a.phone, a.email,
     a.serviceArea, a.bio, a.tagline, photo, cover(a.professionType, 1), "https://" + a.slug + "-demo.example",
     "@" + a.slug.replace(/-/g, ""), JSON.stringify(a.languages), JSON.stringify(a.specialties),
     JSON.stringify(a.serviceAreas), JSON.stringify(a.categories), JSON.stringify(a.neighborhoods),
     a.serviceRadius, a.yearsExperience, a.featured, a.southlineStatus]
  );
  console.log("  agent:", a.slug);
}

// --- a few "New" leads so demo contractor inboxes feel alive -----------------
const LEADS = [
  { id: "lead_demo_1", cid: "ctr_demo_brightbuild", user: "demo-brightbuild", name: "Rita Alvarez", phone: "+14045550181", email: "rita.alvarez@example.com", addr: "230 Willow Bend, Alpharetta", type: "Kitchen Remodel", tl: "Within 30 days", budget: "$25k–$50k", note: "Demo lead — fictional." },
  { id: "lead_demo_2", cid: "ctr_demo_brightbuild", user: "demo-brightbuild", name: "Paul Nguyen", phone: "+16785550182", email: "paul.nguyen@example.com", addr: "18 Brookfield Cir, Roswell", type: "Bathroom Remodel", tl: "1–3 months", budget: "$10k–$25k", note: "Demo lead — fictional." },
  { id: "lead_demo_3", cid: "ctr_demo_libertyelectric", user: "demo-libertyelectric", name: "Grace Whitfield", phone: "+14705550183", email: "grace.w@example.com", addr: "502 Sable Creek, Milton", type: "EV Charger Install", tl: "Within 30 days", budget: "Under $5k", note: "Demo lead — fictional." },
  { id: "lead_demo_4", cid: "ctr_demo_peachtreepaint", user: "demo-peachtreepaint", name: "Tyler Boone", phone: "+14045550184", email: "t.boone@example.com", addr: "77 Kestrel Way, Decatur", type: "Interior Painting", tl: "Within 30 days", budget: "$5k–$10k", note: "Demo lead — fictional." },
  { id: "lead_demo_5", cid: "ctr_demo_sunbelthvac", user: "demo-sunbelthvac", name: "Monica Reyes", phone: "+16785550185", email: "monica.reyes@example.com", addr: "940 Alder Bend, Lawrenceville", type: "HVAC Replacement", tl: "Within 30 days", budget: "$5k–$10k", note: "Demo lead — fictional." },
  { id: "lead_demo_6", cid: "ctr_demo_hilltopoutdoor", user: "demo-hilltopoutdoor", name: "Ben Callahan", phone: "+14705550186", email: "ben.c@example.com", addr: "16 Cypress Landing, Marietta", type: "Pergola / Patio Cover", tl: "1–3 months", budget: "$10k–$25k", note: "Demo lead — fictional." },
];
console.log(`seeding ${LEADS.length} demo leads...`);
for (const l of LEADS) {
  await q(
    `INSERT INTO leads (id, contractor_id, contractor_username, source, status, language,
       client_name, phone, email, project_address, project_type, timeline, budget_range, notes)
     VALUES ($1,$2,$3,'public','New','en',$4,$5,$6,$7,$8,$9,$10,$11)
     ON CONFLICT (id) DO NOTHING`,
    [l.id, l.cid, l.user, l.name, l.phone, l.email, l.addr, l.type, l.tl, l.budget, l.note]
  );
  console.log("  lead:", l.id);
}

await pool.end();
console.log("\nDone. Public beta demo content is live.");
console.log("Demo contractor PINs (login at /contractor-admin/<username>?pin=<pin>):");
for (const c of CONTRACTORS) console.log(`  ${c.username}  pin ${c.pin}`);
console.log("\nRemove everything with:  npm run db:unseed:beta");
