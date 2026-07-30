const FAIR_HOUSING = [
  /\b(no|not for)\s+(children|families|disabled|wheelchair users?)\b/i,
  /\b(whites?|christians?|jews?|muslims?|asians?|hispanics?)\s+only\b/i,
  /\bperfect for\s+(young professionals?|singles?|christian families?)\b/i,
  /\b(safe|exclusive)\s+(neighbou?rhood|community)\b/i,
];
const INJECTION = [
  /ignore (all |any )?(previous|prior|system) instructions/i,
  /reveal (the )?(system|hidden) prompt/i,
  /send (this |the )?data (elsewhere|to)/i,
  /access another (tenant|transaction|account)/i,
  /approve (this|the) offer automatically/i,
];
const REDACTIONS = [
  [/\b\d{3}-\d{2}-\d{4}\b/g, "[REDACTED_SSN]"],
  [/\b(?:\d[ -]*?){13,19}\b/g, "[REDACTED_PAYMENT_CARD]"],
  [/\b(?:routing|account)\s*(?:number|#|no\.?)?\s*[:=]?\s*\d{6,17}\b/gi, "[REDACTED_BANKING_DATA]"],
  [/\b(?:api[_ -]?key|authorization|bearer|access[_ -]?token|refresh[_ -]?token)\s*[:=]\s*\S+/gi, "[REDACTED_SECRET]"],
];

export function redactSensitiveValue(value) {
  return REDACTIONS.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), String(value));
}
export function hasPromptInjectionValue(value) {
  return INJECTION.some((pattern) => pattern.test(String(value)));
}
export function isFairHousingSafeValue(value) {
  return !FAIR_HOUSING.some((pattern) => pattern.test(String(value)));
}
export function gradeForScoreValue(score) {
  if (!Number.isInteger(score) || score < 0 || score > 100) throw new Error("Invalid score");
  return score >= 80 ? "A" : score >= 65 ? "B" : score >= 50 ? "C" : score >= 35 ? "D" : "E";
}
export function scoreLeadValue(lead) {
  let score = 20;
  const factors = [];
  if (lead.email || lead.phone) { score += 20; factors.push("contactable"); }
  if (lead.assignedAgentId) { score += 15; factors.push("assigned"); }
  if (["qualified", "appointment_scheduled", "showing_scheduled", "active", "under_contract"].includes(lead.stage)) {
    score += 30; factors.push("active_stage");
  }
  if (String(lead.notes || "").trim()) { score += 10; factors.push("context"); }
  score = Math.min(100, score);
  return { score, grade: gradeForScoreValue(score), factors };
}
export function resolveProviderModeValue({ nodeEnv, enabled, provider, credential }) {
  if (nodeEnv === "test") return "mock";
  if (!enabled) return "disabled";
  if (!["mock", "openai", "anthropic"].includes(provider)) throw new Error("Unsupported provider");
  if (nodeEnv === "production" && provider !== "mock" && !credential) throw new Error("Missing production credential");
  return provider;
}
