import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from "pdf-lib";
import {
  contractorStore,
  leadStore,
  expenseStore,
  categoryStore,
  payeeStore,
  form1099Store,
  setAsideStore,
  taxProfileStore,
} from "@/lib/store";
import { authorizeContractorId } from "@/lib/auth";
import { toCents } from "@/lib/money";
import { buildQuarterlyView } from "@/lib/quarterly";

// ---------------------------------------------------------------------------
// Year-end record-keeping summary — the "hand this to your accountant" document.
//
// This is the ONE surface where Schedule C line references appear, because the
// reader is a tax professional. It is a summary of RECORDS. It does not compute
// tax owed, it is not a return, and it is not tax advice.
// ---------------------------------------------------------------------------

const GOLD = rgb(0.788, 0.635, 0.294);
const INK = rgb(0.08, 0.08, 0.1);
const GRAY = rgb(0.42, 0.42, 0.46);
const ROWBG = rgb(0.955, 0.945, 0.925);
const WARN = rgb(0.72, 0.45, 0.16);

const S = {
  en: {
    title: "YEAR-END RECORD SUMMARY",
    forYear: "Tax year",
    preparedFor: "Business",
    entity: "Business type",
    prepared: "Prepared",
    disclaimerTitle: "About this document",
    disclaimer:
      "This is a summary of records kept by the business owner in SnapLink Contractor. It is not a tax return, does not compute tax owed, and is not tax advice. Schedule C line references are provided for convenience only and should be verified. Amounts are self-reported by the owner.",
    incomeSection: "Income recorded",
    incomeNote: "Client payments recorded in the app during the year.",
    totalIncome: "Total income recorded",
    expenseSection: "Expenses by category",
    category: "Category",
    schedC: "Sched C",
    count: "Items",
    amount: "Amount",
    totalExpenses: "Total expenses",
    splitSection: "Expense split",
    overhead: "Business overhead (deductible)",
    jobMaterials: "Job materials (billable to clients)",
    unbilled: "Job materials not marked billed",
    netSection: "Net",
    net: "Income less expenses",
    quarterSection: "By quarter",
    quarter: "Quarter",
    period: "Period",
    income: "Income",
    expenses: "Expenses",
    netCol: "Net",
    setAside: "Set aside",
    payeeSection: "Contractors paid (1099 review)",
    payeeNote: "Payees at or above the owner's alert threshold. Verify filing requirements with your accountant.",
    payeeName: "Payee",
    type: "Type",
    tin: "TIN",
    w9: "W-9",
    paid: "Paid",
    onFile: "on file",
    missing: "MISSING",
    noPayees: "No payees recorded above the threshold.",
    forms1099Section: "1099s received",
    issuer: "Issuer",
    formType: "Form",
    recon: "Recorded income less 1099 total",
    reconNote: "A difference here should be explained before filing.",
    no1099s: "No 1099s recorded.",
    receiptsSection: "Receipt documentation",
    receiptsNote: "expense records have a receipt image attached and are available on request.",
    ofTotal: "of",
    poweredBy: "Powered by SnapLink Contractor · Lucio Financial Copilot",
    page: "Page",
  },
  es: {
    title: "RESUMEN DE REGISTROS DE FIN DE AÑO",
    forYear: "Año fiscal",
    preparedFor: "Negocio",
    entity: "Tipo de negocio",
    prepared: "Preparado",
    disclaimerTitle: "Sobre este documento",
    disclaimer:
      "Este es un resumen de los registros que el dueño del negocio mantuvo en SnapLink Contractor. No es una declaración de impuestos, no calcula impuestos a pagar y no es asesoría fiscal. Las referencias al Schedule C se incluyen solo por conveniencia y deben verificarse. Los montos son reportados por el dueño.",
    incomeSection: "Ingreso registrado",
    incomeNote: "Pagos de clientes registrados en la aplicación durante el año.",
    totalIncome: "Ingreso total registrado",
    expenseSection: "Gastos por categoría",
    category: "Categoría",
    schedC: "Sched C",
    count: "Partidas",
    amount: "Monto",
    totalExpenses: "Gastos totales",
    splitSection: "División de gastos",
    overhead: "Gastos del negocio (deducibles)",
    jobMaterials: "Materiales de trabajos (cobrables al cliente)",
    unbilled: "Materiales sin marcar como cobrados",
    netSection: "Neto",
    net: "Ingreso menos gastos",
    quarterSection: "Por trimestre",
    quarter: "Trimestre",
    period: "Periodo",
    income: "Ingreso",
    expenses: "Gastos",
    netCol: "Neto",
    setAside: "Apartado",
    payeeSection: "Contratistas pagados (revisión 1099)",
    payeeNote: "Beneficiarios en o arriba del umbral definido por el dueño. Verifique los requisitos con su contador.",
    payeeName: "Beneficiario",
    type: "Tipo",
    tin: "ID",
    w9: "W-9",
    paid: "Pagado",
    onFile: "en archivo",
    missing: "FALTA",
    noPayees: "No hay beneficiarios registrados arriba del umbral.",
    forms1099Section: "1099 recibidos",
    issuer: "Emisor",
    formType: "Forma",
    recon: "Ingreso registrado menos total de 1099",
    reconNote: "Una diferencia aquí debe explicarse antes de declarar.",
    no1099s: "No hay 1099 registrados.",
    receiptsSection: "Documentación de recibos",
    receiptsNote: "registros de gastos tienen imagen de recibo adjunta y están disponibles a solicitud.",
    ofTotal: "de",
    poweredBy: "Con tecnología de SnapLink Contractor · Lucio Financial Copilot",
    page: "Página",
  },
} as const;

