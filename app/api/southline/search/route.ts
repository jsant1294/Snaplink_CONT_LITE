import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { contractorStore } from "@/lib/store";
import { agentProfileStore } from "@/lib/agent-profiles/store";
import { searchProfessionals } from "@/lib/southline-search";
import type { DIYProject } from "@/lib/southline-diy";
import { zipCentroidStore } from "@/lib/geo/store";
import { isUsZip, normalizeZip } from "@/lib/geo/zip";

async function readProjects(): Promise<DIYProject[]> {
  try {
    return JSON.parse(await readFile(path.join(process.cwd(), ".data", "diy-projects.json"), "utf-8"));
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const category = req.nextUrl.searchParams.get("category")?.trim() ?? "";
  const location = req.nextUrl.searchParams.get("location")?.trim() ?? "";
  if (q.length < 2 && !category && !location) {
    return NextResponse.json({ projects: [], contractors: [], agents: [] });
  }

  const [projects, contractors, agentProfiles] = await Promise.all([
    readProjects(),
    contractorStore.list().catch(() => [] as any[]),
    agentProfileStore.list().catch(() => [] as any[]),
  ]);

  // TRUE GEO v1: a valid 5-digit location is resolved to a centroid and used
  // for a real radius search. An unresolvable ZIP yields a hard empty result
  // (never a silent broadening) and is reported explicitly.
  let geo;
  let geoUnknownZip = false;
  if (isUsZip(location)) {
    const centroid = await zipCentroidStore.find(normalizeZip(location));
    if (centroid) {
      const serviceZips = [
        ...contractors.map((c) => c.serviceZip),
        ...agentProfiles.map((a) => a.serviceZip),
        centroid.zip,
      ];
      const centroids = await zipCentroidStore.listByZips(serviceZips);
      geo = {
        matchedZip: centroid.zip,
        centroid: { latitude: centroid.latitude, longitude: centroid.longitude },
        centroids,
      };
    } else {
      geoUnknownZip = true;
    }
  }

  const professionals = searchProfessionals(contractors, agentProfiles, { query: q, category, location, geo, geoUnknownZip });
  const agents = professionals.filter((p) => p.kind === "agent");
  const contractorResults = professionals.filter((p) => p.kind === "contractor");

  return NextResponse.json({
    projects: matchedProjects(q, projects).map((p) => ({
      id: p.id,
      slug: p.slug,
      titleEs: p.titleEs,
      titleEn: p.titleEn,
      difficulty: p.difficulty,
    })),
    contractors: contractorResults,
    agents,
    geo: {
      requested: Boolean(location),
      active: Boolean(geo) && !geoUnknownZip,
      matchedZip: geo?.matchedZip ?? null,
      unknownZip: geoUnknownZip,
    },
  });
}

function matchedProjects(q: string, projects: DIYProject[]) {
  return q
    ? projects.filter(
        (p) =>
          p.titleEs.toLowerCase().includes(q) ||
          p.titleEn.toLowerCase().includes(q) ||
          p.descEs.toLowerCase().includes(q) ||
          p.descEn.toLowerCase().includes(q)
      )
    : [];
}
