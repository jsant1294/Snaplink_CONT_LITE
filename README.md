# SnapLink Contractor

Contractor-facing client intake + onboarding. One link a contractor gives their clients:
clients submit project details + photos → contractor gets an organized lead board with
AI summaries, follow-up messages, and one-click proposal PDFs.

## Quick start

```bash
npm install
cp .env.example .env        # optional — app runs fully without a key (offline AI drafts)
npm run dev
```

- **Client page:** http://localhost:3000/contractor/demo (also `/contractor/northsidetree`)
- **Admin dashboard:** http://localhost:3000/contractor-admin
- **Create a contractor:** http://localhost:3000/contractor-admin/new-contractor
- **Estimator:** "Build estimate → PDF" on any lead card

## Routes

| Route | What |
|---|---|
| `/contractor/[username]` | Public mobile-first client page (buttons, intake wizard, vCard) |
| `/contractor-admin` | Lead board: cards, statuses, AI, quick actions |
| `POST /api/contractor/leads` | Submit a lead |
| `GET /api/contractor/leads` | List leads (`?contractor=demo` to filter) |
| `PATCH /api/contractor/leads/[id]` | Update status |
| `POST /api/contractor/ai-summary` | Generate AI lead intelligence |
| `GET /api/contractor/proposal-pdf?leadId=…` | Branded proposal PDF (pdf-lib) |
| `GET/POST /api/contractor/profiles` | List / create contractors (username auto-slugged, dedup enforced) |
| `GET/POST /api/contractor/estimates?leadId=…` | Load / upsert the lead's estimate |
| `GET /api/contractor/estimate-pdf?leadId=…` | Full line-item estimate PDF |

## DEPLOY — production checklist (JJ Remodeling-ready)

**1. Neon database (~5 min)**
- Create a project at neon.tech → copy the connection string
- Locally: `DATABASE_URL="postgres://...neon.tech/neondb?sslmode=require" npm run db:push`
- Optional demo profiles: `DATABASE_URL=... npm run db:seed`

**2. Vercel**
- Push the repo to GitHub → import in Vercel (Next.js auto-detected)
- Environment variables:
  - `DATABASE_URL` — the Neon string (**required in production**; without it the
    app silently falls back to JSON files, which do NOT persist on serverless)
  - `OPERATOR_PIN` — pick a real 6-digit PIN. **Never ship the default.**
  - `OPENROUTER_API_KEY` — optional; without it AI runs offline drafts
  - `BLOB_READ_WRITE_TOKEN` — optional but recommended: create a Blob store in
    Vercel → Storage; photos then upload to Blob instead of living in Postgres
- Deploy. HTTPS is automatic.

**3. Onboard the client (~3 min)**
- Open `/contractor-admin/new-contractor`, enter your operator PIN
- Create the profile with their 6-digit PIN + dashboard language + services
- Hand them two things: `yourdomain.com/contractor/their-slug` (public — put it
  on the SnapLink NFC card / QR) and `yourdomain.com/contractor-admin/their-slug`
  + their PIN (private board)

**Store modes:** `DATABASE_URL` set → Postgres/Drizzle (production).
Unset → local JSON in `.data/` (demos only). Same code path everywhere else —
verified against real Postgres 16: schema push, tenant isolation, lead + photo
writes, AI persistence, estimates, both PDF languages, restart persistence.

## Link previews (Open Graph)

When you paste a SnapLink link into WhatsApp, iMessage, Facebook, or a text, it
shows a branded preview card — the SnapLink Contractor logo lockup with
"Southline One Digital Media · Alpharetta, GA", so people see where it comes from.

- The image lives at `public/og-image.png` (1200×630). Replace it anytime with
  your own artwork at the same path + size.
- The Next.js app reads it automatically via `app/layout.tsx` metadata. For
  absolute URLs (required by WhatsApp/iMessage), set `APP_URL=https://your-domain.com`
  in your environment — Vercel does this cleanly.
- The two standalone marketing pages (`marketing/*.html`) have matching OG tags;
  before hosting them, replace `https://YOUR-DOMAIN.com/og-image.png` with your
  real URL and upload `og-image.png` alongside them.
