import { NextRequest, NextResponse } from "next/server";
import { LUCIO_EVENT_TYPES, recordLucioEvent, type LucioEventType } from "@/lib/lucio/events";

/** Public, no-auth fire-and-forget analytics for the Lucio widget. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const eventType = String(body.eventType || "");
  if (!LUCIO_EVENT_TYPES.includes(eventType as LucioEventType)) {
    return NextResponse.json({ error: "Invalid eventType" }, { status: 400 });
  }
  await recordLucioEvent(eventType as LucioEventType, {
    sessionId: body.sessionId ? String(body.sessionId) : undefined,
    pageType: body.pageType ? String(body.pageType) : undefined,
    pageRef: body.pageRef ? String(body.pageRef) : undefined,
    metadata: typeof body.metadata === "object" && body.metadata ? body.metadata : undefined,
  });
  return NextResponse.json({ ok: true });
}
