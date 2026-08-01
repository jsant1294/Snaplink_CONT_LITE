// Lucio's LLM config — mirrors lib/real-estate/ai/config.ts's enabled/provider
// convention (safe by default, real once a key is set), but Lucio is a
// consumer-facing streaming chat surface built on the AI SDK, not the
// real-estate module's one-shot content-generation system, so it gets its own
// small config rather than importing that one wholesale.
//
// Credentials are read from OPENAI_API_KEY/ANTHROPIC_API_KEY/GROQ_API_KEY —
// the same vars the real-estate AI system and ad-hoc testing already use.
// Groq is the default for local/dev testing (free tier, fast Llama models);
// swap LUCIO_AI_PROVIDER to openai/anthropic for production quality.
//
// Uses the direct @ai-sdk/openai / @ai-sdk/anthropic / @ai-sdk/groq provider
// packages rather than AI Gateway's plain "provider/model" strings: this repo
// already has a provider-API-key-based convention (OPENAI_API_KEY etc.)
// everywhere else, and Groq isn't behind AI Gateway the same way — matching
// the existing convention is simpler than mixing credential schemes.
import "server-only";
import { resolveLucioConfigValues } from "./config-logic.js";

export type LucioProvider = "openai" | "anthropic" | "groq" | "disabled";

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
  if (config.provider === "groq") {
    const { createGroq } = await import("@ai-sdk/groq");
    return createGroq({ apiKey: config.credential })(config.modelId);
  }
  throw new Error("Lucio AI provider is disabled");
}
