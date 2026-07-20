import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from "pdf-lib";
import QRCode from "qrcode";
import { leadStore, estimateStore, contractorStore } from "@/lib/store";
import { estimateTotals, totalPaid } from "@/lib/types";
import { serviceLabel } from "@/lib/services";
import { UNIT_LABELS, type Unit } from "@/lib/estimate-library";
import { payOptions, primaryQrUrl } from "@/lib/payments";
import { authorizeContractorId } from "@/lib/auth";

const GOLD = rgb(0.788, 0.635, 0.294);
const INK = rgb(0.08, 0.08, 0.1);
const GRAY = rgb(0.42, 0.42, 0.46);
const ROWBG = rgb(0.955, 0.945, 0.925);
const GREEN = rgb(0.24, 0.6, 0.43);

const S = {
  en: {
    title: "INVOICE", billTo: "Bill to", invoiceNo: "Invoice #", date: "Date",
    projectType: "Project type", description: "Description", qty: "Qty", unit: "Unit",
    rate: "Rate", amount: "Amount", subtotal: "Subtotal", discount: "Discount", tax: "Tax",
    total: "Total", depositDue: "Deposit due", balanceDue: "Balance due", paidToDate: "Paid to date",
    howToPay: "How to pay", scanToPay: "Scan to pay", notes: "Notes",
    paid: "PAID IN FULL", partial: "PARTIALLY PAID", makeCheck: "Make checks payable to",
    thanks: "Thank you for your business.", poweredBy: "Powered by SnapLink Contractor",
  },
  es: {
    title: "FACTURA", billTo: "Facturar a", invoiceNo: "Factura #", date: "Fecha",
    projectType: "Tipo de proyecto", description: "Descripción", qty: "Cant.", unit: "Unidad",
    rate: "Tarifa", amount: "Importe", subtotal: "Subtotal", discount: "Descuento", tax: "Impuesto",
    total: "Total", depositDue: "Depósito requerido", balanceDue: "Saldo pendiente", paidToDate: "Pagado a la fecha",
    howToPay: "Cómo pagar", scanToPay: "Escanea para pagar", notes: "Notas",
    paid: "PAGADO EN TOTAL", partial: "PAGO PARCIAL", makeCheck: "Cheques a nombre de",
    thanks: "Gracias por su preferencia.", poweredBy: "Con tecnología de SnapLink Contractor",
  },
} as const;

function safe(t: string): string {
  return t.normalize("NFC").replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/[\u2013\u2014]/g, "-").replace(/[^\x00-\xFF]/g, "?");
}
function money(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}
function wrap(text: string, font: PDFFont, size: number, maxW: number): string[] {
  const words = safe(text).split(/\s+/); const lines: string[] = []; let line = "";
  for (const w of words) { const t = line ? `${line} ${w}` : w; if (font.widthOfTextAtSize(t, size) > maxW && line) { lines.push(line); line = w; } else line = t; }
  if (line) lines.push(line); return lines;
}

