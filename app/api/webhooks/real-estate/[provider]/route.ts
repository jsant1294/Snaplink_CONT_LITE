import { NextRequest, NextResponse } from "next/server";
import { allowMalformedAttempt, ingestVerifiedWebhook, verifyWebhookSignature } from "@/lib/real-estate/integrations/webhooks";
export async function POST(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const provider = (await params).provider; if (!["resend","sendgrid","twilio"].includes(provider)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const raw = await req.text(), ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  if (!allowMalformedAttempt(`${provider}:${ip}`)) return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  if (!verifyWebhookSignature(provider as "resend"|"sendgrid"|"twilio", raw, req.headers, req.url)) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  try { await ingestVerifiedWebhook(provider as "resend"|"sendgrid"|"twilio", raw); return new NextResponse(null, { status: provider === "twilio" ? 200 : 202 }); } catch { return NextResponse.json({ error: "Webhook rejected" }, { status: 400 }); }
}
