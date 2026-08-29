import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import type { DIYProject } from "@/lib/southline-diy";
import { isOperator, pinFromRequest } from "@/lib/auth";

const DIY_FILE = path.join(process.cwd(), ".data", "diy-projects.json");

async function readProjects(): Promise<DIYProject[]> {
  try {
    return JSON.parse(await readFile(DIY_FILE, "utf-8"));
  } catch {
    return [];
  }
}

async function writeProjects(projects: DIYProject[]) {
  const dir = path.dirname(DIY_FILE);
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
  await writeFile(DIY_FILE, JSON.stringify(projects, null, 2), "utf-8");
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isOperator(pinFromRequest(req))) {
    return NextResponse.json({ error: "Operator PIN required" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();
  const projects = await readProjects();
  const idx = projects.findIndex((p) => p.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  projects[idx] = { ...projects[idx], ...body, id };
  await writeProjects(projects);
  return NextResponse.json({ ok: true, project: projects[idx] });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isOperator(pinFromRequest(req))) {
    return NextResponse.json({ error: "Operator PIN required" }, { status: 401 });
  }
  const { id } = await params;
  let projects = await readProjects();
  const before = projects.length;
  projects = projects.filter((p) => p.id !== id);
  if (projects.length === before) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await writeProjects(projects);
  return NextResponse.json({ ok: true });
}
