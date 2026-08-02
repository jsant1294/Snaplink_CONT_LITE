import { NextRequest, NextResponse } from "next/server";
import { intakeSessionStore, contractorStore } from "@/lib/store";
import { agentProfileStore } from "@/lib/agent-profiles/store";
import { loadAndAuthorizeSession } from "@/lib/professional-intake/auth";
import { normalizeAnswers } from "@/lib/professional-intake/normalize";
import { getQuestionsFor } from "@/lib/professional-intake/questions";

async function ownerProfessionType(ownerType: "contractor" | "agent", ownerId: string): Promise<string | undefined> {
  if (ownerType === "contractor") return (await contractorStore.getById(ownerId))?.professionType;
  return (await agentProfileStore.getById(ownerId))?.professionType;
}

/** GET — load a session plus the exact question set for its owner's current profession answer (or the owner's existing professionType before Q1 is answered). */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await loadAndAuthorizeSession(req, id);
  if (!result.session) return NextResponse.json({ error: result.error }, { status: result.status });
  const { session } = result;

  const professionType =
    (typeof session.answers.professionType === "string" && session.answers.professionType) ||
    (await ownerProfessionType(session.ownerType, session.ownerId));
  const questions = getQuestionsFor(session.ownerType, professionType);

  return NextResponse.json({ ok: true, session, questions });
}

/**
 * PATCH { answers?, currentStep?, locale? } — autosave. Merges into existing
 * answers (never replaces the whole bag) and re-normalizes on every save,
 * same as the SnapLink source's 2s-debounced autosave endpoint.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await loadAndAuthorizeSession(req, id);
  if (!result.session) return NextResponse.json({ error: result.error }, { status: result.status });
  const { session } = result;

  if (session.status === "applied" || session.status === "archived") {
    return NextResponse.json({ error: "This intake session is no longer editable" }, { status: 409 });
  }

  const body = await req.json();
  const merged = { ...session.answers, ...(typeof body.answers === "object" && body.answers ? body.answers : {}) };
  const professionType =
    (typeof merged.professionType === "string" && merged.professionType) ||
    (await ownerProfessionType(session.ownerType, session.ownerId));
  const { answers, flaggedQuestionIds } = normalizeAnswers(session.ownerType, professionType, merged);

  const currentStep = Number.isFinite(body.currentStep) ? Math.min(Math.max(1, Math.floor(body.currentStep)), 20) : session.currentStep;
  const locale = body.locale === "es" ? "es" : body.locale === "en" ? "en" : session.locale;
  const status = session.status === "not_started" ? "in_progress" : session.status;

  const updated = await intakeSessionStore.update(id, { answers, flaggedQuestionIds, currentStep, locale, status });
  return NextResponse.json({ ok: true, session: updated });
}
