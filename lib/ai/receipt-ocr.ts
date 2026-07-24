// ---------------------------------------------------------------------------
// Receipt OCR — Lucio Financial Copilot.
//
// SUGGESTION ONLY. This module never writes an expense. It reads a receipt
// photo and proposes amount / date / vendor for a human to confirm.
//
// Discipline (same as lib/ai/openrouter.ts):
//   - Free models only, enforced by assertFreeModel from ./model-guard
//   - NEVER invent a value. Unsure -> null. A wrong number in a tax record is
//     worse than a blank one the user fills in himself.
//   - No API key, model failure, or unparseable output -> empty suggestion.
//     The batch flow still works; the user just types the fields.
//
// NOTE: OpenRouter's free vision lineup churns. If every model in the chain
// starts failing, update FREE_VISION_MODEL_CHAIN — nothing else needs to change.
// ---------------------------------------------------------------------------

import { assertFreeModel } from "./model-guard";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

/** Vision-capable models on OpenRouter's free tier, in fallback order. */
export const FREE_VISION_MODEL_CHAIN = [
  "google/gemini-2.0-flash-exp:free",
  "qwen/qwen2.5-vl-72b-instruct:free",
  "meta-llama/llama-3.2-11b-vision-instruct:free",
  "mistralai/mistral-small-3.1-24b-instruct:free",
] as const;

export interface ReceiptSuggestion {
  /** Dollars as a string exactly as printed on the receipt, e.g. "64.32". null if unreadable. */
  amount: string | null;
  /** YYYY-MM-DD. null if unreadable. */
  spentOn: string | null;
  /** Store/vendor name as printed. null if unreadable. */
  vendor: string | null;
  /** Which model produced this, or why it's empty. Shown to the user as provenance. */
  source: string;
  /** true when at least one field was read. */
  hasSuggestion: boolean;
}

const EMPTY = (source: string): ReceiptSuggestion => ({
  amount: null,
  spentOn: null,
  vendor: null,
  source,
  hasSuggestion: false,
});

const SYSTEM_PROMPT = `You read photographs of purchase receipts and extract three fields.

STRICT RULES:
- Report ONLY what is legibly printed on the receipt. NEVER guess, infer, or calculate a value.
- If a field is blurry, cut off, ambiguous, or absent, return null for that field. A null is correct and expected.
- "amount" is the FINAL TOTAL paid (after tax), not the subtotal, not an item price. Digits and one decimal point only, no currency symbol, no thousands separator. Example: "1284.07"
- "spentOn" is the transaction date in YYYY-MM-DD. If the year is not printed, return null rather than assuming a year.
- "vendor" is the store or business name as printed, max 60 characters.
- Respond with ONLY valid JSON, no markdown fences, no explanation:
{"amount": "64.32" or null, "spentOn": "2026-07-10" or null, "vendor": "Home Depot" or null}`;

function sanitizeAmount(v: unknown): string | null {
  if (typeof v !== "string" && typeof v !== "number") return null;
  const cleaned = String(v).replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const n = parseFloat(cleaned);
  // Reject nonsense: non-finite, zero/negative, or absurdly large for a receipt.
  if (!isFinite(n) || n <= 0 || n > 1_000_000) return null;
  return n.toFixed(2);
}

function sanitizeDate(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const t = Date.parse(s);
  if (Number.isNaN(t)) return null;
  // Reject dates in the future or absurdly far in the past.
  const year = Number(s.slice(0, 4));
  const nowYear = new Date().getFullYear();
  if (year < nowYear - 10 || t > Date.now() + 86_400_000) return null;
  return s;
}

function sanitizeVendor(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim().replace(/\s+/g, " ").slice(0, 60);
  return s.length >= 2 ? s : null;
}

async function callVisionModel(model: string, dataUrl: string): Promise<string> {
  assertFreeModel(model); // hard gate — nothing paid gets through
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.APP_URL ?? "http://localhost:3000",
      "X-Title": "SnapLink Contractor — Lucio Financial Copilot",
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      max_tokens: 300,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: "Extract the total, date, and vendor from this receipt." },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`OpenRouter ${res.status} on ${model}: ${body.slice(0, 160)}`);
  }
  const data = await res.json();
  const text: string | undefined = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error(`Empty completion from ${model}`);
  return text;
}

function parseSuggestion(text: string, model: string): ReceiptSuggestion {
  const clean = text.replace(/```json|```/g, "").trim();
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start < 0 || end < 0) return EMPTY(`${model} (unparseable)`);
  const parsed = JSON.parse(clean.slice(start, end + 1));
  const amount = sanitizeAmount(parsed.amount);
  const spentOn = sanitizeDate(parsed.spentOn);
  const vendor = sanitizeVendor(parsed.vendor);
  return {
    amount,
    spentOn,
    vendor,
    source: model,
    hasSuggestion: Boolean(amount || spentOn || vendor),
  };
}

/**
 * Read a receipt photo and propose field values. Always resolves — never throws.
 * The caller shows these as editable defaults the user must confirm.
 */
export async function suggestFromReceipt(dataUrl: string): Promise<ReceiptSuggestion> {
  if (!process.env.OPENROUTER_API_KEY) return EMPTY("no OPENROUTER_API_KEY — enter fields manually");
  if (!dataUrl.startsWith("data:image/")) return EMPTY("not an image");

  const override = process.env.OPENROUTER_VISION_MODEL?.trim();
  const chain = override
    ? [override, ...FREE_VISION_MODEL_CHAIN.filter((m) => m !== override)]
    : [...FREE_VISION_MODEL_CHAIN];

  let lastError = "";
  for (const model of chain) {
    try {
      const text = await callVisionModel(model, dataUrl);
      const suggestion = parseSuggestion(text, model);
      if (suggestion.hasSuggestion) return suggestion;
      lastError = `${model} read nothing`;
    } catch (err) {
      lastError = err instanceof Error ? err.message.slice(0, 120) : "unknown error";
    }
  }
  return EMPTY(`could not read receipt (${lastError}) — enter fields manually`);
}
