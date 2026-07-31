import { NextRequest, NextResponse } from "next/server";
import { contractorStore } from "@/lib/store";
import { authorizeContractorId, isOperator, pinFromRequest } from "@/lib/auth";
import { listModuleStates, setModuleEnabled } from "@/lib/entitlements";
import { MODULE_KEYS, type ModuleKey } from "@/lib/entitlement-types";

export async function GET(req: NextRequest) {
  const contractorId = req.nextUrl.searchParams.get("contractorId") ?? "";
  if (!contractorId) return NextResponse.json({ error: "contractorId is required" }, { status: 400 });
  const denied = await authorizeContractorId(req, contractorId);
  if (denied) return NextResponse.json({ error: denied }, { status: 401 });
  const modules = await listModuleStates(contractorId);
  return NextResponse.json({ modules });
}

/** Operator-only — professionals never control their own module access. */
export async function POST(req: NextRequest) {
  const pin = pinFromRequest(req);
  if (!isOperator(pin)) {
    return NextResponse.json({ error: "Operator access required" }, { status: 403 });
  }
  const body = await req.json();
  const contractorId = String(body.contractorId ?? "");
  const moduleKey = body.moduleKey as ModuleKey;
  if (!contractorId) return NextResponse.json({ error: "contractorId is required" }, { status: 400 });
  if (!MODULE_KEYS.includes(moduleKey)) {
    return NextResponse.json({ error: "Invalid moduleKey" }, { status: 400 });
  }
  const contractor = await contractorStore.getById(contractorId);
  if (!contractor) return NextResponse.json({ error: "Contractor not found" }, { status: 404 });

  const enabled = Boolean(body.enabled);
  const notes = typeof body.notes === "string" ? body.notes.slice(0, 500) : undefined;
  const entitlement = await setModuleEnabled(contractorId, moduleKey, enabled, "operator", notes);
  return NextResponse.json({ ok: true, entitlement });
}
