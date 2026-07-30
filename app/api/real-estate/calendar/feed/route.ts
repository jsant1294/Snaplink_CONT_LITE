import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { realEstateOpenHouses, realEstateReminders, realEstateShowings } from "@/lib/db/schema";
import { authorizeRealEstate } from "@/lib/real-estate/auth";
import { isAgentScope } from "@/lib/real-estate/access";
import { db } from "@/lib/real-estate/repositories";

const stamp = (value: string) => new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const safe = (value: string) => value.replace(/[\\,;]/g, "\\$&").replace(/\n/g, "\\n");
export async function GET(req: NextRequest) {
  const principal = await authorizeRealEstate(req, "dashboard:view");
  if (!principal) return NextResponse.json({ error: "Access denied" }, { status: 403 });
  const agent = isAgentScope(principal) ? principal.agentId : undefined;
  const [reminders, showings, houses] = await Promise.all([
    db().select().from(realEstateReminders).where(and(eq(realEstateReminders.tenantId, principal.tenantId), isNull(realEstateReminders.deletedAt), agent ? eq(realEstateReminders.assignedAgentId, agent) : undefined)),
    db().select().from(realEstateShowings).where(and(eq(realEstateShowings.tenantId, principal.tenantId), isNull(realEstateShowings.deletedAt), agent ? eq(realEstateShowings.assignedAgentId, agent) : undefined)),
    db().select().from(realEstateOpenHouses).where(and(eq(realEstateOpenHouses.tenantId, principal.tenantId), isNull(realEstateOpenHouses.deletedAt), agent ? eq(realEstateOpenHouses.assignedAgentId, agent) : undefined)),
  ]);
  const events = [
    ...reminders.map(item => `BEGIN:VEVENT\nUID:${item.id}@snaplink\nDTSTART:${stamp(item.remindAt)}\nDTEND:${stamp(new Date(new Date(item.remindAt).getTime() + 15 * 60000).toISOString())}\nSUMMARY:${safe(item.title)}\nEND:VEVENT`),
    ...showings.map(item => `BEGIN:VEVENT\nUID:${item.id}@snaplink\nDTSTART:${stamp(item.requestedAt)}\nDTEND:${stamp(new Date(new Date(item.requestedAt).getTime() + 60 * 60000).toISOString())}\nSUMMARY:Property showing\nEND:VEVENT`),
    ...houses.map(item => `BEGIN:VEVENT\nUID:${item.id}@snaplink\nDTSTART:${stamp(item.startsAt)}\nDTEND:${stamp(item.endsAt)}\nSUMMARY:Open house\nEND:VEVENT`),
  ];
  return new NextResponse(`BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//SnapLink//Real Estate//EN\n${events.join("\n")}\nEND:VCALENDAR`, { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": "attachment; filename=snaplink-real-estate.ics" } });
}
