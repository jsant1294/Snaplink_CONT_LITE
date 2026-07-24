// ---------------------------------------------------------------------------
// Seed the PUBLIC DEMO contractor used by the pitch page CTA.
//
//   npm run db:seed:demo
//
// Creates ridgeline-demo with a full, coherent year so every claim on the
// pitch page has something real behind it: leads with payments, receipts
// across categories, a sub over the 1099 threshold with no W-9, a 1099 that
// doesn't match the books, and quarters that are caught up / short.
//
// ALL DATA IS FICTIONAL. This account is public — the PIN is printed on the
// sales page. Never put a real client, real TIN, or real money in here.
// Safe to re-run: every insert is ON CONFLICT DO NOTHING.
// ---------------------------------------------------------------------------
import "dotenv/config";
import pg from "pg";

const DB_URL = (process.env.DATABASE_URL || process.env.POSTGRES_URL || "").trim();
if (!DB_URL) {
  console.error("No DATABASE_URL (or POSTGRES_URL) set. Add it to .env or pass it inline.");
  process.exit(1);
}

const YEAR = Number(process.env.DEMO_YEAR || 2026);
const CID = "ctr_ridgeline";
const USER = "ridgeline-demo";
const PIN = "902161";
const PCT = 25;

const pool = new pg.Pool({
  connectionString: DB_URL,
  ssl: /localhost|127\.0\.0\.1/.test(DB_URL) ? undefined : { rejectUnauthorized: false },
});
const q = (text, params) => pool.query(text, params);

// --- contractor ------------------------------------------------------------
await q(
  `INSERT INTO contractors (id, username, pin, preferred_language, business_name, owner_name,
     phone, whatsapp, email, service_area, services, tagline, license_info)
   VALUES ($1,$2,$3,'en','Ridgeline Remodeling','Tony Alvarez','+14045550118','+14045550118',
     'office@ridgeline-demo.example','Demo account · fictional data',
     $4,'Kitchens, baths, and additions. Licensed & insured. Hablamos español.',
     'Demo license #DEMO-0000 · fictional')
   ON CONFLICT (id) DO NOTHING`,
  [CID, USER, PIN, JSON.stringify(["Kitchen Remodel","Bathroom Remodel","Flooring","Drywall Install / Repair","Interior Painting","Countertops"])]
);
console.log("contractor:", USER);

// --- tax profile -----------------------------------------------------------
await q(
  `INSERT INTO tax_profiles (id, contractor_id, entity_type, set_aside_percent,
     business_legal_name, tax_year_start_month, payee_alert_threshold_cents)
   VALUES ('tax_ridgeline',$1,'llc_single',$2,'Ridgeline Remodeling LLC',1,60000)
   ON CONFLICT (id) DO NOTHING`,
  [CID, PCT]
);

// --- leads + payments (income) --------------------------------------------
const pay = (leadId, n, kind, amount, via, iso) =>
  ({ id: `pay_${leadId}_${n}`, leadId, kind, amount, via, receivedAt: `${iso}T15:00:00.000Z` });

