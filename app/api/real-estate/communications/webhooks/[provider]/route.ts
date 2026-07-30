import { NextResponse } from "next/server";
// Phase 5 compatibility endpoint is intentionally retired. Production
// providers must use signature-verified /api/webhooks/real-estate/* routes.
export async function POST() {
  return NextResponse.json({ error: "Webhook endpoint retired" }, { status: 410 });
}
