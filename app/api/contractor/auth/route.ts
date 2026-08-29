import { NextRequest, NextResponse } from "next/server";
import { contractorStore } from "@/lib/store";
import { isOperator, canAccessContractor, publicContractor } from "@/lib/auth";
import {
  clientIpFromRequest,
  isAuthRateLimited,
  recordAuthFailure,
  clearAuthFailures,
  authRetryAfterSeconds,
} from "@/lib/auth-rate-limit";

/**
 * POST { pin, username? }
 * - username omitted → operator check for the master admin
 * - username present → contractor scope check (their PIN or the operator PIN)
 *
 * PATCH 1 hardening:
 *  - In-memory per-IP rate limiting (~10 failed attempts / 15 min, schema-free).
 *  - Failure responses are unified to 401 "Invalid PIN" so the endpoint does
 *    NOT reveal whether a particular username exists before authentication.
 *  - Successful auth resets the IP's failure counter on the following request.
 *  - No PIN value is ever logged or returned.
 */
export async function POST(req: NextRequest) {
  const ip = clientIpFromRequest(req);

  if (isAuthRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(authRetryAfterSeconds(ip)) } }
    );
  }

  const body = await req.json().catch(() => null);
  const pin = String(body?.pin ?? "").trim();
  const username = body?.username ? String(body.username) : null;

  if (!username) {
    if (isOperator(pin)) {
      clearAuthFailures(ip);
      return NextResponse.json({ ok: true, role: "operator" });
    }
    recordAuthFailure(ip);
    return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
  }

  const contractor = await contractorStore.getByUsername(username);
  if (!contractor || !canAccessContractor(pin, contractor)) {
    recordAuthFailure(ip);
    return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
  }

  clearAuthFailures(ip);
  return NextResponse.json({
    ok: true,
    role: isOperator(pin) ? "operator" : "contractor",
    contractor: publicContractor(contractor),
  });
}
