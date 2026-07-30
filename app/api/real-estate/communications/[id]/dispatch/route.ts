import { NextRequest, NextResponse } from "next/server";
import { authorizeRealEstate } from "@/lib/real-estate/auth";
import { dispatchCommunication } from "@/lib/real-estate/phase5-repositories";
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const p = await authorizeRealEstate(req, "clients:manage"); if (!p) return NextResponse.json({ error: "Access denied" }, { status: 403 });
  const communication = await dispatchCommunication(p, (await params).id);
  return communication ? NextResponse.json({ communication }) : NextResponse.json({ error: "Message cannot be dispatched" }, { status: 409 });
}
