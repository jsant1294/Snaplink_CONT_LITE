import { NextRequest, NextResponse } from "next/server";
import { invoiceStore } from "@/lib/store";
import { authorizeContractorId } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await invoiceStore.get(id);
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  const denied = await authorizeContractorId(req, invoice.contractorId);
  if (denied) return NextResponse.json({ error: denied }, { status: 401 });
  return NextResponse.json({ invoice });
}
