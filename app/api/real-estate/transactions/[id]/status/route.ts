import { NextRequest, NextResponse } from "next/server";
import { authorizeRealEstate } from "@/lib/real-estate/auth";
import { transitionTransaction } from "@/lib/real-estate/transactions/repository";
import { parseTransactionStatus } from "@/lib/real-estate/transactions/schemas";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const body = await req.json();
  const status = parseTransactionStatus(body.status);
  if (!status) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  const permission = status === "closed" ? "transactions:close" : "transactions:manage";
  const principal = await authorizeRealEstate(req, permission);
  if (!principal) return NextResponse.json({ error: "Status change permission required" }, { status: 403 });
  try {
    const record = await transitionTransaction(
      principal, principal.membershipId, (await params).id, status,
      req.headers.get("idempotency-key") || body.idempotencyKey || "", body.reason,
    );
    return record ? NextResponse.json({ ok: true, record }) : NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to change status" }, { status: 409 });
  }
}
