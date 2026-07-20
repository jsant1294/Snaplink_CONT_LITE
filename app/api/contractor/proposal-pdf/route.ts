import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from "pdf-lib";
import { leadStore } from "@/lib/store";
import { contractorStore } from "@/lib/store";
import { authorizeContractorId } from "@/lib/auth";
import { serviceLabel } from "@/lib/services";

const GOLD = rgb(0.788, 0.635, 0.294);
const INK = rgb(0.08, 0.08, 0.1);
const GRAY = rgb(0.42, 0.42, 0.46);

// Client-facing document — rendered in the client's language.
const PDF_STRINGS = {
  en: {
    projectProposal: "PROJECT PROPOSAL",
    preparedFor: "Prepared for",
    projectType: "Project type",
    timeline: "Timeline",
    introduction: "Introduction",
    projectSummary: "Project summary",
    scopeNotes: "Scope notes",
    photosOnFile: "Project photos on file",
    noPhotos: "No photos submitted. Photos will be taken during the walkthrough.",
    photo: "Photo",
    needsConfirmation: "Needs confirmation",
    verifyNote: "The following will be verified before final pricing:",
    nextSteps: "Next steps",
    step1: "On-site walkthrough to confirm measurements and conditions.",
    step2: "Final itemized estimate delivered after walkthrough.",
    step3: "Work scheduled upon written approval.",
    signature: "Client approval (signature)",
    date: "Date",
    poweredBy: "Powered by SnapLink Contractor",
    kinds: { current: "current condition", inspiration: "inspiration", damage: "damage", other: "photo" },
  },
  es: {
    projectProposal: "PROPUESTA DE PROYECTO",
    preparedFor: "Preparado para",
    projectType: "Tipo de proyecto",
    timeline: "Plazo",
    introduction: "Introducción",
    projectSummary: "Resumen del proyecto",
    scopeNotes: "Notas de alcance",
    photosOnFile: "Fotos del proyecto en archivo",
    noPhotos: "No se enviaron fotos. Se tomarán fotos durante la visita.",
    photo: "Foto",
    needsConfirmation: "Por confirmar",
    verifyNote: "Lo siguiente se verificará antes del precio final:",
    nextSteps: "Próximos pasos",
    step1: "Visita en sitio para confirmar medidas y condiciones.",
    step2: "Presupuesto detallado final entregado después de la visita.",
    step3: "Trabajo programado tras la aprobación por escrito.",
    signature: "Aprobación del cliente (firma)",
    date: "Fecha",
    poweredBy: "Con tecnología de SnapLink Contractor",
    kinds: { current: "estado actual", inspiration: "inspiración", damage: "daños", other: "foto" },
  },
} as const;



