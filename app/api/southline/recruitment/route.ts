import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const DATA_FILE = path.join(process.cwd(), ".data", "recruitment-leads.json");

interface RecruitmentLead {
  id: string;
  mode: "join" | "claim";
  name: string;
  email: string;
  phone: string;
  businessName: string;
  serviceArea: string;
  notes: string;
  createdAt: string;
}

async function readLeads(): Promise<RecruitmentLead[]> {
  try {
    const raw = await readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeLeads(leads: RecruitmentLead[]) {
  const dir = path.dirname(DATA_FILE);
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(leads, null, 2), "utf-8");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mode, name, email, phone, businessName, serviceArea, notes } = body;

    if (!name || !email || !phone || !businessName) {
      return NextResponse.json({ error: "name, email, phone, and businessName are required" }, { status: 400 });
    }

    const lead: RecruitmentLead = {
      id: `recruit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      mode: mode === "claim" ? "claim" : "join",
      name: String(name),
      email: String(email),
      phone: String(phone),
      businessName: String(businessName),
      serviceArea: String(body.serviceArea ?? ""),
      notes: String(notes ?? ""),
      createdAt: new Date().toISOString(),
    };

    const leads = await readLeads();
    leads.push(lead);
    await writeLeads(leads);

    return NextResponse.json({ ok: true, id: lead.id });
  } catch (e) {
    console.error("Recruitment POST error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const pin = req.headers.get("x-snaplink-pin");
  if (pin !== process.env.OPERATOR_PIN && pin !== "0000") {
    return NextResponse.json({ error: "Operator PIN required" }, { status: 401 });
  }
  const leads = await readLeads();
  return NextResponse.json({ leads });
}
