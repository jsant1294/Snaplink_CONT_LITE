import { NextRequest, NextResponse } from "next/server";
import { authorizeRealEstate } from "@/lib/real-estate/auth";
import { listTemplates, previewTemplate, saveTemplate } from "@/lib/real-estate/phase5-repositories";
export async function GET(req: NextRequest) { const p = await authorizeRealEstate(req, "clients:view"); return p ? NextResponse.json({ templates: await listTemplates(p) }) : NextResponse.json({ error: "Access denied" }, { status: 403 }); }
export async function POST(req: NextRequest) {
  const p = await authorizeRealEstate(req, "clients:manage"); if (!p) return NextResponse.json({ error: "Access denied" }, { status: 403 });
  const body = await req.json();
  try {
    if (body.action === "preview") return NextResponse.json({ preview: previewTemplate(String(body.subject || ""), String(body.body || ""), body.values || {}) });
    return NextResponse.json({ template: await saveTemplate(p, p.membershipId, body) }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid template" }, { status: 400 }); }
}
