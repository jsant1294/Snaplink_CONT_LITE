import { NextRequest, NextResponse } from "next/server";
import { intakeSessionStore, contractorStore } from "@/lib/store";
import { agentProfileStore } from "@/lib/agent-profiles/store";
import { publicContractor } from "@/lib/auth";
import { publicAgentProfile } from "@/lib/agent-profiles/auth";
import { isOperatorRequest } from "@/lib/professional-intake/auth";
import { buildContractorPatch, buildAgentPatch } from "@/lib/professional-intake/profile-map";
import { buildReviewPreview } from "@/lib/professional-intake/apply";
import { generateProfileCopy } from "@/lib/professional-intake/generate-copy";

/**
 * GET — the review-before-apply preview. Operator-only: this is the
 * "operator reviews" step from the Objective, so unlike the fill-out routes
 * (create/autosave/submit) this never accepts the owning professional's own
 * PIN.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isOperatorRequest(req)) {
    return NextResponse.json({ error: "Operator PIN required" }, { status: 401 });
  }
  const { id } = await params;
  const session = await intakeSessionStore.get(id);
  if (!session) return NextResponse.json({ error: "Intake session not found" }, { status: 404 });

  let currentProfile: Record<string, unknown>;
  let displayName: string;
  let proposedPatch: Record<string, unknown>;

  if (session.ownerType === "contractor") {
    const contractor = await contractorStore.getById(session.ownerId);
    if (!contractor) return NextResponse.json({ error: "Contractor not found" }, { status: 404 });
    currentProfile = publicContractor(contractor) as unknown as Record<string, unknown>;
    displayName = contractor.businessName;
    proposedPatch = buildContractorPatch(session.answers) as Record<string, unknown>;
  } else {
    const agent = await agentProfileStore.getById(session.ownerId);
    if (!agent) return NextResponse.json({ error: "Agent profile not found" }, { status: 404 });
    currentProfile = publicAgentProfile(agent) as unknown as Record<string, unknown>;
    displayName = agent.displayName || agent.name;
    proposedPatch = buildAgentPatch(session.answers) as Record<string, unknown>;
  }

  const preview = buildReviewPreview(session.ownerType, currentProfile, proposedPatch);
  const generatedCopy = generateProfileCopy(displayName, session.answers, session.locale);

  return NextResponse.json({
    ok: true,
    session,
    preview,
    generatedCopy,
    flaggedQuestionIds: session.flaggedQuestionIds,
  });
}
