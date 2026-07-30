import { NextRequest, NextResponse } from "next/server";
import { authorizeRealEstate } from "@/lib/real-estate/auth";
import { templateAction } from "@/lib/real-estate/phase5-repositories";
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const p = await authorizeRealEstate(req, "clients:manage"); if (!p) return NextResponse.json({ error: "Access denied" }, { status: 403 });
  const result = await templateAction(p, (await params).id, String((await req.json()).action));
  return result ? NextResponse.json({ template: result }) : NextResponse.json({ error: "Template or action not found" }, { status: 404 });
}
