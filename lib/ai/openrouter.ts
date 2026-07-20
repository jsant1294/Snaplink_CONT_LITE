// ---------------------------------------------------------------------------
// OpenRouter client — free models only (enforced via model-guard).
// - Tries the resolved model first, then walks FREE_MODEL_CHAIN on failure
//   (free tiers rate-limit often; the chain keeps the feature alive).
// - If OPENROUTER_API_KEY is missing, generateLeadIntelligence returns a
//   deterministic offline draft so the whole app is demoable without a key.
// ---------------------------------------------------------------------------

import { assertFreeModel, resolveModel, FREE_MODEL_CHAIN } from "./model-guard";
import type { Lead, AiSummary } from "../types";
import { serviceLabel } from "../services";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

async function callModel(model: string, messages: ChatMessage[]): Promise<string> {
  assertFreeModel(model); // hard gate — nothing paid gets through
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.APP_URL ?? "http://localhost:3000",
      "X-Title": "SnapLink Contractor",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.3,
      max_tokens: 1200,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`OpenRouter ${res.status} on ${model}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  const text: string | undefined = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error(`Empty completion from ${model}`);
  return text;
}

/** Try preferred model, then walk the free fallback chain. */
async function chatWithFallback(messages: ChatMessage[]): Promise<{ text: string; model: string }> {
  const first = resolveModel();
  const chain = [first, ...FREE_MODEL_CHAIN.filter((m) => m !== first)];
  let lastError: unknown;
  for (const model of chain) {
    try {
      const text = await callModel(model, messages);
      return { text, model };
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("All free models failed");
}

// --- Lead intelligence ------------------------------------------------------

function systemPrompt(clientLanguage: "en" | "es", contractorLanguage: "en" | "es"): string {
  const clientLangName = clientLanguage === "es" ? "Spanish" : "English";
  const contractorLangName = contractorLanguage === "es" ? "Spanish" : "English";
  return `You assist a general contractor by organizing a raw client project request.
Rules — follow strictly:
- NEVER invent measurements, square footage, quantities, or prices. If not provided, do not guess.
- Anything missing or ambiguous goes in "needsConfirmation".
- Plain, contractor-friendly language. Short sentences. No fluff.
- LANGUAGE RULES (two audiences, two languages — never mix within a field):
  * CONTRACTOR-FACING fields — "summary", "scopeNotes", "questionsForClient", "needsConfirmation" — write in ${contractorLangName} (the contractor's language).
  * CLIENT-FACING fields — "followUpSms", "proposalIntro" — write in ${clientLangName} (the client's language).
- Respond ONLY with valid JSON matching exactly this shape, no markdown fences, no preamble:
{
  "summary": "3-5 sentence clean project summary",
  "scopeNotes": ["bullet", "bullet"],
  "questionsForClient": ["question", "question"],
  "followUpSms": "friendly SMS under 300 chars, from the contractor to the client, first person, in ${clientLangName}",
  "proposalIntro": "2-3 sentence professional proposal opening paragraph, in ${clientLangName}",
  "needsConfirmation": ["missing item", "missing item"]
}`;
}

function leadToPromptPayload(lead: Lead): string {
  return JSON.stringify(
    {
      projectType: lead.projectType,
      clientLanguage: lead.language,
      clientName: lead.clientName,
      projectAddress: lead.projectAddress,
      timeline: lead.timeline,
      budgetRange: lead.budgetRange,
      preferredContact: lead.preferredContact,
      bestTimeToContact: lead.bestTimeToContact,
      notes: lead.notes,
      serviceSpecificAnswers: lead.answers,
      photoCount: lead.photos.length,
    },
    null,
    2
  );
}

function parseAiJson(text: string): Omit<AiSummary, "model" | "generatedAt"> {
  const clean = text.replace(/```json|```/g, "").trim();
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  const parsed = JSON.parse(clean.slice(start, end + 1));
  return {
    summary: String(parsed.summary ?? ""),
    scopeNotes: toStringArray(parsed.scopeNotes),
    questionsForClient: toStringArray(parsed.questionsForClient),
    followUpSms: String(parsed.followUpSms ?? ""),
    proposalIntro: String(parsed.proposalIntro ?? ""),
    needsConfirmation: toStringArray(parsed.needsConfirmation),
  };
}

function toStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.map((x) => String(x)) : [];
}

/** Deterministic offline draft — keeps demo working with no API key.
 *  Contractor-facing block renders in the contractor's language; client-facing
 *  block (SMS + proposal intro) in the client's language. */
function offlineDraft(lead: Lead, contractorLanguage: "en" | "es" = "en"): AiSummary {
  const answered = Object.entries(lead.answers)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`);
  const C = contractorLanguage;
  const missing: string[] = [];
  if (!lead.budgetRange) missing.push(C === "es" ? "Rango de presupuesto" : "Budget range");
  if (!lead.timeline) missing.push(C === "es" ? "Plazo del proyecto" : "Timeline");
  if (lead.photos.length === 0) missing.push(C === "es" ? "Fotos del área del proyecto" : "Photos of the project area");
  missing.push(C === "es" ? "Medidas exactas (nunca se asumen)" : "Exact measurements (never assumed)");
  const svcC = serviceLabel(lead.projectType, C);
  return {
    summary:
      C === "es"
        ? `${lead.clientName} solicitó ${svcC} en ${lead.projectAddress || "(dirección pendiente)"}. Plazo: ${lead.timeline || "no indicado"}. Presupuesto: ${lead.budgetRange || "no indicado"}. Notas del cliente: ${lead.notes || "ninguna"}.`
        : `${lead.clientName} requested a ${lead.projectType} at ${lead.projectAddress || "(address pending)"}. Timeline: ${lead.timeline || "not stated"}. Budget: ${lead.budgetRange || "not stated"}. Client notes: ${lead.notes || "none provided"}.`,
    scopeNotes: answered.length
      ? answered
      : [C === "es" ? "Aún no hay detalles específicos del servicio." : "No service-specific details provided yet."],
    questionsForClient:
      C === "es"
        ? [
            "Confirmar medidas exactas en sitio.",
            "Confirmar selección de materiales y quién los suministra.",
            "Confirmar acceso, estacionamiento y horarios de trabajo.",
          ]
        : [
            "Confirm exact measurements on site.",
            "Confirm material selections and who supplies them.",
            "Confirm access, parking, and work-hour constraints.",
          ],
    followUpSms:
      lead.language === "es"
        ? `Hola ${lead.clientName.split(" ")[0]}, ¡gracias por tu solicitud de ${serviceLabel(lead.projectType, "es").toLowerCase()}! Me gustaría agendar una visita rápida para tomar medidas y darte un presupuesto preciso. ¿Qué día te queda mejor?`
        : `Hi ${lead.clientName.split(" ")[0]}, thanks for your ${lead.projectType.toLowerCase()} request! I'd like to schedule a quick walkthrough to take measurements and give you an accurate estimate. What day works best for you?`,
    proposalIntro:
      lead.language === "es"
        ? `Gracias por la oportunidad de cotizar su proyecto de ${serviceLabel(lead.projectType, "es").toLowerCase()}. A continuación encontrará un resumen del trabajo según lo descrito, junto con los puntos que confirmaremos juntos durante la visita.`
        : `Thank you for the opportunity to quote your ${lead.projectType.toLowerCase()} project. Below is a summary of the work as described, along with items we'll confirm together during the walkthrough.`,
    needsConfirmation: missing,
    model: "offline-draft (no OPENROUTER_API_KEY set)",
    generatedAt: new Date().toISOString(),
  };
}

export async function generateLeadIntelligence(lead: Lead, contractorLanguage: "en" | "es" = "en"): Promise<AiSummary> {
  if (!process.env.OPENROUTER_API_KEY) return offlineDraft(lead, contractorLanguage);
  const { text, model } = await chatWithFallback([
    { role: "system", content: systemPrompt(lead.language, contractorLanguage) },
    { role: "user", content: `Client project request:\n${leadToPromptPayload(lead)}` },
  ]);
  try {
    return { ...parseAiJson(text), model, generatedAt: new Date().toISOString() };
  } catch {
    // Model returned malformed JSON — fall back to offline draft rather than fail the lead.
    return { ...offlineDraft(lead, contractorLanguage), model: `${model} (unparseable → offline draft)` };
  }
}
