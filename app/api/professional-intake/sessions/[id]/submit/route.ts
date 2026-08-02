import { NextRequest, NextResponse } from "next/server";
import { intakeSessionStore, contractorStore } from "@/lib/store";
import { agentProfileStore } from "@/lib/agent-profiles/store";
import { loadAndAuthorizeSession } from "@/lib/professional-intake/auth";
import { missingRequiredQuestions, normalizeAnswers } from "@/lib/professional-intake/normalize";

/**
 * POST — marks a session completed. Never applies anything to the live
 * profile (see apply/route.ts) — this only closes out the questionnaire and
 * makes it eligible for operator review, matching the Objective's
 * "answers normalized → operator reviews → profile is published" flow.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await loadAndAuthorizeSession(req, id);
  if (!result.session) return NextResponse.json({ error: result.error }, { status: result.status });
  const { session } = result;

  if (session.status === "applied" || session.status === "archived") {
    return NextResponse.json({ error: "This intake session is no longer editable" }, { status: 409 });
  }

  const professionType =
    (typeof session.answers.professionType === "string" && session.answers.professionType) ||
    (session.ownerType === "contractor"
      ? (await contractorStore.getById(session.ownerId))?.professionType
      : (await agentProfileStore.getById(session.ownerId))?.professionType);

  const { answers, flaggedQuestionIds } = normalizeAnswers(session.ownerType, professionType, session.answers);
  const missing = missingRequiredQuestions(session.ownerType, professionType, answers);
  if (missing.length > 0) {
    return NextResponse.json({ error: "Missing required answers", missing }, { status: 400 });
  }

  const updated = await intakeSessionStore.update(id, {
    answers,
    flaggedQuestionIds,
    status: "completed",
    submittedAt: new Date().toISOString(),
  });
  return NextResponse.json({ ok: true, session: updated });
}
