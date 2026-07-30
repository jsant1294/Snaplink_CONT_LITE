import { NextRequest, NextResponse } from "next/server";
import { authorizeRealEstate } from "@/lib/real-estate/auth";
import { createTransaction, listTransactions } from "@/lib/real-estate/transactions/repository";
import { validateTransactionInput } from "@/lib/real-estate/transactions/schemas";
import { parseTransactionStatus } from "@/lib/real-estate/transactions/schemas";

export async function GET(req: NextRequest) {
  const principal = await authorizeRealEstate(req, "transactions:view");
  if (!principal) return NextResponse.json({ error: "Transaction access denied" }, { status: 403 });
  const statusValue = req.nextUrl.searchParams.get("status");
  const parsedStatus = statusValue ? parseTransactionStatus(statusValue) : null;
  if (statusValue && !parsedStatus) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  return NextResponse.json(await listTransactions(principal, {
    search: req.nextUrl.searchParams.get("search") ?? undefined, status: parsedStatus ?? undefined,
    page: Number(req.nextUrl.searchParams.get("page") || 1),
    pageSize: Number(req.nextUrl.searchParams.get("pageSize") || 25),
  }));
}

export async function POST(req: NextRequest) {
  const principal = await authorizeRealEstate(req, "transactions:manage");
  if (!principal) return NextResponse.json({ error: "Transaction management permission required" }, { status: 403 });
  const validated = validateTransactionInput(await req.json());
  if (!validated.data) return NextResponse.json({ error: "Validation failed", errors: validated.errors }, { status: 400 });
  try {
    const record = await createTransaction(principal, principal.membershipId, validated.data);
    return NextResponse.json({ ok: true, record }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create transaction" }, { status: 400 });
  }
}
