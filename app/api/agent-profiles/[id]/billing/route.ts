import { NextRequest, NextResponse } from "next/server";
import { isOperator, pinFromRequest } from "@/lib/agent-profiles/auth";
import { agentInvoices, agentSubscriptions, cancelAgentSubscription, generateAgentInvoice, subscribeAgentToTier } from "@/lib/agent-profiles/billing";
import { resolveAgentTier } from "@/lib/agent-profiles/tiers";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!isOperator(pinFromRequest(req))) return NextResponse.json({ error: "Operator PIN required" }, { status: 401 });
  const { id } = await ctx.params;
  const [subscriptions, invoices] = await Promise.all([agentSubscriptions(id), agentInvoices(id)]);
  return NextResponse.json({ subscriptions, invoices });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!isOperator(pinFromRequest(req))) return NextResponse.json({ error: "Operator PIN required" }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json();
  try {
    if (body.action === "subscribe" && resolveAgentTier(body.tier)) {
      const result = await subscribeAgentToTier(id, String(body.planId || ""), String(body.tier));
      return NextResponse.json({ subscription: result.subscription, tierResult: result.tierResult }, { status: 201 });
    }
    if (body.action === "cancel") {
      return NextResponse.json({ subscription: await cancelAgentSubscription(id, String(body.subscriptionId || "")) });
    }
    if (body.action === "invoice") {
      return NextResponse.json({ invoice: await generateAgentInvoice(id, String(body.subscriptionId || "")) }, { status: 201 });
    }
    return NextResponse.json({ error: "Unknown billing action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Billing action failed" }, { status: 400 });
  }
}
