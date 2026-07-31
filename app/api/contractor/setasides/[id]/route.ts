import { NextRequest, NextResponse } from "next/server";
import { setAsideStore } from "@/lib/store";
import { authorizeContractorId } from "@/lib/auth";
import { requireModuleEnabled } from "@/lib/entitlements";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await setAsideStore.get(id);
  if (!existing) return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  const denied = await authorizeContractorId(req, existing.contractorId);
  if (denied) return NextResponse.json({ error: denied }, { status: 401 });
  const moduleDenied = await requireModuleEnabled(existing.contractorId, "money");
  if (moduleDenied) return NextResponse.json({ error: moduleDenied }, { status: 403 });
  await setAsideStore.softDelete(id);
  return NextResponse.json({ ok: true });
}
