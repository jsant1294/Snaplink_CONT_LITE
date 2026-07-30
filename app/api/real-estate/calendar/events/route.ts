import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { realEstateAppointments, realEstateOpenHouses, realEstateReminders, realEstateShowings, realEstateTasks } from "@/lib/db/schema";
import { isAgentScope } from "@/lib/real-estate/access";
import { authorizeRealEstate } from "@/lib/real-estate/auth";
import { db } from "@/lib/real-estate/repositories";
export async function GET(req: NextRequest) {
  const p = await authorizeRealEstate(req, "dashboard:view"); if (!p) return NextResponse.json({ error: "Access denied" }, { status: 403 }); const a = isAgentScope(p) ? p.agentId : undefined;
  const [appointments, showings, houses, reminders, tasks] = await Promise.all([
    db().select().from(realEstateAppointments).where(and(eq(realEstateAppointments.tenantId, p.tenantId), isNull(realEstateAppointments.deletedAt), a ? eq(realEstateAppointments.assignedAgentId, a) : undefined)),
    db().select().from(realEstateShowings).where(and(eq(realEstateShowings.tenantId, p.tenantId), isNull(realEstateShowings.deletedAt), a ? eq(realEstateShowings.assignedAgentId, a) : undefined)),
    db().select().from(realEstateOpenHouses).where(and(eq(realEstateOpenHouses.tenantId, p.tenantId), isNull(realEstateOpenHouses.deletedAt), a ? eq(realEstateOpenHouses.assignedAgentId, a) : undefined)),
    db().select().from(realEstateReminders).where(and(eq(realEstateReminders.tenantId, p.tenantId), isNull(realEstateReminders.deletedAt), a ? eq(realEstateReminders.assignedAgentId, a) : undefined)),
    db().select().from(realEstateTasks).where(and(eq(realEstateTasks.tenantId, p.tenantId), isNull(realEstateTasks.deletedAt), a ? eq(realEstateTasks.assignedAgentId, a) : undefined)),
  ]);
  return NextResponse.json({ events: [...appointments.map(x => ({ id: x.id, type: "appointment", title: x.title, startsAt: x.startsAt, endsAt: x.endsAt })), ...showings.map(x => ({ id: x.id, type: "showing", title: "Property showing", startsAt: x.requestedAt })), ...houses.map(x => ({ id: x.id, type: "open_house", title: "Open house", startsAt: x.startsAt, endsAt: x.endsAt })), ...reminders.map(x => ({ id: x.id, type: "reminder", title: x.title, startsAt: x.remindAt })), ...tasks.filter(x => x.dueAt).map(x => ({ id: x.id, type: "task", title: x.title, startsAt: x.dueAt }))] });
}
