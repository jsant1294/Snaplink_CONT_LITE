// ---------------------------------------------------------------------------
// Store driver switch for Snaplink Profile (self-service agent profiles).
// Mirrors lib/store.ts's pattern exactly. API routes import from here and
// never know which backend is live.
// ---------------------------------------------------------------------------

import { jsonAgentProfileStore } from "./store-json";
import { pgAgentProfileStore } from "./store-pg";
import { usePg } from "../db-url";
import { newId } from "../store";

export const agentProfileStore = usePg ? pgAgentProfileStore : jsonAgentProfileStore;
export { newId };
