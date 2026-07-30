import { NextRequest, NextResponse } from "next/server";
import { authorizeRealEstate } from "@/lib/real-estate/auth";
import { transactionWorkspace } from "@/lib/real-estate/transactions/operations";
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const principal = await authorizeRealEstate(req, "transactions:view");
  if (!principal) return NextResponse.json({ error: "Transaction access denied" }, { status: 403 });
  const workspace = await transactionWorkspace(principal, (await params).id);
  return workspace ? NextResponse.json(workspace) : NextResponse.json({ error: "Transaction not found" }, { status: 404 });
}
