import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { contractorStore } from "@/lib/store";
import type { DIYProject } from "@/lib/southline-diy";

async function readProjects(): Promise<DIYProject[]> {
  try {
    return JSON.parse(await readFile(path.join(process.cwd(), ".data", "diy-projects.json"), "utf-8"));
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim().toLowerCase();
  if (!q || q.length < 2) {
    return NextResponse.json({ projects: [], contractors: [] });
  }

  const [projects, contractors] = await Promise.all([
    readProjects(),
    contractorStore.list().catch(() => [] as any[]),
  ]);

  const matchedProjects = projects.filter(
    (p) =>
      p.titleEs.toLowerCase().includes(q) ||
      p.titleEn.toLowerCase().includes(q) ||
      p.descEs.toLowerCase().includes(q) ||
      p.descEn.toLowerCase().includes(q)
  );

  const matchedContractors = contractors.filter(
    (c: any) =>
      (c.businessName ?? "").toLowerCase().includes(q) ||
      (c.tagline ?? "").toLowerCase().includes(q) ||
      (c.serviceArea ?? "").toLowerCase().includes(q) ||
      (c.services ?? []).some((s: string) => s.toLowerCase().includes(q))
  );

  return NextResponse.json({
    projects: matchedProjects.map((p) => ({
      id: p.id,
      slug: p.slug,
      titleEs: p.titleEs,
      titleEn: p.titleEn,
      difficulty: p.difficulty,
    })),
    contractors: matchedContractors.map((c: any) => ({
      id: c.id,
      username: c.username,
      businessName: c.businessName,
      serviceArea: c.serviceArea,
    })),
  });
}