/** Helvetica uses WinAnsi encoding — strip chars outside Latin-1 so AI text can't crash the PDF. */
function safe(text: string): string {
  return text.normalize("NFC").replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/[\u2013\u2014]/g, "-").replace(/[^\x00-\xFF]/g, "?");
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
  const contractor = await contractorStore.getById(lead.contractorId);
  const langParam = req.nextUrl.searchParams.get("lang");
  const L = langParam === "es" || langParam === "en" ? langParam : lead.language === "es" ? "es" : "en";
  const S = PDF_STRINGS[L];

  const pdf = await PDFDocument.create();
  const helv = await pdf.embedFont(StandardFonts.Helvetica);
  const helvBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const times = await pdf.embedFont(StandardFonts.TimesRomanBold);

  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 56;
  const contentWidth = pageWidth - margin * 2;

  let page = pdf.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  function newPageIfNeeded(needed: number) {
    if (y - needed < margin + 40) {
      drawFooter(page);
      page = pdf.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
  }

  function drawFooter(p: PDFPage) {
    p.drawLine({
      start: { x: margin, y: 44 },
      end: { x: pageWidth - margin, y: 44 },
      thickness: 0.5,
      color: GOLD,
    });
    p.drawText(S.poweredBy, {
      x: margin,
      y: 30,
      size: 8,
      font: helv,
      color: GRAY,
    });
  }

  function heading(text: string) {
    newPageIfNeeded(40);
    y -= 10;
    page.drawText(safe(text.toUpperCase()), { x: margin, y, size: 10, font: helvBold, color: GOLD });
    y -= 6;
    page.drawLine({
      start: { x: margin, y },
      end: { x: margin + 40, y },
      thickness: 1,
      color: GOLD,
    });
    y -= 16;
  }

  function paragraph(text: string, opts?: { size?: number; color?: ReturnType<typeof rgb>; font?: PDFFont }) {
    const size = opts?.size ?? 10.5;
    const font = opts?.font ?? helv;
    for (const line of wrap(text, font, size, contentWidth)) {
      newPageIfNeeded(size + 6);
      page.drawText(line, { x: margin, y, size, font, color: opts?.color ?? INK });
      y -= size + 5;
    }
    y -= 4;
  }

  function bullets(items: string[]) {
    for (const item of items) {
      const size = 10.5;
      const lines = wrap(item, helv, size, contentWidth - 14);
      lines.forEach((line, i) => {
        newPageIfNeeded(size + 6);
        if (i === 0) page.drawText("•", { x: margin, y, size, font: helvBold, color: GOLD });
        page.drawText(line, { x: margin + 14, y, size, font: helv, color: INK });
        y -= size + 5;
      });
    }
    y -= 4;
  }

  // --- Header band ---
  page.drawRectangle({ x: 0, y: pageHeight - 110, width: pageWidth, height: 110, color: INK });
  page.drawText(safe(contractor?.businessName ?? "Contractor"), {
    x: margin,
    y: pageHeight - 58,
    size: 24,
    font: times,
    color: rgb(0.95, 0.93, 0.9),
  });
  page.drawText(S.projectProposal, {
    x: margin,
    y: pageHeight - 80,
    size: 10,
    font: helvBold,
    color: GOLD,
  });
  const dateStr = new Date().toLocaleDateString(L === "es" ? "es-MX" : "en-US", { year: "numeric", month: "long", day: "numeric" });
  page.drawText(safe(dateStr), {
    x: pageWidth - margin - helv.widthOfTextAtSize(safe(dateStr), 9),
    y: pageHeight - 80,
    size: 9,
    font: helv,
    color: rgb(0.7, 0.7, 0.72),
  });
  y = pageHeight - 140;

  // --- Client / project block ---
  heading(S.preparedFor);
  paragraph(lead.clientName, { font: helvBold, size: 12 });
  if (lead.projectAddress) paragraph(lead.projectAddress, { color: GRAY });
  paragraph(`${S.projectType}: ${serviceLabel(lead.projectType, L)}`);
  if (lead.timeline) paragraph(`${S.timeline}: ${lead.timeline}`, { color: GRAY });

  // --- Intro ---
  if (lead.ai?.proposalIntro) {
    heading(S.introduction);
    paragraph(lead.ai.proposalIntro);
  }

  // --- Summary ---
  heading(S.projectSummary);
  paragraph(lead.ai?.summary ?? `${lead.projectType} as requested by ${lead.clientName}. ${lead.notes || ""}`);

  // --- Scope notes ---
  if (lead.ai?.scopeNotes?.length) {
    heading(S.scopeNotes);
    bullets(lead.ai.scopeNotes);
  }

  // --- Photos placeholder list ---
  heading(S.photosOnFile);
  if (lead.photos.length) {
    bullets(lead.photos.map((p, i) => `${S.photo} ${i + 1} — ${(S.kinds as Record<string, string>)[p.kind] ?? p.kind} (${p.filename})`));
  } else {
    paragraph(S.noPhotos, { color: GRAY });
  }

  // --- Needs confirmation ---
  if (lead.ai?.needsConfirmation?.length) {
    heading(S.needsConfirmation);
    paragraph(S.verifyNote, { color: GRAY, size: 9.5 });
    bullets(lead.ai.needsConfirmation);
  }

  // --- Next steps ---
  heading(S.nextSteps);
  bullets([S.step1, S.step2, S.step3]);

  // --- Signature ---
  newPageIfNeeded(90);
  y -= 20;
  page.drawLine({ start: { x: margin, y }, end: { x: margin + 220, y }, thickness: 0.75, color: INK });
  page.drawLine({ start: { x: margin + 260, y }, end: { x: margin + 380, y }, thickness: 0.75, color: INK });
  y -= 12;
  page.drawText(S.signature, { x: margin, y, size: 8.5, font: helv, color: GRAY });
  page.drawText(S.date, { x: margin + 260, y, size: 8.5, font: helv, color: GRAY });

  drawFooter(page);

  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="proposal-${lead.clientName.replace(/\s+/g, "-").toLowerCase()}.pdf"`,
    },
  });
}
