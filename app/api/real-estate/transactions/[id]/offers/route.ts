import { NextRequest, NextResponse } from "next/server";
import { authorizeRealEstate } from "@/lib/real-estate/auth";
import { createOffer } from "@/lib/real-estate/transactions/operations";
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const principal = await authorizeRealEstate(req, "offers:manage");
  if (!principal) return NextResponse.json({ error: "Offer management permission required" }, { status: 403 });
  try {
    const input = await req.json();
    const result = await createOffer(principal, principal.membershipId, (await params).id, { ...input, offerPriceCents: Number(input.offerPriceCents) });
    return NextResponse.json({ ok: true, ...result }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create offer" }, { status: 400 }); }
}
