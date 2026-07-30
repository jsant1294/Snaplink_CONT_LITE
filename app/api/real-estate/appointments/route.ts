import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq, isNull } from "drizzle-orm";
import { realEstateAppointments } from "@/lib/db/schema";
import { isAgentScope } from "@/lib/real-estate/access";
import { authorizeRealEstate } from "@/lib/real-estate/auth";
import { db } from "@/lib/real-estate/repositories";
const id = () => `re_appointment_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
export async function GET(req: NextRequest) { const p = await authorizeRealEstate(req, "clients:view"); if (!p) return NextResponse.json({ error: "Access denied" }, { status: 403 }); return NextResponse.json({ appointments: await db().select().from(realEstateAppointments).where(and(eq(realEstateAppointments.tenantId, p.tenantId), isNull(realEstateAppointments.deletedAt), isAgentScope(p) ? eq(realEstateAppointments.assignedAgentId, p.agentId) : undefined)).orderBy(asc(realEstateAppointments.startsAt)) }); }
export async function POST(req: NextRequest) { const p = await authorizeRealEstate(req, "clients:manage"); if (!p) return NextResponse.json({ error: "Access denied" }, { status: 403 }); const body = await req.json(); if (!body.title || !body.startsAt || !body.appointmentType) return NextResponse.json({ error: "Title, type, and start are required" }, { status: 400 }); const appointment = (await db().insert(realEstateAppointments).values({ id: id(), tenantId: p.tenantId, assignedAgentId: isAgentScope(p) ? p.agentId : body.assignedAgentId || null, leadId: body.leadId || null, appointmentType: body.appointmentType, title: body.title, startsAt: body.startsAt, endsAt: body.endsAt || null, notes: body.notes || "" }).returning())[0]; return NextResponse.json({ appointment }, { status: 201 }); }
