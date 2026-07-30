import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export const ALLOWED_DOCUMENT_TYPES = new Set([
  "application/pdf", "image/jpeg", "image/png", "image/webp", "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);
export const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024;

export function sanitizeDocumentFilename(name: string) {
  const base = name.split(/[\\/]/).pop() || "document";
  const safe = base.normalize("NFKC").replace(/[^a-zA-Z0-9._ -]/g, "_").replace(/\.+/g, ".").slice(0, 120);
  return safe && safe !== "." ? safe : "document";
}
export const checksum = (bytes: ArrayBuffer) => createHash("sha256").update(Buffer.from(bytes)).digest("hex");
export const createOpaqueToken = () => randomBytes(32).toString("base64url");
export function hashPassword(password: string) {
  const salt = randomBytes(16);
  return `${salt.toString("base64url")}.${scryptSync(password, salt, 32).toString("base64url")}`;
}
export function verifyPassword(password: string, encoded: string) {
  const [saltValue, hashValue] = encoded.split(".");
  if (!saltValue || !hashValue) return false;
  const expected = Buffer.from(hashValue, "base64url");
  const actual = scryptSync(password, Buffer.from(saltValue, "base64url"), expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
export interface MalwareScanner { scan(bytes: ArrayBuffer, filename: string): Promise<"clean" | "infected" | "pending">; }
export const developmentScanner: MalwareScanner = {
  async scan() { return process.env.NODE_ENV === "production" ? "pending" : "clean"; },
};
