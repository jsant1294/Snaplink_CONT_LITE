import { NextRequest, NextResponse } from "next/server";
import { trackQrScan } from "@/lib/real-estate/phase5-repositories";
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) { const result = await trackQrScan((await params).id, await req.json()); return result ? NextResponse.json(result, { status: 201 }) : NextResponse.json({ error: "QR link not found" }, { status: 404 }); }
