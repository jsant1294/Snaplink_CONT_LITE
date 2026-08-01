import { jsonSouthlineStore } from "./southline-store-json";
import { pgSouthlineStore } from "./southline-store-pg";
import { usePg } from "./db-url";

// The JSON file store only works for local dev — Vercel's serverless
// filesystem is read-only outside /tmp, so it always throws ENOENT there.
export const southlineStore = usePg ? pgSouthlineStore : jsonSouthlineStore;
