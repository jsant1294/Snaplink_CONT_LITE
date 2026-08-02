import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const STATE_TTL_SECONDS = 10 * 60;
export interface StripeConnectState { contractorId: string; destination: string; iat: number; exp: number; nonce: string }

function secret(): string {
  const value = process.env.STRIPE_CONNECT_STATE_SECRET?.trim();
  if (!value) throw new Error("Stripe Connect state signing is not configured");
  return value;
}
function sign(encoded: string): string { return createHmac("sha256", secret()).update(encoded).digest("base64url"); }
export function contractorInvoicesDestination(username: string): string { return `/contractor-admin/${encodeURIComponent(username)}/invoices`; }
export function isSafeConnectDestination(destination: string): boolean { return /^\/contractor-admin\/[a-z0-9][a-z0-9_-]*\/invoices$/.test(destination); }
export function createStripeConnectState(contractorId: string, destination: string, nowSeconds = Math.floor(Date.now() / 1000)): string {
  if (!contractorId || !isSafeConnectDestination(destination)) throw new Error("Invalid Stripe Connect state payload");
  const payload: StripeConnectState = { contractorId, destination, iat: nowSeconds, exp: nowSeconds + STATE_TTL_SECONDS, nonce: randomBytes(16).toString("base64url") };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}
export function verifyStripeConnectState(token: string, nowSeconds = Math.floor(Date.now() / 1000)): StripeConnectState | null {
  const [encoded, signature, extra] = token.split(".");
  if (!encoded || !signature || extra) return null;
  try {
    const expected = Buffer.from(sign(encoded)); const supplied = Buffer.from(signature);
    if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as StripeConnectState;
    if (!payload.contractorId || !payload.nonce || !isSafeConnectDestination(payload.destination)) return null;
    if (!Number.isInteger(payload.iat) || !Number.isInteger(payload.exp) || payload.iat > nowSeconds + 30 || payload.exp < nowSeconds) return null;
    return payload;
  } catch { return null; }
}
