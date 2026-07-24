# Lucio Financial Copilot — Phase 1 Drop-In

Built and tested against your live repo (commit `b580f26`). Everything here compiles clean and was verified against a real Postgres 16 instance.

---

## What this is

A **drop-in overlay** — 13 new files and 6 modified files. Unzip it over your project root and your git diff will show exactly what changed.

**It does not include `node_modules`, `.next`, `.git`, or `.data`.** Nothing you have is deleted.

---

## Install (5 minutes)

### 1. Branch first — always
```bash
cd "/Volumes/DevDrive/ACTIVE_PROJECTS/snaplink-contractor 8"
git checkout -b feature/lfc-money
```

### 2. Copy the files in
Unzip this archive and copy its contents over your project root, preserving folders. Skip `LFC-INSTALL-README.md` itself (or delete it after).

### 3. Review what changed
```bash
git status
git diff
```
You should see 13 new files and 6 modified. **If anything else shows as modified, stop and tell me.**

### 4. Migrate the database
Point at a **non-production** database first if you can:
```bash
npm run db:push              # adds 3 tables, alters nothing
npm run db:seed:categories   # loads the 17 default categories
```
Then confirm you see `expenses`, `expense_categories`, `tax_profiles` — and that nothing existing was altered.

### 5. Build and run
```bash
npm run build
npm run dev
```

### 6. Try it
Open your contractor dashboard, enter the PIN — a **Money** button now sits in the header. Tap it.

---

## Files added (13)

| File | Purpose |
|---|---|
| `lib/money.ts` | Integer-cents conversion, formatting, date helpers |
| `lib/money-types.ts` | `Expense`, `ExpenseCategory`, `TaxProfile`, `MoneySummary` |
| `lib/expense-categories.ts` | The 17 default categories, bilingual |
| `lib/store-money-pg.ts` | Postgres store for expenses/categories/tax profile |
| `lib/store-money-json.ts` | JSON fallback store (local dev) |
| `components/admin/MoneyBoard.tsx` | The money UI |
| `app/contractor-admin/[username]/money/page.tsx` | The money route |
| `app/api/contractor/expenses/route.ts` | GET list / POST create |
| `app/api/contractor/expenses/[id]/route.ts` | PATCH / DELETE (soft) |
| `app/api/contractor/expense-categories/route.ts` | GET / POST categories |
| `app/api/contractor/money-summary/route.ts` | The summary calculation |
| `app/api/contractor/tax-profile/route.ts` | GET / PATCH tax settings |
| `scripts/seed-categories.mjs` | Category seeder |

## Files modified (6) — additive only

| File | Change | Why |
|---|---|---|
| `lib/db/schema.ts` | **appended** 3 tables at end of file | new storage |
| `lib/store.ts` | added 2 imports + 3 exported constants | driver switch, same pattern as yours |
| `lib/store-pg.ts` | added the word `export` to `maybeUploadToBlob` | reuse your blob upload for receipts instead of duplicating it |
| `lib/i18n.ts` | **appended** `MONEY` dictionary + `mt()` at end | ~60 bilingual strings |
| `components/admin/Dashboard.tsx` | added `mt` to the i18n import + one `<a>` link in the scoped header | the Money button |
| `package.json` | added `db:seed:categories` script | seeding |

**Nothing was renamed, moved, refactored, or deleted. No existing function signature changed. No existing database column was altered.**

Your add-ons are untouched and verified still working: `lib/notify.ts` (Twilio SMS), `/pitch`, the `?pin=` demo link, and the estimator's EN/ES toggle.

---

## What it does

**Two buckets, which is the whole point:**
- **Business expense** (no job attached) → a deduction. Gas, meals, tools, insurance, phone.
- **Job material** (attached to a lead) → billable, and it tracks whether you've charged the client yet.

**The summary answers the fear:** income received (pulled from the payments you *already* track — no new income table), business expenses, job materials, net, and a suggested set-aside at a percent the contractor sets himself.

**"Materials not yet billed"** shows up in gold when there's money he may have forgotten to charge a client. That number alone will pay for the product.

**Receipts:** photo capture reuses your existing `compressImage` approach (1200px, 0.72 JPEG) and your existing blob-upload path.

**Fully bilingual**, with the same EN/ES pill as the leads board, and it persists the contractor's choice.

---

## Verified test results

| Test | Result |
|---|---|
| `npm run build` | clean, zero type errors |
| `db:push` | 3 tables created, **nothing altered** |
| 17 categories seeded, bilingual | pass |
| No PIN → expenses API | **401** |
| Contractor A's PIN on contractor B | **401** |
| Overhead expense saved with no `leadId` | pass |
| Job material saved with `leadId` + receipt | pass |
| Summary math: $5,000 − $64.32 − $1,840.55 = **$3,095.13** | exact |
| Set-aside 25% of net = **$773.78** | exact |
| Cent precision: 10.10 + 10.20 + 0.30 = **$20.60** | exact |
| Soft delete: row retained with `deleted_at`, hidden from API | pass |
| Mark billed → unbilled total drops to $0.00 | pass |
| Set-aside % change persists and recalculates | pass |
| Regression: proposal PDF, estimate PDF, invoice PDF, AI summary, `/pitch` | all pass |
| JSON fallback mode (no `DATABASE_URL`) | pass |

---

## Important notes

**Money precision.** All new tables store **integer cents**. Your existing `estimates` columns (`tax_rate`, `discount`, `deposit_percent`) and `line_items` jsonb are floats — **I deliberately left them alone.** Migrating live financial data on a working system with a paying client is a separate, careful job. The new module converts your legacy dollar-based payment amounts to cents only at calculation time.

**The disclaimer is not optional.** The money board always displays, in both languages: *this organizes records and estimates what to set aside — it does not file taxes and is not tax advice; confirm with a licensed tax professional.* Don't remove it. It protects you, and it's honest with the people trusting you.

**Not built (Phase 2/3, on purpose):** 1099 tracking and W-9 storage, year-end export PDF/CSV, pulling job materials into invoices as line items, mileage, receipt OCR, bank import, per-job margin analytics. All still specified — just not shipped in this cut.

**When you deploy:** run `npm run db:push` and `npm run db:seed:categories` against Neon before or right after the deploy, or the money page will error on first load.

---

## If something's wrong

Send me the exact error text and which step it happened on. Don't merge to `main` until you've clicked through it yourself on your own machine.
