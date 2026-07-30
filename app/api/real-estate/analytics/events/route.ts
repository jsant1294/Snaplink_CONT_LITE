import { NextRequest, NextResponse } from "next/server";
import { authorizeRealEstate } from "@/lib/real-estate/auth";
import { demoTenant } from "@/lib/real-estate/fixtures";
import { trackEvent } from "@/lib/real-estate/phase4-repositories";

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.eventName || !body.entityType) return NextResponse.json({ error: "Event name and entity type are required" }, { status: 400 });
  const principal = await authorizeRealEstate(req, "analytics:view");
  const tenantId = principal?.tenantId || (body.tenantId === demoTenant.id ? demoTenant.id : null);
  if (!tenantId) return NextResponse.json({ error: "Unknown tenant" }, { status: 403 });
  return NextResponse.json({ event: await trackEvent(tenantId, body) }, { status: 201 });
}