const LEADS = [
  ["lead_rl_1","Susan Whitfield","+14045550101","Kitchen Remodel","1420 Ridge Hollow Ct","Completed",
    [pay("lead_rl_1",1,"deposit",4200,"Zelle",`${YEAR}-02-11`), pay("lead_rl_1",2,"balance",6300,"Check",`${YEAR}-03-19`)]],
  ["lead_rl_2","Marcus Bell","+14045550102","Bathroom Remodel","88 Sable Creek Dr","Completed",
    [pay("lead_rl_2",1,"full",7900,"Zelle",`${YEAR}-03-27`)]],
  ["lead_rl_3","Dana Okafor","+14045550103","Flooring","2207 Kestrel Way","Completed",
    [pay("lead_rl_3",1,"deposit",5100,"CashApp",`${YEAR}-05-04`), pay("lead_rl_3",2,"balance",7650,"Zelle",`${YEAR}-06-22`)]],
  ["lead_rl_4","Priya Raman","+14045550104","Countertops","640 Alder Bend","Completed",
    [pay("lead_rl_4",1,"full",12000,"Check",`${YEAR}-06-30`)]],
  ["lead_rl_5","Hector Salinas","+14045550105","Kitchen Remodel","19 Cypress Landing","Completed",
    [pay("lead_rl_5",1,"deposit",8000,"Zelle",`${YEAR}-07-16`), pay("lead_rl_5",2,"balance",12000,"Check",`${YEAR}-09-08`)]],
  ["lead_rl_6","Angela Cruz","+14045550106","Interior Painting","305 Fern Hollow","Completed",
    [pay("lead_rl_6",1,"full",11200,"Zelle",`${YEAR}-08-29`)]],
  ["lead_rl_7","Owen Pratt","+14045550107","Drywall Install / Repair","77 Larkspur Rd","In Progress",
    [pay("lead_rl_7",1,"deposit",12000,"Zelle",`${YEAR}-10-21`)]],
];
for (const [id,name,phone,type,addr,status,payments] of LEADS) {
  await q(
    `INSERT INTO leads (id, contractor_id, contractor_username, source, status, language,
       client_name, phone, project_address, project_type, timeline, budget_range, notes, payments)
     VALUES ($1,$2,$3,'link',$4,'en',$5,$6,$7,$8,'Within 30 days','$5k–$25k','Demo lead — fictional.',$9)
     ON CONFLICT (id) DO NOTHING`,
    [id, CID, USER, status, name, phone, addr, type, JSON.stringify(payments)]
  );
}
console.log("leads:", LEADS.length);

// --- payees (subs) ---------------------------------------------------------
const PAYEES = [
  ["pye_rl_miguel","Miguel Drywall","individual","Miguel A. Serrano","ssn","7788","false",null],
  ["pye_rl_ramirez","Ramirez Electric LLC","business","Ramirez Electric LLC","ein","4412","true",`${YEAR}-02-03`],
  ["pye_rl_kelly","Kelly Painting","individual","Kelly J. Doyle","ssn","2019","true",`${YEAR}-04-18`],
];
for (const [id,name,ptype,legal,tin,last4,w9,on] of PAYEES) {
  await q(
    `INSERT INTO payees (id, contractor_id, name, payee_type, legal_name, tin_type, tin_last4,
       w9_on_file, w9_received_on, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'Demo payee — fictional.')
     ON CONFLICT (id) DO NOTHING`,
    [id, CID, name, ptype, legal, tin, last4, w9, on]
  );
}
console.log("payees:", PAYEES.length);

// --- expenses --------------------------------------------------------------
// [date, categoryId, dollars, vendor, leadId|null, payeeId|null]
const EX = [
  [`${YEAR}-01-14`,"cat_tools",   389.00,"Home Depot",           null,          null],
  [`${YEAR}-01-22`,"cat_insurance",1180.00,"Foremost Insurance",  null,          null],
  [`${YEAR}-02-08`,"cat_job_materials",2140.55,"Builders FirstSource","lead_rl_1",null],
  [`${YEAR}-02-19`,"cat_fuel",     412.30,"Shell",                null,          null],
  [`${YEAR}-03-04`,"cat_subcontractor",1800.00,"Miguel Drywall",  "lead_rl_1","pye_rl_miguel"],
  [`${YEAR}-03-12`,"cat_dump_fees",265.00,"County Transfer Station",null,        null],
  [`${YEAR}-03-25`,"cat_permits",  310.00,"City Permit Office",   "lead_rl_2",   null],

  [`${YEAR}-04-09`,"cat_job_materials",3310.80,"Ferguson",        "lead_rl_3",   null],
  [`${YEAR}-04-21`,"cat_subcontractor",2400.00,"Miguel Drywall",  "lead_rl_3","pye_rl_miguel"],
  [`${YEAR}-05-06`,"cat_phone",    88.00,"Verizon",               null,          null],
  [`${YEAR}-05-17`,"cat_fuel",     468.90,"Shell",                null,          null],
  [`${YEAR}-06-02`,"cat_subcontractor",3200.00,"Ramirez Electric LLC","lead_rl_4","pye_rl_ramirez"],
  [`${YEAR}-06-24`,"cat_equipment_rental",540.00,"Sunbelt Rentals","lead_rl_4",  null],

  [`${YEAR}-07-11`,"cat_job_materials",5240.15,"Builders FirstSource","lead_rl_5",null],
  [`${YEAR}-07-28`,"cat_subcontractor",3600.00,"Ramirez Electric LLC","lead_rl_5","pye_rl_ramirez"],
  [`${YEAR}-08-13`,"cat_fuel",     501.20,"Shell",                null,          null],
  [`${YEAR}-08-26`,"cat_subcontractor",550.00,"Kelly Painting",   "lead_rl_6","pye_rl_kelly"],
  [`${YEAR}-09-09`,"cat_office",   142.75,"Staples",              null,          null],
  [`${YEAR}-09-23`,"cat_dump_fees",380.00,"County Transfer Station",null,        null],

  [`${YEAR}-10-14`,"cat_job_materials",2890.40,"Ferguson",        "lead_rl_7",   null],
  [`${YEAR}-11-05`,"cat_software",  49.00,"QuickBooks",           null,          null],
  [`${YEAR}-11-19`,"cat_professional",650.00,"Alvarez CPA",       null,          null],
  [`${YEAR}-12-03`,"cat_fuel",     455.60,"Shell",                null,          null],
];
let n = 0;
for (const [date,cat,dollars,vendor,leadId,payeeId] of EX) {
  const cents = Math.round(dollars * 100);
  await q(
    `INSERT INTO expenses (id, contractor_id, lead_id, payee_id, category_id, amount_cents,
       spent_on, vendor, note, billed_to_client)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'Demo expense — fictional.',$9)
     ON CONFLICT (id) DO NOTHING`,
    [`exp_rl_${++n}`, CID, leadId, payeeId, cat, cents, date, vendor, leadId ? "true" : "false"]
  );
}
console.log("expenses:", EX.length);