const ENTITY_LABEL: Record<string, { en: string; es: string }> = {
  sole_prop: { en: "Sole proprietor", es: "Propietario único" },
  llc_single: { en: "LLC — single owner", es: "LLC — un solo dueño" },
  llc_multi: { en: "LLC — multiple owners", es: "LLC — varios dueños" },
  s_corp: { en: "S-Corp", es: "S-Corp" },
};

function safe(t: string): string {
  return t
    .normalize("NFC")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[^\x00-\xFF]/g, "?");
}

function money(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function wrap(text: string, font: PDFFont, size: number, maxW: number): string[] {
  const words = safe(text).split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(t, size) > maxW && line) {
      lines.push(line);
      line = w;
    } else line = t;
  }
  if (line) lines.push(line);
  return lines;
}

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("contractor") ?? "";
  const contractor = await contractorStore.getByUsername(username);
  if (!contractor) return NextResponse.json({ error: "Contractor not found" }, { status: 404 });
  const denied = await authorizeContractorId(req, contractor.id);
  if (denied) return NextResponse.json({ error: denied }, { status: 401 });

  const taxYear = Number(req.nextUrl.searchParams.get("year")) || new Date().getFullYear();
  const langParam = req.nextUrl.searchParams.get("lang");
  const L = langParam === "es" ? "es" : "en";
  const T = S[L];

  const [leads, expenses, categories, payeeList, forms, setAsides, profile] = await Promise.all([
    leadStore.list(contractor.username),
    expenseStore.list(contractor.id, { year: taxYear }),
    categoryStore.list(contractor.id),
    payeeStore.list(contractor.id),
    form1099Store.list(contractor.id, taxYear),
    setAsideStore.list(contractor.id, taxYear),
    taxProfileStore.get(contractor.id),
  ]);

  const setAsidePercent = profile?.setAsidePercent ?? 25;
  const threshold = profile?.payeeAlertThresholdCents ?? 60000;

  // Income from recorded lead payments (legacy values are dollars).
  let incomeCents = 0;
  for (const lead of leads) {
    for (const p of lead.payments ?? []) {
      if (String(p.receivedAt ?? "").startsWith(`${taxYear}`)) incomeCents += toCents(p.amount);
    }
  }

  // Expense rollups
  let overheadCents = 0;
  let materialsCents = 0;
  let unbilledCents = 0;
  let withReceipts = 0;
  const catTotals = new Map<string, { count: number; cents: number }>();
  for (const e of expenses) {
    if (e.leadId) {
      materialsCents += e.amountCents;
      if (!e.billedToClient) unbilledCents += e.amountCents;
    } else {
      overheadCents += e.amountCents;
    }
    if (e.receiptUrl) withReceipts++;
    const prev = catTotals.get(e.categoryId) ?? { count: 0, cents: 0 };
    catTotals.set(e.categoryId, { count: prev.count + 1, cents: prev.cents + e.amountCents });
  }
  const totalExpenseCents = overheadCents + materialsCents;

  const catRows = [...catTotals.entries()]
    .map(([id, v]) => {
      const c = categories.find((x) => x.id === id);
      return {
        label: c ? (L === "es" ? c.labelEs : c.labelEn) : "Unknown",
        schedC: c?.scheduleCLine ?? "—",
        count: v.count,
        cents: v.cents,
      };
    })
    .sort((a, b) => b.cents - a.cents);

  const quarterly = buildQuarterlyView({
    taxYear,
    setAsidePercent,
    leads,
    expenses,
    setAsides,
    lang: L,
  });

  const payeeRows = payeeList
    .map((p) => ({
      ...p,
      paidCents: expenses.filter((e) => e.payeeId === p.id).reduce((s, e) => s + e.amountCents, 0),
    }))
    .filter((p) => p.paidCents >= threshold)
    .sort((a, b) => b.paidCents - a.paidCents);

  const forms1099Total = forms.reduce((s, f) => s + f.amountCents, 0);

  // --- Document ---
  const pdf = await PDFDocument.create();
  const helv = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const times = await pdf.embedFont(StandardFonts.TimesRomanBold);

  const pw = 612;
  const ph = 792;
  const margin = 52;
  const cw = pw - margin * 2;
  let page = pdf.addPage([pw, ph]);
  let y = ph - margin;
  let pageNo = 1;

  function footer(p: PDFPage, n: number) {
    p.drawLine({ start: { x: margin, y: 44 }, end: { x: pw - margin, y: 44 }, thickness: 0.5, color: GOLD });
    p.drawText(safe(T.poweredBy), { x: margin, y: 30, size: 7.5, font: helv, color: GRAY });
    const label = `${T.page} ${n}`;
    p.drawText(safe(label), { x: pw - margin - helv.widthOfTextAtSize(safe(label), 7.5), y: 30, size: 7.5, font: helv, color: GRAY });
  }

  function need(h: number) {
    if (y - h < margin + 40) {
      footer(page, pageNo);
      page = pdf.addPage([pw, ph]);
      pageNo++;
      y = ph - margin;
    }
  }

  function heading(text: string) {
    need(34);
    y -= 8;
    page.drawText(safe(text.toUpperCase()), { x: margin, y, size: 9, font: bold, color: GOLD });
    y -= 5;
    page.drawLine({ start: { x: margin, y }, end: { x: margin + 44, y }, thickness: 1, color: GOLD });
    y -= 15;
  }

  function note(text: string) {
    for (const ln of wrap(text, helv, 8, cw)) {
      need(11);
      page.drawText(ln, { x: margin, y, size: 8, font: helv, color: GRAY });
      y -= 10;
    }
    y -= 3;
  }

  function kv(label: string, value: string, opts?: { bold?: boolean; color?: ReturnType<typeof rgb>; size?: number }) {
    need(16);
    const size = opts?.size ?? 10;
    const f = opts?.bold ? bold : helv;
    page.drawText(safe(label), { x: margin, y, size, font: f, color: opts?.color ?? GRAY });
    page.drawText(money(0).replace(/.*/, value), {
      x: pw - margin - f.widthOfTextAtSize(value, size),
      y,
      size,
      font: f,
      color: opts?.color ?? INK,
    });
    y -= size + 6;
  }

  // Header band
  page.drawRectangle({ x: 0, y: ph - 104, width: pw, height: 104, color: INK });
  page.drawText(safe(contractor.businessName), { x: margin, y: ph - 50, size: 20, font: times, color: rgb(0.95, 0.93, 0.9) });
  page.drawText(safe(T.title), { x: margin, y: ph - 70, size: 10, font: bold, color: GOLD });
  const meta = [`${T.forYear}: ${taxYear}`];
  if (profile?.entityType && ENTITY_LABEL[profile.entityType]) {
    meta.push(`${T.entity}: ${ENTITY_LABEL[profile.entityType][L]}`);
  }
  if (profile?.businessLegalName) meta.push(profile.businessLegalName);
  page.drawText(safe(meta.join("  ·  ")), { x: margin, y: ph - 88, size: 8, font: helv, color: rgb(0.7, 0.7, 0.72) });
  const dateStr = new Date().toLocaleDateString(L === "es" ? "es-MX" : "en-US", { year: "numeric", month: "long", day: "numeric" });
  page.drawText(safe(`${T.prepared}: ${dateStr}`), {
    x: pw - margin - helv.widthOfTextAtSize(safe(`${T.prepared}: ${dateStr}`), 8),
    y: ph - 70,
    size: 8,
    font: helv,
    color: rgb(0.7, 0.7, 0.72),
  });
  y = ph - 128;

  // Disclaimer
  heading(T.disclaimerTitle);
  note(T.disclaimer);

  // Income
  heading(T.incomeSection);
  note(T.incomeNote);
  kv(T.totalIncome, money(incomeCents), { bold: true, size: 11, color: INK });

  // Expenses by category
  heading(T.expenseSection);
  need(20);
  page.drawRectangle({ x: margin - 4, y: y - 5, width: cw + 8, height: 18, color: INK });
  page.drawText(safe(T.category), { x: margin, y, size: 8, font: bold, color: GOLD });
  page.drawText(safe(T.schedC), { x: margin + 300, y, size: 8, font: bold, color: GOLD });
  page.drawText(safe(T.count), { x: margin + 360, y, size: 8, font: bold, color: GOLD });
  page.drawText(safe(T.amount), { x: margin + 430, y, size: 8, font: bold, color: GOLD });
  y -= 20;

  catRows.forEach((r, i) => {
    need(15);
    if (i % 2 === 0) page.drawRectangle({ x: margin - 4, y: y - 4, width: cw + 8, height: 15, color: ROWBG });
    page.drawText(safe(r.label.slice(0, 46)), { x: margin, y, size: 9, font: helv, color: INK });
    page.drawText(safe(r.schedC), { x: margin + 300, y, size: 9, font: helv, color: GRAY });
    page.drawText(String(r.count), { x: margin + 360, y, size: 9, font: helv, color: GRAY });
    const amt = money(r.cents);
    page.drawText(amt, { x: pw - margin - helv.widthOfTextAtSize(amt, 9), y, size: 9, font: helv, color: INK });
    y -= 15;
  });
  if (catRows.length === 0) note("—");
  y -= 4;
  kv(T.totalExpenses, money(totalExpenseCents), { bold: true, size: 11, color: INK });

  // Split
  heading(T.splitSection);
  kv(T.overhead, money(overheadCents));
  kv(T.jobMaterials, money(materialsCents));
  if (unbilledCents > 0) kv(T.unbilled, money(unbilledCents), { color: WARN });

  // Net
  heading(T.netSection);
  kv(T.net, money(incomeCents - totalExpenseCents), { bold: true, size: 12, color: INK });

  // Quarters
  heading(T.quarterSection);
  need(20);
  page.drawRectangle({ x: margin - 4, y: y - 5, width: cw + 8, height: 18, color: INK });
  page.drawText(safe(T.quarter), { x: margin, y, size: 8, font: bold, color: GOLD });
  page.drawText(safe(T.period), { x: margin + 60, y, size: 8, font: bold, color: GOLD });
  page.drawText(safe(T.income), { x: margin + 160, y, size: 8, font: bold, color: GOLD });
  page.drawText(safe(T.expenses), { x: margin + 250, y, size: 8, font: bold, color: GOLD });
  page.drawText(safe(T.netCol), { x: margin + 340, y, size: 8, font: bold, color: GOLD });
  page.drawText(safe(T.setAside), { x: margin + 430, y, size: 8, font: bold, color: GOLD });
  y -= 20;
  quarterly.quarters.forEach((q, i) => {
    need(15);
    if (i % 2 === 0) page.drawRectangle({ x: margin - 4, y: y - 4, width: cw + 8, height: 15, color: ROWBG });
    page.drawText(`Q${q.quarter}`, { x: margin, y, size: 9, font: helv, color: INK });
    page.drawText(safe(q.periodLabel), { x: margin + 60, y, size: 9, font: helv, color: GRAY });
    page.drawText(money(q.incomeCents), { x: margin + 160, y, size: 9, font: helv, color: INK });
    page.drawText(money(q.expenseCents), { x: margin + 250, y, size: 9, font: helv, color: INK });
    page.drawText(money(q.netCents), { x: margin + 340, y, size: 9, font: helv, color: INK });
    page.drawText(money(q.setAsideCents), { x: margin + 430, y, size: 9, font: helv, color: INK });
    y -= 15;
  });

  // Payees
  heading(T.payeeSection);
  note(T.payeeNote);
  if (payeeRows.length === 0) {
    note(T.noPayees);
  } else {
    need(20);
    page.drawRectangle({ x: margin - 4, y: y - 5, width: cw + 8, height: 18, color: INK });
    page.drawText(safe(T.payeeName), { x: margin, y, size: 8, font: bold, color: GOLD });
    page.drawText(safe(T.tin), { x: margin + 220, y, size: 8, font: bold, color: GOLD });
    page.drawText(safe(T.w9), { x: margin + 300, y, size: 8, font: bold, color: GOLD });
    page.drawText(safe(T.paid), { x: margin + 430, y, size: 8, font: bold, color: GOLD });
    y -= 20;
    payeeRows.forEach((p, i) => {
      need(15);
      if (i % 2 === 0) page.drawRectangle({ x: margin - 4, y: y - 4, width: cw + 8, height: 15, color: ROWBG });
      page.drawText(safe(p.name.slice(0, 34)), { x: margin, y, size: 9, font: helv, color: INK });
      const tin = p.tinLast4 ? `${p.tinType.toUpperCase()} ···${p.tinLast4}` : "—";
      page.drawText(safe(tin), { x: margin + 220, y, size: 8.5, font: helv, color: GRAY });
      page.drawText(safe(p.w9OnFile ? T.onFile : T.missing), {
        x: margin + 300,
        y,
        size: 8.5,
        font: p.w9OnFile ? helv : bold,
        color: p.w9OnFile ? GRAY : WARN,
      });
      const amt = money(p.paidCents);
      page.drawText(amt, { x: pw - margin - helv.widthOfTextAtSize(amt, 9), y, size: 9, font: helv, color: INK });
      y -= 15;
    });
  }

  // 1099s received
  heading(T.forms1099Section);
  if (forms.length === 0) {
    note(T.no1099s);
  } else {
    forms.forEach((f) => {
      need(15);
      page.drawText(safe(`${f.issuerName.slice(0, 40)} · ${f.formType}`), { x: margin, y, size: 9, font: helv, color: INK });
      const amt = money(f.amountCents);
      page.drawText(amt, { x: pw - margin - helv.widthOfTextAtSize(amt, 9), y, size: 9, font: helv, color: INK });
      y -= 14;
    });
    y -= 4;
    const diff = incomeCents - forms1099Total;
    kv(T.recon, money(diff), { bold: true, color: Math.abs(diff) > 100 ? WARN : INK });
    note(T.reconNote);
  }

  // Receipts
  heading(T.receiptsSection);
  note(`${withReceipts} ${T.ofTotal} ${expenses.length} ${T.receiptsNote}`);

  footer(page, pageNo);
  const bytes = await pdf.save();
  const slug = contractor.businessName.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase();
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="year-end-${taxYear}-${slug}.pdf"`,
    },
  });
}
