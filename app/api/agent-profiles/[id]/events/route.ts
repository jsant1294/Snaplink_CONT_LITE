import { NextRequest, NextResponse } from "next/server";
import { EVENT_TYPES, recordAgentProfileEvent, type AgentProfileEventType } from "@/lib/agent-profiles/events";

/** Public, no-auth fire-and-forget analytics: profile views, contact clicks, booking starts. */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const eventType = String(body.eventType || "");
  if (!EVENT_TYPES.includes(eventType as AgentProfileEventType)) {
    return NextResponse.json({ error: "Invalid eventType" }, { status: 400 });
  }
  await recordAgentProfileEvent(id, eventType as AgentProfileEventType, {
    anonymousSessionId: body.anonymousSessionId ? String(body.anonymousSessionId) : undefined,
    referrer: req.headers.get("referer") || undefined,
  });
  return NextResponse.json({ ok: true });
}
