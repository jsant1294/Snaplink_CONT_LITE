import { NextRequest, NextResponse } from "next/server";
import { intakeSessionStore, contractorStore } from "@/lib/store";
import { agentProfileStore } from "@/lib/agent-profiles/store";
import { publicContractor } from "@/lib/auth";
import { publicAgentProfile } from "@/lib/agent-profiles/auth";
import { isOperatorRequest } from "@/lib/professional-intake/auth";
import { buildContractorPatch, buildAgentPatch } from "@/lib/professional-intake/profile-map";
import { resolveApplyPatch } from "@/lib/professional-intake/apply";
import type { ProfileApplyMode } from "@/lib/professional-intake/types";

const APPLY_MODES: ProfileApplyMode[] = ["fill_empty", "replace_selected", "replace_all"];

/**
 * POST { mode?, fields? } — writes the resolved patch onto the live
 * contractor/agent row. Operator-only, always (see Objective: "operator
 * reviews → profile is published" — filling out an intake never grants
 * write access to the live profile, even for the professional who filled it
 * out themselves). Default mode is "fill_empty": never overwrites a
 * non-empty existing field unless the operator explicitly asks to replace it.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isOperatorRequest(req)) {
    return NextResponse.json({ error: "Operator PIN required" }, { status: 401 });
  }
  const { id } = await params;
  const session = await intakeSessionStore.get(id);
  if (!session) return NextResponse.json({ error: "Intake session not found" }, { status: 404 });
  if (session.status !== "completed") {
    return NextResponse.json({ error: "Session must be completed before it can be applied" }, { status: 409 });
  }

  const body = await req.json().catch(() => ({}));
  const mode: ProfileApplyMode = APPLY_MODES.includes(body.mode) ? body.mode : "fill_empty";
  const fields: string[] | undefined = Array.isArray(body.fields) ? body.fields.filter((f: unknown) => typeof f === "string") : undefined;

  if (session.ownerType === "contractor") {
    const contractor = await contractorStore.getById(session.ownerId);
    if (!contractor) return NextResponse.json({ error: "Contractor not found" }, { status: 404 });
    const currentProfile = publicContractor(contractor) as unknown as Record<string, unknown>;
    const proposedPatch = buildContractorPatch(session.answers) as Record<string, unknown>;
    const finalPatch = resolveApplyPatch(mode, currentProfile, proposedPatch, fields);
    if (Object.keys(finalPatch).length === 0) {
      return NextResponse.json({ error: "Nothing to apply" }, { status: 400 });
    }
    const updated = await contractorStore.update(session.ownerId, finalPatch);
    if (!updated) return NextResponse.json({ error: "Contractor not found" }, { status: 404 });
    const sessionUpdated = await intakeSessionStore.update(id, { status: "applied", appliedAt: new Date().toISOString() });
    return NextResponse.json({ ok: true, appliedFields: Object.keys(finalPatch), contractor: publicContractor(updated), session: sessionUpdated });
  }

  const agent = await agentProfileStore.getById(session.ownerId);
  if (!agent) return NextResponse.json({ error: "Agent profile not found" }, { status: 404 });
  const currentProfile = publicAgentProfile(agent) as unknown as Record<string, unknown>;
  const proposedPatch = buildAgentPatch(session.answers) as Record<string, unknown>;
  const finalPatch = resolveApplyPatch(mode, currentProfile, proposedPatch, fields);
  if (Object.keys(finalPatch).length === 0) {
    return NextResponse.json({ error: "Nothing to apply" }, { status: 400 });
  }
  const updated = await agentProfileStore.update(session.ownerId, finalPatch);
  if (!updated) return NextResponse.json({ error: "Agent profile not found" }, { status: 404 });
  const sessionUpdated = await intakeSessionStore.update(id, { status: "applied", appliedAt: new Date().toISOString() });
  return NextResponse.json({ ok: true, appliedFields: Object.keys(finalPatch), profile: publicAgentProfile(updated), session: sessionUpdated });
}
