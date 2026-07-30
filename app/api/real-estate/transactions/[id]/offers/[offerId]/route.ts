import { NextRequest, NextResponse } from "next/server";
import { authorizeRealEstate } from "@/lib/real-estate/auth";
import { changeOfferStatus, reviseOffer } from "@/lib/real-estate/transactions/operations";
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; offerId: string }> }) {
  const principal = await authorizeRealEstate(req, "offers:manage");
  if (!principal) return NextResponse.json({ error: "Offer management permission required" }, { status: 403 });
  const { id, offerId } = await params; const body = await req.json();
  try {
    const result = body.action === "revise"
      ? await reviseOffer(principal, principal.membershipId, id, offerId, { ...body, offerPriceCents: Number(body.offerPriceCents) })
      : await changeOfferStatus(principal, principal.membershipId, id, offerId, String(body.status || ""));
    return NextResponse.json({ ok: true, result });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Offer action failed" }, { status: 409 }); }
}
