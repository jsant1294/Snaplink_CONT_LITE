import { NextRequest, NextResponse } from "next/server";
import { intakeSessionStore, newId } from "@/lib/store";
import { authorizeIntakeOwner } from "@/lib/professional-intake/auth";
import type { IntakeOwnerType, IntakeSession } from "@/lib/professional-intake/types";

const OWNER_TYPES: IntakeOwnerType[] = ["contractor", "agent"];

/**
 * POST { ownerType, ownerId, locale? } — starts a new intake session, or
 * returns the existing active (not applied/archived) one for this owner.
 * Matches the SnapLink source's "single active session per profile" rule
 * (docs/professional-intake/00-*, item 6).
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const ownerType = body.ownerType as IntakeOwnerType;
  const ownerId = String(body.ownerId ?? "");
  if (!OWNER_TYPES.includes(ownerType) || !ownerId) {
    return NextResponse.json({ error: "ownerType (contractor|agent) and ownerId are required" }, { status: 400 });
  }

  const authError = await authorizeIntakeOwner(req, ownerType, ownerId);
  if (authError) return NextResponse.json({ error: authError }, { status: 401 });

  const existing = await intakeSessionStore.getActive(ownerType, ownerId);
  if (existing) return NextResponse.json({ ok: true, session: existing, resumed: true });

  const now = new Date().toISOString();
  const session: IntakeSession = {
    id: newId("intk"),
    ownerType,
    ownerId,
    status: "not_started",
    locale: body.locale === "es" ? "es" : "en",
    currentStep: 1,
    answers: {},
    flaggedQuestionIds: [],
    createdAt: now,
    updatedAt: now,
  };
  await intakeSessionStore.create(session);
  return NextResponse.json({ ok: true, session, resumed: false }, { status: 201 });
}
