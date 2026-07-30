import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { realEstateCommunications } from "@/lib/db/schema";
import { db } from "@/lib/real-estate/repositories";
export async function POST(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const secret = process.env.REAL_ESTATE_WEBHOOK_SECRET;
  if (!secret || req.headers.get("x-real-estate-webhook-secret") !== secret) return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  const provider = (await params).provider, body = await req.json(), tenantId = String(body.tenantId || ""), messageId = String(body.providerMessageId || "");
  if (!["resend","sendgrid","twilio"].includes(provider) || !tenantId || !messageId) return NextResponse.json({ error: "Invalid delivery event" }, { status: 400 });
  const status = ["delivered","failed","sent"].includes(body.status) ? body.status : "failed", timestamp = new Date().toISOString();
  const rows = await db().update(realEstateCommunications).set({ status, deliveredAt: status === "delivered" ? timestamp : null, error: status === "failed" ? String(body.failureReason || "Provider delivery failed") : null, updatedAt: timestamp }).where(and(eq(realEstateCommunications.tenantId, tenantId), eq(realEstateCommunications.provider, provider), eq(realEstateCommunications.providerMessageId, messageId))).returning({ id: realEstateCommunications.id });
  return NextResponse.json({ updated: rows.length });
}