export async function GET(req: NextRequest) {
  const leadId = req.nextUrl.searchParams.get("leadId") ?? "";
  const lead = await leadStore.get(leadId);
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  const denied = await authorizeContractorId(req, lead.contractorId);
  if (denied) return NextResponse.json({ error: denied }, { status: 401 });

  const estimate = await estimateStore.getByLead(leadId);
  if (!estimate || estimate.lineItems.length === 0) {
    return NextResponse.json({ error: "Build an estimate first — the invoice uses those line items" }, { status: 404 });
  }
  const contractor = await contractorStore.getById(lead.contractorId);
  const langParam = req.nextUrl.searchParams.get("lang");
  const L = langParam === "es" || langParam === "en" ? langParam : lead.language === "es" ? "es" : "en";
  const T = S[L];
  const totals = estimateTotals(estimate);
  const paid = totalPaid(lead);
  const balance = Math.max(0, totals.total - paid);
  const isPaid = paid >= totals.total - 0.005;

  const pdf = await PDFDocument.create();
  const helv = await pdf.embedFont(StandardFonts.Helvetica);
  const helvBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const times = await pdf.embedFont(StandardFonts.TimesRomanBold);

  const pw = 612, ph = 792, margin = 52, cw = pw - margin * 2;
  let page = pdf.addPage([pw, ph]); let y = ph - margin;

  function footer(p: PDFPage) {
    p.drawLine({ start: { x: margin, y: 44 }, end: { x: pw - margin, y: 44 }, thickness: 0.5, color: GOLD });
    p.drawText(safe(T.poweredBy), { x: margin, y: 30, size: 8, font: helv, color: GRAY });
  }
  function need(n: number) { if (y - n < margin + 40) { footer(page); page = pdf.addPage([pw, ph]); y = ph - margin; } }

  const col = { desc: margin, qty: margin + 268, unit: margin + 316, rate: margin + 380, amount: margin + 452, end: pw - margin };

  // Header band
  page.drawRectangle({ x: 0, y: ph - 110, width: pw, height: 110, color: INK });
  page.drawText(safe(contractor?.businessName ?? "Contractor"), { x: margin, y: ph - 54, size: 22, font: times, color: rgb(0.95, 0.93, 0.9) });
  page.drawText(safe(T.title), { x: margin, y: ph - 76, size: 11, font: helvBold, color: GOLD });
  const meta: string[] = [];
  if (contractor?.phone) meta.push(contractor.phone);
  if (contractor?.email) meta.push(contractor.email);
  if (meta.length) page.drawText(safe(meta.join("  ·  ")), { x: margin, y: ph - 94, size: 8, font: helv, color: rgb(0.7, 0.7, 0.72) });
  const dateStr = new Date().toLocaleDateString(L === "es" ? "es-MX" : "en-US", { year: "numeric", month: "long", day: "numeric" });
  page.drawText(safe(dateStr), { x: pw - margin - helv.widthOfTextAtSize(safe(dateStr), 9), y: ph - 76, size: 9, font: helv, color: rgb(0.7, 0.7, 0.72) });

  // Paid stamp
  if (isPaid || paid > 0) {
    const label = isPaid ? T.paid : T.partial;
    const c = isPaid ? GREEN : GOLD;
    const tw = helvBold.widthOfTextAtSize(label, 13);
    page.drawRectangle({ x: pw - margin - tw - 20, y: ph - 46, width: tw + 20, height: 22, borderColor: c, borderWidth: 1.5, color: rgb(1, 1, 1) });
    page.drawText(safe(label), { x: pw - margin - tw - 10, y: ph - 40, size: 13, font: helvBold, color: c });
  }
  y = ph - 136;

  // Bill to
  page.drawText(safe(T.billTo.toUpperCase()), { x: margin, y, size: 8.5, font: helvBold, color: GOLD });
  const rmeta = `${T.invoiceNo} ${(estimate.id.slice(-8)).toUpperCase()}`;
  page.drawText(safe(rmeta), { x: pw - margin - helv.widthOfTextAtSize(safe(rmeta), 8.5), y, size: 8.5, font: helv, color: GRAY });
  y -= 15;
  page.drawText(safe(lead.clientName), { x: margin, y, size: 12, font: helvBold, color: INK }); y -= 14;
  if (lead.projectAddress) { page.drawText(safe(lead.projectAddress), { x: margin, y, size: 9.5, font: helv, color: GRAY }); y -= 13; }
  page.drawText(safe(`${T.projectType}: ${serviceLabel(lead.projectType, L)}`), { x: margin, y, size: 9.5, font: helv, color: INK });
  y -= 22;

  // Table header
  need(26);
  page.drawRectangle({ x: margin - 4, y: y - 6, width: cw + 8, height: 20, color: INK });
  page.drawText(safe(T.description), { x: col.desc, y, size: 8.5, font: helvBold, color: GOLD });
  page.drawText(safe(T.qty), { x: col.qty, y, size: 8.5, font: helvBold, color: GOLD });
  page.drawText(safe(T.unit), { x: col.unit, y, size: 8.5, font: helvBold, color: GOLD });
  page.drawText(safe(T.rate), { x: col.rate, y, size: 8.5, font: helvBold, color: GOLD });
  page.drawText(safe(T.amount), { x: col.amount, y, size: 8.5, font: helvBold, color: GOLD });
  y -= 24;

  estimate.lineItems.forEach((li, idx) => {
    const desc = L === "es" && li.descriptionEs ? li.descriptionEs : li.description;
    const dl = wrap(desc, helv, 9, col.qty - col.desc - 10);
    const rh = Math.max(1, dl.length) * 12 + 6; need(rh + 4);
    if (idx % 2 === 0) page.drawRectangle({ x: margin - 4, y: y - rh + 10, width: cw + 8, height: rh, color: ROWBG });
    const ud = UNIT_LABELS[li.unit as Unit]; const ut = ud ? ud[L] : li.unit;
    dl.forEach((ln, i) => page.drawText(ln, { x: col.desc, y: y - i * 12, size: 9, font: helv, color: INK }));
    page.drawText(String(li.qty % 1 === 0 ? li.qty : li.qty.toFixed(2)), { x: col.qty, y, size: 9, font: helv, color: INK });
    page.drawText(safe(ut), { x: col.unit, y, size: 9, font: helv, color: INK });
    page.drawText(money(li.unitPrice), { x: col.rate, y, size: 9, font: helv, color: INK });
    const amt = money(li.qty * li.unitPrice);
    page.drawText(amt, { x: col.end - helv.widthOfTextAtSize(amt, 9), y, size: 9, font: helv, color: INK });
    y -= rh;
  });
  y -= 6;

  function row(label: string, value: string, o?: { bold?: boolean; color?: ReturnType<typeof rgb>; size?: number }) {
    need(18); const size = o?.size ?? 9.5; const font = o?.bold ? helvBold : helv;
    const lx = col.rate - 60;
    page.drawText(safe(label), { x: lx, y, size, font, color: o?.color ?? GRAY });
    page.drawText(value, { x: col.end - font.widthOfTextAtSize(value, size), y, size, font, color: o?.color ?? INK });
    y -= size + 7;
  }
  page.drawLine({ start: { x: col.rate - 60, y: y + 6 }, end: { x: col.end, y: y + 6 }, thickness: 0.5, color: GRAY }); y -= 4;
  row(T.subtotal, money(totals.subtotal));
  if (estimate.discount > 0) row(T.discount, `-${money(estimate.discount)}`);
  if (estimate.taxRate > 0) row(`${T.tax} (${estimate.taxRate}%)`, money(totals.tax));
  row(T.total, money(totals.total), { bold: true, size: 12 });
  if (paid > 0) row(T.paidToDate, `-${money(paid)}`, { color: GREEN });
  if (estimate.depositPercent > 0 && paid <= 0) row(`${T.depositDue} (${estimate.depositPercent}%)`, money(totals.deposit), { bold: true, color: GOLD });
  row(T.balanceDue, money(balance), { bold: true, size: 13, color: isPaid ? GREEN : INK });
  y -= 12;

  // How to pay + QR
  const opts = payOptions(contractor?.payments, { amount: balance > 0 ? balance : undefined });
  if (opts.length && !isPaid) {
    need(120);
    const boxTop = y;
    const qrUrl = primaryQrUrl(contractor?.payments, balance > 0 ? balance : undefined);
    page.drawText(safe(T.howToPay.toUpperCase()), { x: margin, y, size: 9, font: helvBold, color: GOLD });
    y -= 16;
    for (const o of opts) {
      need(14);
      page.drawText(safe(`${o.label}:`), { x: margin, y, size: 9.5, font: helvBold, color: INK });
      page.drawText(safe(o.handle), { x: margin + 92, y, size: 9.5, font: helv, color: GRAY });
      y -= 14;
    }
    // QR on the right
    if (qrUrl) {
      try {
        const qrPng = await QRCode.toBuffer(qrUrl, { type: "png", width: 240, margin: 1, color: { dark: "#0A0A0A", light: "#FFFFFFFF" } });
        const img = await pdf.embedPng(qrPng);
        const size = 88; const qx = pw - margin - size; const qy = boxTop - size + 6;
        page.drawImage(img, { x: qx, y: qy, width: size, height: size });
        page.drawText(safe(T.scanToPay), { x: qx + size / 2 - helv.widthOfTextAtSize(safe(T.scanToPay), 8) / 2, y: qy - 12, size: 8, font: helv, color: GRAY });
      } catch { /* QR optional */ }
    }
    y -= 10;
  }

  if (estimate.notes.trim()) {
    need(30);
    page.drawText(safe(T.notes.toUpperCase()), { x: margin, y, size: 8.5, font: helvBold, color: GOLD }); y -= 13;
    for (const ln of wrap(estimate.notes, helv, 9, cw)) { need(13); page.drawText(ln, { x: margin, y, size: 9, font: helv, color: INK }); y -= 12; }
  }

  need(30); y -= 8;
  page.drawText(safe(T.thanks), { x: margin, y, size: 10, font: times, color: INK });

  footer(page);
  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="invoice-${lead.clientName.replace(/\s+/g, "-").toLowerCase()}.pdf"`,
    },
  });
}
