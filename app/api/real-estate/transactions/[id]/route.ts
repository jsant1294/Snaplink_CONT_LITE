import { NextRequest, NextResponse } from "next/server";
import { authorizeRealEstate } from "@/lib/real-estate/auth";
import { archiveTransaction, findTransaction, updateTransaction } from "@/lib/real-estate/transactions/repository";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const principal = await authorizeRealEstate(req, "transactions:view");
  if (!principal) return NextResponse.json({ error: "Transaction access denied" }, { status: 403 });
  const record = await findTransaction(principal, (await params).id);
  return record ? NextResponse.json({ record }) : NextResponse.json({ error: "Transaction not found" }, { status: 404 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const principal = await authorizeRealEstate(req, "transactions:manage");
  if (!principal) return NextResponse.json({ error: "Transaction management permission required" }, { status: 403 });
  try {
    const record = await archiveTransaction(principal, principal.membershipId, (await params).id);
    return record ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to archive transaction" }, { status: 409 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const principal = await authorizeRealEstate(req, "transactions:manage");
  if (!principal) return NextResponse.json({ error: "Transaction management permission required" }, { status: 403 });
  try {
    const record = await updateTransaction(principal, principal.membershipId, (await params).id, await req.json());
    return record ? NextResponse.json({ ok: true, record }) : NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update transaction" }, { status: 400 });
  }
}
