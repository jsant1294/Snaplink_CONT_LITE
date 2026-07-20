import { NextRequest, NextResponse } from "next/server";
import { contractorStore } from "@/lib/store";
import { isOperator, canAccessContractor, publicContractor } from "@/lib/auth";

/**
 * POST { pin, username? }
 * - username omitted → operator check for the master admin
 * - username present → contractor scope check (their PIN or the operator PIN)
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const pin = String(body.pin ?? "").trim();
  const username = body.username ? String(body.username) : null;

  if (!username) {
    if (isOperator(pin)) return NextResponse.json({ ok: true, role: "operator" });
    return NextResponse.json({ error: "Invalid operator PIN" }, { status: 401 });
  }

  const contractor = await contractorStore.getByUsername(username);
  if (!contractor) return NextResponse.json({ error: "Contractor not found" }, { status: 404 });
  if (!canAccessContractor(pin, contractor)) {
    return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
  }
  return NextResponse.json({
    ok: true,
    role: isOperator(pin) ? "operator" : "contractor",
    contractor: publicContractor(contractor),
  });
}