// --- a 1099 that does NOT match the books (the reconciliation story) --------
await q(
  `INSERT INTO forms_1099_received (id, contractor_id, tax_year, issuer_name, form_type,
     amount_cents, notes)
   VALUES ('f1099_rl_1',$1,$2,'Hallmark GC Partners','1099-NEC',1200000,
     'Demo — issuer reported less than our own records show. Reconcile before filing.')
   ON CONFLICT (id) DO NOTHING`,
  [CID, YEAR]
);

// --- set-asides: Q1 exactly caught up, Q2 partial, Q3/Q4 nothing -----------
const inc = [0,0,0,0], exp = [0,0,0,0];
const qOf = (iso) => { const m = Number(iso.slice(5,7)); return m<=3?1:m<=6?2:m<=9?3:4; };
for (const [,,,,,,payments] of LEADS)
  for (const p of payments) inc[qOf(p.receivedAt.slice(0,10))-1] += Math.round(p.amount*100);
for (const [date,,dollars] of EX) exp[qOf(date)-1] += Math.round(dollars*100);
const suggested = (i) => Math.round(Math.max(0, inc[i]-exp[i]) * (PCT/100));

const SET = [
  [1, suggested(0),                        `${YEAR}-04-12`, "Moved to tax savings — caught up."],
  [2, Math.round(suggested(1) * 0.62),     `${YEAR}-06-18`, "Partial transfer — slow month."],
];
for (const [quarter, cents, movedOn, note] of SET) {
  await q(
    `INSERT INTO tax_setasides (id, contractor_id, tax_year, quarter, amount_cents, moved_on, note)
     VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING`,
    [`sa_rl_${YEAR}_q${quarter}`, CID, YEAR, quarter, cents, movedOn, note]
  );
}

console.log("\n  quarter   income      expenses    net         suggested   set aside");
for (let i=0;i<4;i++){
  const set = SET.find(s=>s[0]===i+1)?.[1] ?? 0;
  const f=(c)=>("$"+(c/100).toFixed(2)).padEnd(11);
  console.log(`  Q${i+1}        ${f(inc[i])} ${f(exp[i])} ${f(inc[i]-exp[i])} ${f(suggested(i))} ${f(set)}${set>=suggested(i)?"caught up":"SHORT $"+(((suggested(i)-set)/100).toFixed(2))}`);
}
await pool.end();
console.log("\ndone —", `/contractor-admin/${USER}?pin=${PIN}`);
