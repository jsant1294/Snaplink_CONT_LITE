import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from "pdf-lib";
import { leadStore, estimateStore, contractorStore } from "@/lib/store";
import { authorizeContractorId } from "@/lib/auth";
import { estimateTotals } from "@/lib/types";
import { serviceLabel } from "@/lib/services";
import { UNIT_LABELS, type Unit } from "@/lib/estimate-library";

const GOLD = rgb(0.788, 0.635, 0.294);
const INK = rgb(0.08, 0.08, 0.1);
const GRAY = rgb(0.42, 0.42, 0.46);
const ROWBG = rgb(0.955, 0.945, 0.925);

const STR = {
  en: {
    title: "ESTIMATE",
    preparedFor: "Prepared for",
    projectType: "Project type",
    estimateNo: "Estimate #",
    validFor: "Valid for",
    days: "days",
    description: "Description",
    qty: "Qty",
    unit: "Unit",
    rate: "Rate",
    amount: "Amount",
    subtotal: "Subtotal",
    discount: "Discount",
    tax: "Tax",
    total: "Total",
    deposit: "Deposit due to schedule",
    balance: "Balance due on completion",
    notes: "Notes & exclusions",
    terms: "Terms",
    termsBody:
      "Pricing based on conditions described and photos provided; subject to confirmation at walkthrough. Any hidden damage, code corrections, or client-requested changes will be handled by written change order before additional work begins. Material availability may affect schedule.",
    signature: "Client approval (signature)",
    date: "Date",
    poweredBy: "Powered by SnapLink Contractor",
  },
  es: {
    title: "PRESUPUESTO",
    preparedFor: "Preparado para",
    projectType: "Tipo de proyecto",
    estimateNo: "Presupuesto #",
    validFor: "Válido por",
    days: "días",
    description: "Descripción",
    qty: "Cant.",
    unit: "Unidad",
    rate: "Tarifa",
    amount: "Importe",
    subtotal: "Subtotal",
    discount: "Descuento",
    tax: "Impuesto",
    total: "Total",
    deposit: "Depósito para agendar",
    balance: "Saldo al terminar",
    notes: "Notas y exclusiones",
    terms: "Términos",
    termsBody:
      "Precios basados en las condiciones descritas y las fotos proporcionadas; sujetos a confirmación en la visita. Cualquier daño oculto, corrección de código o cambio solicitado por el cliente se manejará con una orden de cambio por escrito antes de realizar trabajo adicional. La disponibilidad de materiales puede afectar el calendario.",
    signature: "Aprobación del cliente (firma)",
    date: "Fecha",
    poweredBy: "Con tecnología de SnapLink Contractor",
  },
} as const;

function safe(text: string): string {
  return text
    .normalize("NFC")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[^\x00-\xFF]/g, "?");
}

