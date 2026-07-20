// ---------------------------------------------------------------------------
// Model guard — SnapLink Contractor MVP runs on OpenRouter FREE models only.
// Any model that does not carry the ":free" suffix (or isn't explicitly
// allowlisted) is rejected BEFORE the request leaves the server. This is the
// single choke point: openrouter.ts cannot call a model without passing here.
// ---------------------------------------------------------------------------

/** Preferred free models, in fallback order. Verified free-tier IDs. */
export const FREE_MODEL_CHAIN = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "google/gemini-2.0-flash-exp:free",
  "mistralai/mistral-small-3.1-24b-instruct:free",
  "meta-llama/llama-3.1-8b-instruct:free",
] as const;

/** Explicit allowlist beyond the ":free" suffix rule (kept empty for MVP). */
const EXTRA_ALLOWED: string[] = [];

export class ModelGuardError extends Error {
  constructor(model: string) {
    super(
      `Model "${model}" blocked by model-guard: MVP allows OpenRouter free models only (id must end in ":free").`
    );
    this.name = "ModelGuardError";
  }
}

export function isFreeModel(model: string): boolean {
  return model.endsWith(":free") || EXTRA_ALLOWED.includes(model);
}

/** Throws if the model is not free. Returns the model for chaining. */
export function assertFreeModel(model: string): string {
  if (!isFreeModel(model)) throw new ModelGuardError(model);
  return model;
}

/** Resolve the model to use: env override (guarded) or head of free chain. */
export function resolveModel(): string {
  const override = process.env.OPENROUTER_MODEL?.trim();
  if (override) return assertFreeModel(override);
  return FREE_MODEL_CHAIN[0];
}
