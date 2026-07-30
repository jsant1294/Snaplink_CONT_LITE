import { NextRequest, NextResponse } from "next/server";
import { authorizeRealEstate } from "@/lib/real-estate/auth";
import { selectors } from "@/lib/real-estate/phase4-repositories";

export async function GET(req: NextRequest) {
  const principal = await authorizeRealEstate(req, "dashboard:view");
  if (!principal) return NextResponse.json({ error: "Access denied" }, { status: 403 });
  return NextResponse.json({ options: await selectors(principal, req.nextUrl.searchParams.get("type") || "", req.nextUrl.searchParams.get("query") || "") });
}
