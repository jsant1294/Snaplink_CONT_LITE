import { NextRequest, NextResponse } from "next/server";
import { authorizeRealEstate } from "@/lib/real-estate/auth";
import { crmRepository } from "@/lib/real-estate/crm-repositories";

export async function GET(req: NextRequest) {
  const principal = await authorizeRealEstate(req, "dashboard:view");
  if (!principal) return NextResponse.json({ error: "Dashboard access denied" }, { status: 403 });
  const [metrics, activities] = await Promise.all([
    crmRepository.metrics(principal.tenantId),
    crmRepository.activities(principal.tenantId),
  ]);
  return NextResponse.json({ metrics, activities });
}
