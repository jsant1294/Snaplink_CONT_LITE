import { NextRequest, NextResponse } from "next/server";
import { intakeSessionStore, contractorStore } from "@/lib/store";
import { agentProfileStore } from "@/lib/agent-profiles/store";
import { isOperatorRequest } from "@/lib/professional-intake/auth";
import { intakeAssetCompleteness, intakeSessionFilter } from "@/lib/professional-intake/operator";
import type { IntakeOwnerType } from "@/lib/professional-intake/types";

const FILTERS = ["all", "new", "in_progress", "needs_assets", "ready", "completed"] as const;
type Filter = (typeof FILTERS)[number];

const FILTER_LABEL: Record<Filter, string> = {
  all: "All",
  new: "New",
  in_progress: "In Progress",
  needs_assets: "Needs Assets",
  ready: "Ready",
  completed: "Completed",
};

export async function GET(req: NextRequest) {
  if (!isOperatorRequest(req)) {
    return NextResponse.json({ error: "Operator authorization required" }, { status: 401 });
  }

  const requested = req.nextUrl.searchParams.get("status") ?? "all";
  const filter: Filter = FILTERS.includes(requested as Filter) ? (requested as Filter) : "all";
  const ownerType = (req.nextUrl.searchParams.get("ownerType") ?? "") as IntakeOwnerType | "";
  const onlyNeedsAssets = req.nextUrl.searchParams.get("onlyNeedsAssets") === "true";

  const sessions = await intakeSessionStore.listAll();

  const contractorOwnerIds = sessions.filter((s) => s.ownerType === "contractor").map((s) => s.ownerId);
  const agentOwnerIds = sessions.filter((s) => s.ownerType === "agent").map((s) => s.ownerId);

  const ownerNames = new Map<string, string>();
  if (contractorOwnerIds.length) {
    const cs = await Promise.all(contractorOwnerIds.map((id) => contractorStore.getById(id)));
    contractorOwnerIds.forEach((id, i) => {
      const c = cs[i];
      if (c) ownerNames.set(`contractor:${id}`, c.businessName || c.username);
    });
  }
  if (agentOwnerIds.length) {
    const as = await Promise.all(agentOwnerIds.map((id) => agentProfileStore.getById(id)));
    agentOwnerIds.forEach((id, i) => {
      const a = as[i];
      if (a) ownerNames.set(`agent:${id}`, a.displayName || a.name || a.slug);
    });
  }

  const rows = sessions.map((s) => {
    const { needsAssets } = intakeAssetCompleteness(s);
    return {
      id: s.id,
      ownerType: s.ownerType,
      ownerId: s.ownerId,
      ownerName: ownerNames.get(`${s.ownerType}:${s.ownerId}`) ?? null,
      status: s.status,
      filter: intakeSessionFilter(s),
      needsAssets,
      currentStep: s.currentStep,
      submittedAt: s.submittedAt ?? null,
      appliedAt: s.appliedAt ?? null,
      contentApprovedAt: s.contentApprovedAt ?? null,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    };
  });

  const filtered = rows.filter((r) => {
    if (ownerType && r.ownerType !== ownerType) return false;
    if (onlyNeedsAssets && !r.needsAssets) return false;
    if (filter === "all") return true;
    return r.filter === FILTER_LABEL[filter];
  });

  return NextResponse.json({ ok: true, sessions: filtered, available: FILTERS });
}
