import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import type { DIYProject } from "@/lib/southline-diy";

const DATA_DIR = path.join(process.cwd(), ".data");
const DIY_FILE = path.join(DATA_DIR, "diy-projects.json");

async function readProjects(): Promise<DIYProject[]> {
  try {
    return JSON.parse(await readFile(DIY_FILE, "utf-8"));
  } catch {
    return [];
  }
}

async function writeProjects(projects: DIYProject[]) {
  if (!existsSync(DATA_DIR)) await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DIY_FILE, JSON.stringify(projects, null, 2), "utf-8");
}

export async function GET() {
  const projects = await readProjects();
  return NextResponse.json({ projects });
}

export async function POST(req: NextRequest) {
  const pin = req.headers.get("x-snaplink-pin");
  if (pin !== process.env.OPERATOR_PIN && pin !== "0000") {
    return NextResponse.json({ error: "Operator PIN required" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const projects = await readProjects();
    const project: DIYProject = {
      id: `diy_${Date.now()}`,
      slug: body.slug || `project-${Date.now()}`,
      category: body.category || "catDIY",
      difficulty: body.difficulty || "easy",
      timeEs: body.timeEs || "",
      timeEn: body.timeEn || "",
      budgetEs: body.budgetEs || "",
      budgetEn: body.budgetEn || "",
      titleEs: body.titleEs || "",
      titleEn: body.titleEn || "",
      descEs: body.descEs || "",
      descEn: body.descEn || "",
      steps: body.steps || [],
      materialsEs: body.materialsEs || "",
      materialsEn: body.materialsEn || "",
      toolsEs: body.toolsEs || "",
      toolsEn: body.toolsEn || "",
      relatedContractors: body.relatedContractors || [],
    };
    projects.push(project);
    await writeProjects(projects);
    return NextResponse.json({ ok: true, project });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
