// Pure decision logic for Lucio's AI config, with no "server-only" guard so
// it can be imported directly by tests — same pattern as
// lib/real-estate/enterprise/phase11-policy.js. lib/lucio/config.ts (which
// does carry the server-only guard, since it reads real API key env vars)
// is the single real caller.
const DEFAULT_MODEL_IDS = {
  openai: "gpt-4.1-mini",
  anthropic: "claude-3-5-haiku-latest",
  groq: "llama-3.3-70b-versatile",
};

const KNOWN_PROVIDERS = ["openai", "anthropic", "groq"];

export function resolveLucioConfigValues(env) {
  const requestedProvider = env.LUCIO_AI_PROVIDER ?? "disabled";
  const wantsAi = env.LUCIO_AI_ENABLED === "true" && KNOWN_PROVIDERS.includes(requestedProvider);
  const provider = wantsAi ? requestedProvider : "disabled";

  const credential =
    provider === "openai"
      ? env.OPENAI_API_KEY?.trim()
      : provider === "anthropic"
        ? env.ANTHROPIC_API_KEY?.trim()
        : provider === "groq"
          ? env.GROQ_API_KEY?.trim()
          : undefined;
  const hasCredential = Boolean(credential);

  const modelId = provider === "disabled" ? "disabled" : (env.LUCIO_AI_MODEL || DEFAULT_MODEL_IDS[provider]);

  return {
    enabled: wantsAi && hasCredential,
    provider,
    modelId,
    credential,
  };
}