function money(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = safe(text).split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function GET(req: NextRequest) {
  const leadId = req.nextUrl.searchParams.get("leadId") ?? "";
  const lead = await leadStore.get(leadId);
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  const denied = await authorizeContractorId(req, lead.contractorId);
  if (denied) return NextResponse.json({ error: denied }, { status: 401 });
  const estimate = await estimateStore.getByLead(leadId);
  if (!estimate || estimate.lineItems.length === 0) {
    return NextResponse.json(
      { error: "No estimate saved for this lead yet — build one in the estimator first" },
      { status: 404 }
    );
  }
  const contractor = await contractorStore.getById(lead.contractorId);
  const langParam = req.nextUrl.searchParams.get("lang");
  const L = langParam === "es" || langParam === "en" ? langParam : lead.language === "es" ? "es" : "en";
  const S = STR[L];
  const totals = estimateTotals(estimate);

  const pdf = await PDFDocument.create();
  const helv = await pdf.embedFont(StandardFonts.Helvetica);
  const helvBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const times = await pdf.embedFont(StandardFonts.TimesRomanBold);

  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 52;
  const contentWidth = pageWidth - margin * 2;

  let page = pdf.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  function drawFooter(p: PDFPage) {
    p.drawLine({ start: { x: margin, y: 44 }, end: { x: pageWidth - margin, y: 44 }, thickness: 0.5, color: GOLD });
    p.drawText(safe(S.poweredBy), { x: margin, y: 30, size: 8, font: helv, color: GRAY });
  }

  function newPageIfNeeded(needed: number) {
    if (y - needed < margin + 40) {
      drawFooter(page);
      page = pdf.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
  }

  // Column layout for the line-item table
  const col = {
    desc: margin,
    qty: margin + 268,
    unit: margin + 316,
    rate: margin + 380,
    amount: margin + 452,
    end: pageWidth - margin,
  };

  function drawTableHeader() {
    newPageIfNeeded(26);
    page.drawRectangle({ x: margin - 4, y: y - 6, width: contentWidth + 8, height: 20, color: INK });
    const hy = y;
    page.drawText(safe(S.description), { x: col.desc, y: hy, size: 8.5, font: helvBold, color: GOLD });
    page.drawText(safe(S.qty), { x: col.qty, y: hy, size: 8.5, font: helvBold, color: GOLD });
    page.drawText(safe(S.unit), { x: col.unit, y: hy, size: 8.5, font: helvBold, color: GOLD });
    page.drawText(safe(S.rate), { x: col.rate, y: hy, size: 8.5, font: helvBold, color: GOLD });
    page.drawText(safe(S.amount), { x: col.amount, y: hy, size: 8.5, font: helvBold, color: GOLD });
    y -= 24;
  }

  // --- Header band ---
  page.drawRectangle({ x: 0, y: pageHeight - 110, width: pageWidth, height: 110, color: INK });
  page.drawText(safe(contractor?.businessName ?? "Contractor"), {
    x: margin,
    y: pageHeight - 54,
    size: 22,
    font: times,
    color: rgb(0.95, 0.93, 0.9),
  });
  page.drawText(safe(S.title), { x: margin, y: pageHeight - 76, size: 11, font: helvBold, color: GOLD });
  const meta: string[] = [];
  if (contractor?.phone) meta.push(contractor.phone);
  if (contractor?.email) meta.push(contractor.email);
  if (contractor?.licenseInfo) meta.push(contractor.licenseInfo);
  if (meta.length) {
    page.drawText(safe(meta.join("  ·  ")), { x: margin, y: pageHeight - 94, size: 8, font: helv, color: rgb(0.7, 0.7, 0.72) });
  }
  const dateStr = new Date().toLocaleDateString(L === "es" ? "es-MX" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  page.drawText(safe(dateStr), {
    x: pageWidth - margin - helv.widthOfTextAtSize(safe(dateStr), 9),
    y: pageHeight - 76,
    size: 9,
    font: helv,
    color: rgb(0.7, 0.7, 0.72),
  });
  y = pageHeight - 136;

  // --- Client / project block ---
  page.drawText(safe(S.preparedFor.toUpperCase()), { x: margin, y, size: 8.5, font: helvBold, color: GOLD });
  const rightMeta = `${S.estimateNo} ${estimate.id.slice(-8).toUpperCase()}  ·  ${S.validFor} ${estimate.validDays} ${S.days}`;
  page.drawText(safe(rightMeta), {
    x: pageWidth - margin - helv.widthOfTextAtSize(safe(rightMeta), 8.5),
    y,
    size: 8.5,
    font: helv,
    color: GRAY,
  });
  y -= 15;
  page.drawText(safe(lead.clientName), { x: margin, y, size: 12, font: helvBold, color: INK });
  y -= 14;
  if (lead.projectAddress) {
    page.drawText(safe(lead.projectAddress), { x: margin, y, size: 9.5, font: helv, color: GRAY });
    y -= 13;
  }
  page.drawText(safe(`${S.projectType}: ${serviceLabel(lead.projectType, L)}`), {
    x: margin,
    y,
    size: 9.5,
    font: helv,
    color: INK,
  });
  y -= 22;

  // --- Line items ---
  drawTableHeader();
  estimate.lineItems.forEach((li, idx) => {
    const desc = L === "es" && li.descriptionEs ? li.descriptionEs : li.description;
    const descLines = wrap(desc, helv, 9, col.qty - col.desc - 10);
    const rowHeight = Math.max(1, descLines.length) * 12 + 6;
    newPageIfNeeded(rowHeight + 4);
    if (idx % 2 === 0) {
      page.drawRectangle({ x: margin - 4, y: y - rowHeight + 10, width: contentWidth + 8, height: rowHeight, color: ROWBG });
    }
    const unitDef = UNIT_LABELS[li.unit as Unit];
    const unitText = unitDef ? unitDef[L] : li.unit;
    descLines.forEach((line, i) => {
      page.drawText(line, { x: col.desc, y: y - i * 12, size: 9, font: helv, color: INK });
    });
    const qtyText = String(li.qty % 1 === 0 ? li.qty : li.qty.toFixed(2));
    page.drawText(qtyText, { x: col.qty, y, size: 9, font: helv, color: INK });
    page.drawText(safe(unitText), { x: col.unit, y, size: 9, font: helv, color: INK });
    page.drawText(money(li.unitPrice), { x: col.rate, y, size: 9, font: helv, color: INK });
    const amt = money(li.qty * li.unitPrice);
    page.drawText(amt, { x: col.end - helv.widthOfTextAtSize(amt, 9), y, size: 9, font: helv, color: INK });
    y -= rowHeight;
  });
  y -= 6;

  // --- Totals block ---
  function totalRow(label: string, value: string, opts?: { bold?: boolean; gold?: boolean; size?: number }) {
    newPageIfNeeded(18);
    const size = opts?.size ?? 9.5;
    const font = opts?.bold ? helvBold : helv;
    const color = opts?.gold ? GOLD : INK;
    const lx = col.rate - 60;
    page.drawText(safe(label), { x: lx, y, size, font, color: opts?.gold ? GOLD : GRAY });
    page.drawText(value, { x: col.end - font.widthOfTextAtSize(value, size), y, size, font, color });
    y -= size + 7;
  }

  page.drawLine({ start: { x: col.rate - 60, y: y + 6 }, end: { x: col.end, y: y + 6 }, thickness: 0.5, color: GRAY });
  y -= 4;
  totalRow(S.subtotal, money(totals.subtotal));
  if (estimate.discount > 0) totalRow(S.discount, `-${money(estimate.discount)}`);
  if (estimate.taxRate > 0) totalRow(`${S.tax} (${estimate.taxRate}%)`, money(totals.tax));
  totalRow(S.total, money(totals.total), { bold: true, size: 12 });
  if (estimate.depositPercent > 0) {
    totalRow(`${S.deposit} (${estimate.depositPercent}%)`, money(totals.deposit), { gold: true, bold: true });
    totalRow(S.balance, money(totals.balance));
  }
  y -= 8;

  // --- Notes ---
  if (estimate.notes.trim()) {
    newPageIfNeeded(40);
    page.drawText(safe(S.notes.toUpperCase()), { x: margin, y, size: 8.5, font: helvBold, color: GOLD });
    y -= 14;
    for (const line of wrap(estimate.notes, helv, 9, contentWidth)) {
      newPageIfNeeded(14);
      page.drawText(line, { x: margin, y, size: 9, font: helv, color: INK });
      y -= 12;
    }
    y -= 8;
  }

  // --- Terms ---
  newPageIfNeeded(70);
  page.drawText(safe(S.terms.toUpperCase()), { x: margin, y, size: 8.5, font: helvBold, color: GOLD });
  y -= 13;
  for (const line of wrap(S.termsBody, helv, 8, contentWidth)) {
    newPageIfNeeded(12);
    page.drawText(line, { x: margin, y, size: 8, font: helv, color: GRAY });
    y -= 10.5;
  }

  // --- Signature ---
  newPageIfNeeded(80);
  y -= 26;
  page.drawLine({ start: { x: margin, y }, end: { x: margin + 220, y }, thickness: 0.75, color: INK });
  page.drawLine({ start: { x: margin + 260, y }, end: { x: margin + 380, y }, thickness: 0.75, color: INK });
  y -= 12;
  page.drawText(safe(S.signature), { x: margin, y, size: 8.5, font: helv, color: GRAY });
  page.drawText(safe(S.date), { x: margin + 260, y, size: 8.5, font: helv, color: GRAY });

  drawFooter(page);

  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="estimate-${lead.clientName.replace(/\s+/g, "-").toLowerCase()}.pdf"`,
    },
  });
}
