// Lucio's LLM config — mirrors lib/real-estate/ai/config.ts's enabled/provider
// convention (safe by default, real once a key is set), but Lucio is a
// consumer-facing streaming chat surface built on the AI SDK, not the
// real-estate module's one-shot content-generation system, so it gets its own
// small config rather than importing that one wholesale.
//
// Credentials are read from the same OPENAI_API_KEY/ANTHROPIC_API_KEY vars the
// real-estate AI system already uses — they're provider credentials, not
// feature-specific, so there's no reason to ask for the same secret twice.
//
// Uses the direct @ai-sdk/openai / @ai-sdk/anthropic provider packages rather
// than AI Gateway's plain "provider/model" strings: Gateway auth defaults to
// Vercel OIDC (from `vercel env pull`) or a separate AI_GATEWAY_API_KEY, and
// this project isn't Vercel-linked and already has an OPENAI_API_KEY/
// ANTHROPIC_API_KEY-based convention elsewhere — matching that is simpler
// than introducing a third credential scheme.
import "server-only";
import { resolveLucioConfigValues } from "./config-logic.js";

export type LucioProvider = "openai" | "anthropic" | "disabled";

export interface LucioConfig {
  enabled: boolean;
  provider: LucioProvider;
  modelId: string;
  credential?: string;
}

export function loadLucioConfig(env: NodeJS.ProcessEnv = process.env): LucioConfig {
  return resolveLucioConfigValues(env) as LucioConfig;
}

// Lazily resolves an actual AI SDK LanguageModel. Only called once config.enabled
// is true, so the provider packages are only exercised when a real key is set.
export async function resolveLucioModel(config: LucioConfig) {
  if (!config.enabled) throw new Error("Lucio AI is disabled");
  if (config.provider === "openai") {
    const { createOpenAI } = await import("@ai-sdk/openai");
    return createOpenAI({ apiKey: config.credential })(config.modelId);
  }
  if (config.provider === "anthropic") {
    const { createAnthropic } = await import("@ai-sdk/anthropic");
    return createAnthropic({ apiKey: config.credential })(config.modelId);
  }
  throw new Error("Lucio AI provider is disabled");
}
