import { NextRequest, NextResponse } from "next/server";
import { payeeStore } from "@/lib/store";
import { authorizeContractorId } from "@/lib/auth";
import { PAYEE_TYPES, TIN_TYPES, type Payee, type PayeeType, type TinType } from "@/lib/money-types";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await payeeStore.get(id);
  if (!existing) return NextResponse.json({ error: "Payee not found" }, { status: 404 });
  const denied = await authorizeContractorId(req, existing.contractorId);
  if (denied) return NextResponse.json({ error: denied }, { status: 401 });

  const body = await req.json();
  const patch: Partial<Omit<Payee, "id" | "contractorId" | "createdAt" | "updatedAt">> = {};

  if (body.name !== undefined) {
    const n = String(body.name).trim();
    if (!n) return NextResponse.json({ error: "A name is required" }, { status: 400 });
    patch.name = n.slice(0, 140);
  }
  if (body.payeeType !== undefined && PAYEE_TYPES.includes(body.payeeType)) patch.payeeType = body.payeeType as PayeeType;
  if (body.legalName !== undefined) patch.legalName = String(body.legalName).slice(0, 160) || undefined;
  if (body.address !== undefined) patch.address = String(body.address).slice(0, 240) || undefined;
  if (body.tinType !== undefined && TIN_TYPES.includes(body.tinType)) patch.tinType = body.tinType as TinType;
  if (body.tinLast4 !== undefined) {
    const last4 = String(body.tinLast4).replace(/\D/g, "");
    if (last4.length > 4) {
      return NextResponse.json(
        { error: "Only the last 4 digits of the TIN can be stored. Upload the W-9 for the full number." },
        { status: 400 }
      );
    }
    patch.tinLast4 = last4 || undefined;
  }
  if (body.w9OnFile !== undefined) patch.w9OnFile = Boolean(body.w9OnFile);
  if (body.w9ReceivedOn !== undefined) patch.w9ReceivedOn = String(body.w9ReceivedOn) || undefined;
  if (body.email !== undefined) patch.email = String(body.email).slice(0, 160);
  if (body.phone !== undefined) patch.phone = String(body.phone).slice(0, 40);
  if (body.notes !== undefined) patch.notes = String(body.notes).slice(0, 400);

  const w9Doc =
    body.w9Doc && body.w9Doc.dataUrl
      ? { dataUrl: String(body.w9Doc.dataUrl), filename: String(body.w9Doc.filename ?? "w9.jpg") }
      : undefined;

  if (Object.keys(patch).length === 0 && !w9Doc) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const updated = await payeeStore.update(id, patch, w9Doc);
  return NextResponse.json({ ok: true, payee: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await payeeStore.get(id);
  if (!existing) return NextResponse.json({ error: "Payee not found" }, { status: 404 });
  const denied = await authorizeContractorId(req, existing.contractorId);
  if (denied) return NextResponse.json({ error: denied }, { status: 401 });
  await payeeStore.softDelete(id);
  return NextResponse.json({ ok: true });
}
