import { jsonSouthlineStore } from "./southline-store-json";
import { usePg } from "./db-url";

// Phase 2 uses JSON storage; Postgres store can be added when needed
export const southlineStore = jsonSouthlineStore;
