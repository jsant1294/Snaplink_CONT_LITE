import { NextRequest, NextResponse } from "next/server";
import { setAsideStore } from "@/lib/store";
import { authorizeContractorId } from "@/lib/auth";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await setAsideStore.get(id);
  if (!existing) return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  const denied = await authorizeContractorId(req, existing.contractorId);
  if (denied) return NextResponse.json({ error: denied }, { status: 401 });
  await setAsideStore.softDelete(id);
  return NextResponse.json({ ok: true });
}