- After deploying, validate the card at opengraph.dev or by pasting the link into
  a WhatsApp chat with yourself. Some platforms cache — append `?v=2` to refresh.

## Multi-tenant model

Three layers, PIN-gated (MVP auth — swap for Auth.js when the roster grows):

1. **Operator (you):** `/contractor-admin` — master console behind `OPERATOR_PIN`
   (env, default `777777`). Contractor directory + all-tenant lead board. The
   operator PIN also unlocks any contractor scope.
2. **Contractor (your client):** `/contractor-admin/[username]` — their own
   6-digit PIN (set at creation) unlocks ONLY their board. Cross-tenant access
   is rejected at the API layer (verified: demo's PIN gets 401 on northsidetree's
   scope). They never see other tenants exist. Seeds: demo `111111` (Spanish
   dashboard), northsidetree `222222` (English dashboard).
3. **Homeowner:** public intake only, no login ever.

**PIN recovery ("my client forgot his PIN"):** on the operator console, every
contractor card has a **Reset PIN** button — enter a new 6-digit PIN, hit Set,
read it to them over the phone. The old PIN dies instantly. Only the operator
PIN can reset (verified: a contractor's own PIN gets 401 on the reset endpoint);
PINs are write-only and never appear in any API response. The same card also
toggles their dashboard language (English ↔ Español) with one click.

Every protected route (leads list/read/status, AI, estimates, both PDFs) checks
`x-snaplink-pin` header or `?pin=` (for PDF links opened in new tabs). PINs are
never returned by any API. Creating contractors requires the operator PIN.

## Language model — two dials, never mixed

- **Lead language** (homeowner's choice on the public page): drives the intake,
  the follow-up SMS, and the *default* language of both client PDFs.
- **Contractor language** (`preferredLanguage`, set at creation): their entire
  dashboard + estimator UI renders in it, and the AI writes all
  contractor-facing analysis (summary, scope notes, questions, needs-confirmation)
  in it — while client-facing outputs (SMS, proposal intro) stay in the lead's
  language. A Spanish-dominant contractor reads "Notas de alcance" about an
  English homeowner and sends them an English text.
- **Both PDFs generate in either language on demand**, regardless of anyone's
  default: `?lang=en|es` on `/api/contractor/proposal-pdf` and
  `/api/contractor/estimate-pdf`. The dashboard has Proposal EN / ES buttons;
  the estimator has Save + PDF (English) / (Spanish). Same data, both documents,
  back to back — never blended within one document.

## Service library — GC + handyman

`lib/services.ts` ships **55+ services in 10 trade categories** (Remodeling, Paint/Drywall,
Flooring, Roofing/Exterior, Plumbing, Electrical, HVAC, Outdoor, Concrete/Masonry, Handyman),
each bilingual and mapped to one of **16 trade-specific question sets** (`lib/questions.ts`).
Contractors pick their services at creation; the client intake only shows what they offer.

## Payments & invoices — the loop closer

SnapLink **never processes or holds money** — it displays the contractor's own
payment instructions and tracks what they mark received. Zero payment-facilitator
liability.

**Payment methods** (set at creation or self-service by the contractor):
Zelle, Cash App, Venmo, PayPal.me, a Stripe Payment Link (pasted from their Stripe
dashboard — no Connect, no onboarding), plus cash/check with "make payable to."

**Invoice PDF** (`/api/contractor/invoice-pdf?leadId=…&pin=…&lang=en|es`):
line items from the estimate, subtotal → tax → total → deposit due → **balance
due**, a **"How to pay"** block listing their methods, a **scan-to-pay QR** (first
tappable method — PayPal/Stripe/CashApp/Venmo, amount pre-filled to the balance),
and a **PAID IN FULL / PARTIALLY PAID** stamp. Renders in EN or ES.

**Payment tracking** (on the lead card): record deposit / balance / partial / full
with the method used; a running "Paid $X" total shows on the card; recording the
balance flips the invoice stamp to PAID IN FULL and drops the how-to-pay block.
`POST /api/contractor/payments` · `DELETE ?leadId=&paymentId=` · both PIN-scoped.

**QR endpoint** (`/api/contractor/pay-qr?url=…`): renders a PNG QR for any pay URL
— use it on-site so a homeowner scans and pays the deposit on the spot.

Verified against Postgres: methods saved self-service, deposit recorded, invoice
EN+ES with QR + PARTIALLY PAID, balance recorded → PAID IN FULL + QR suppressed,
cross-tenant payment rejected (401), estimate/proposal PDFs unaffected.

## Estimator

Open from any lead card → `/contractor-admin/estimate/[leadId]`:

- **Item library**: 110+ common GC/handyman line items (`lib/estimate-library.ts`) with
  bilingual descriptions and standard units (sq ft, ln ft, each, hour, day, job, cu yd).
  **No prices ship with the library** — the contractor enters their own rates. SnapLink
  never invents pricing.
- Custom items, reorder, qty × unit × rate with live line totals
- Tax %, flat discount, deposit %, validity window, notes/exclusions
- Live totals panel: subtotal → discount → tax → total → deposit due → balance
- **Save + Generate PDF** → professional branded estimate with a line-item table,
  totals block, terms, and signature line — rendered fully in Spanish for
  Spanish-language leads (item descriptions included via `descriptionEs`)
- One estimate per lead (upsert), stored in `.data/estimates.json`

## Contractor creation

`/contractor-admin/new-contractor` — business info + grouped service picker
("Select all" per category). Creates the contractor in `.data/contractors.json`
(demo profiles are seeded on first run) and the public page goes live immediately
at `/contractor/[username]`.

## Bilingual (EN/ES)

Every client-facing surface is fully bilingual with an English/Español toggle:
public page, all buttons, the entire intake wizard, every trade question set,
timelines, budgets, and contact options. Data is stored **canonically in English**
(answer values, statuses) so the dashboard and AI pipeline stay consistent — Spanish
is a display layer. The client's language is saved on the lead:

- AI **follow-up SMS** and **proposal intro** generate in the client's language
- The **proposal PDF** renders fully in Spanish for Spanish-language leads
- The dashboard shows a **"Habla español"** badge so the contractor knows how to reply
- Project types translate everywhere client-facing (Techos, Pisos, Remodelación de Cocina…)

## AI — free models only

- `lib/ai/model-guard.ts` — single choke point. Any model not ending in `:free` throws
  `ModelGuardError` before the request leaves the server. Paid models cannot be called.
- `lib/ai/openrouter.ts` — free-model fallback chain (Llama 3.3 70B free → Gemini Flash free
  → Mistral Small free → Llama 3.1 8B free). No `OPENROUTER_API_KEY`? Returns a
  deterministic offline draft so the demo always works.
- AI never invents measurements or prices — missing info goes to **Needs Confirmation**.

## Storage

MVP uses file-based JSON at `.data/leads.json` behind a repo-shaped interface
(`lib/store.ts`). Swap for Drizzle + Postgres/SQLite by reimplementing `leadStore` —
API routes don't change. **Note:** file storage works locally / on a VPS, not on
Vercel serverless (ephemeral filesystem).

## Data model (future-ready)

`lib/types.ts` defines Contractor, ClientContact, Lead, Photo, Estimate, tags, and
QR/NFC lead sources — flat rows with FK ids, ready to map to Drizzle tables.

## Tested

- `npm run build` ✓ clean
- Tenant isolation ✓ (401 without PIN, cross-tenant 401, PINs never leak from APIs)
- Operator console ✓ · scoped dashboards ✓ (render in contractor's language)
- Dual-language AI ✓ both directions (ES contractor + EN client, EN contractor + ES client)
- Both PDFs ✓ generate in EN *and* ES from the same data via ?lang=
- Contractor create ✓ (slug + dedup + PIN + language, operator-PIN protected) · new public page live ✓
- Lead submission ✓ · AI summary ✓ (offline + guard) · status PATCH ✓
- Estimate save/upsert ✓ · totals math verified to the penny ✓
- Estimate PDF ✓ EN + ES (table, tax, deposit, balance) · 404 guard before save ✓
- Proposal PDF ✓ EN + ES · Pages: all 200 · unknown contractor 404
