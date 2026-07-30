import { NextRequest, NextResponse } from "next/server";
import { authorizeRealEstate } from "@/lib/real-estate/auth";
import { propertyRepository, type PropertyInput } from "@/lib/real-estate/repositories";
import { validatePropertyInput } from "@/lib/real-estate/validation";
import type { PropertyStatus } from "@/lib/real-estate/types";
import { recordActivity } from "@/lib/real-estate/crm-repositories";

function options(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  return {
    search: params.get("search") ?? undefined,
    status: (params.get("status") || undefined) as PropertyStatus | undefined,
    sort: (params.get("sort") || undefined) as "title" | "price" | "status" | "updatedAt" | undefined,
    direction: params.get("direction") === "asc" ? "asc" as const : "desc" as const,
    page: Number(params.get("page") || 1),
    pageSize: Number(params.get("pageSize") || 12),
  };
}

export async function GET(req: NextRequest) {
  const principal = authorizeRealEstate(req, "properties:view");
  if (!principal) return NextResponse.json({ error: "Real Estate access denied" }, { status: 401 });
  const result = await propertyRepository.listProperties(principal.tenantId, options(req));
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const principal = authorizeRealEstate(req, "properties:manage");
  if (!principal) return NextResponse.json({ error: "Property management permission required" }, { status: 403 });
  const validation = validatePropertyInput(await req.json());
  if (!validation.valid) return NextResponse.json({ error: "Validation failed", errors: validation.errors }, { status: 400 });
  try {
    const property = await propertyRepository.createProperty(validation.data as PropertyInput, principal.tenantId);
    await recordActivity(principal.tenantId, "properties", property.id, "created", `Property created: ${property.title}`);
    return NextResponse.json({ ok: true, property }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Property creation failed";
    return NextResponse.json({ error: message.includes("unique") ? "A property with this slug already exists" : message }, { status: 409 });
  }
}
