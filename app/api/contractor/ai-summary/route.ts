import { NextRequest, NextResponse } from "next/server";
import { leadStore, contractorStore } from "@/lib/store";
import { generateLeadIntelligence } from "@/lib/ai/openrouter";
import { ModelGuardError } from "@/lib/ai/model-guard";
import { authorizeContractorId } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { leadId } = await req.json();
  const lead = await leadStore.get(String(leadId ?? ""));
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  const denied = await authorizeContractorId(req, lead.contractorId);
  if (denied) return NextResponse.json({ error: denied }, { status: 401 });

  try {
    const contractor = await contractorStore.getById(lead.contractorId);
    const ai = await generateLeadIntelligence(lead, contractor?.preferredLanguage ?? "en");
    await leadStore.attachAi(lead.id, ai);
    return NextResponse.json({ ok: true, ai });
  } catch (err) {
    if (err instanceof ModelGuardError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    const msg = err instanceof Error ? err.message : "AI generation failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
