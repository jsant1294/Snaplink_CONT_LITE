import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), ".data");
const NEWSLETTER_FILE = path.join(DATA_DIR, "newsletter-subscribers.json");

interface Subscriber {
  email: string;
  lang: string;
  subscribedAt: string;
}

async function readSubs(): Promise<Subscriber[]> {
  try {
    return JSON.parse(await readFile(NEWSLETTER_FILE, "utf-8"));
  } catch {
    return [];
  }
}

async function writeSubs(subs: Subscriber[]) {
  if (!existsSync(DATA_DIR)) await mkdir(DATA_DIR, { recursive: true });
  await writeFile(NEWSLETTER_FILE, JSON.stringify(subs, null, 2), "utf-8");
}

export async function POST(req: NextRequest) {
  try {
    const { email, lang } = await req.json();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }
    const subs = await readSubs();
    if (subs.some((s) => s.email === email)) {
      return NextResponse.json({ ok: true, note: "Already subscribed" });
    }
    subs.push({ email: String(email), lang: String(lang ?? "es"), subscribedAt: new Date().toISOString() });
    await writeSubs(subs);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Newsletter error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
