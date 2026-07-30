import { NextRequest, NextResponse } from "next/server";
import { processJobBatch } from "@/lib/real-estate/jobs";
export async function POST(req: NextRequest) {
  const configured = process.env.REAL_ESTATE_JOB_PROCESSOR_SECRET, supplied = req.headers.get("authorization");
  if (!configured || supplied !== `Bearer ${configured}`) return NextResponse.json({ error: "Scheduler authorization required" }, { status: 401 });
  const limit = Math.min(25, Math.max(1, Number(req.nextUrl.searchParams.get("limit") || 10))), result = await processJobBatch(`worker_${crypto.randomUUID()}`, limit);
  return NextResponse.json(result);
}
