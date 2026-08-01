import { NextRequest, NextResponse } from "next/server";
import { agentProfileStore } from "@/lib/agent-profiles/store";
import { isOperator, pinFromRequest } from "@/lib/agent-profiles/auth";
import { isReservedIdentifier, isValidUsernameFormat } from "@/lib/agent-profiles/identity";

/**
 * GET /api/agent-profiles/check?username=&slug=&email=&excludeId=
 * Operator-only. Live-validation for the New/Edit Agent form (Phase 3).
 * `excludeId` lets the Edit page check a value against every OTHER profile.
 */
export async function GET(req: NextRequest) {
  if (!isOperator(pinFromRequest(req))) {
    return NextResponse.json({ error: "Operator PIN required" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const username = searchParams.get("username")?.trim().toLowerCase() || null;
  const slug = searchParams.get("slug")?.trim().toLowerCase() || null;
  const email = searchParams.get("email")?.trim().toLowerCase() || null;
  const excludeId = searchParams.get("excludeId") || null;

  const result: Record<string, { available: boolean; reason?: string }> = {};

  if (username !== null) {
    if (!isValidUsernameFormat(username)) {
      result.username = { available: false, reason: "Use lowercase letters, numbers, and hyphens only" };
    } else if (isReservedIdentifier(username)) {
      result.username = { available: false, reason: "That username is reserved" };
    } else {
      const existing = await agentProfileStore.getByUsername(username);
      result.username = { available: !existing || existing.id === excludeId };
      if (!result.username.available) result.username.reason = "Username already in use";
    }
  }

  if (slug !== null) {
    if (isReservedIdentifier(slug)) {
      result.slug = { available: false, reason: "That slug is reserved" };
    } else {
      const existing = await agentProfileStore.getBySlug(slug);
      result.slug = { available: !existing || existing.id === excludeId };
      if (!result.slug.available) result.slug.reason = "Slug already in use";
    }
  }

  if (email !== null) {
    const all = await agentProfileStore.list();
    const existing = all.find((p) => p.email.toLowerCase() === email);
    result.email = { available: !existing || existing.id === excludeId };
    if (!result.email.available) result.email.reason = "Email already in use";
  }

  return NextResponse.json(result);
}
