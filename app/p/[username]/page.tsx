import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { agentProfileStore } from "@/lib/agent-profiles/store";
import { publicAgentProfile } from "@/lib/agent-profiles/auth";
import type { Lang } from "@/lib/southline-i18n";
import AgentProfilePublicPage from "@/components/agent-profiles/AgentProfilePublicPage";

export const dynamic = "force-dynamic";

function isVisible(profile: { status: string; snaplinkStatus: string } | undefined | null): boolean {
  return Boolean(
    profile &&
      profile.status !== "archived" &&
      profile.status !== "suspended" &&
      profile.snaplinkStatus === "published"
  );
}

// generateMetadata resolves before the page body starts streaming, so a
// notFound() called here still lands as a real 404 status. The page's own
// notFound() below cannot: the root layout's cookies() call makes the whole
// app dynamic, and Next.js has already flushed a 200 shell by the time this
// nested segment resolves. This was a pre-existing, systemic quirk (verified
// against a production build to affect this app broadly, not just this
// route) — fixing it here, not by touching the root layout.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const profile = await agentProfileStore.getByUsername(username.toLowerCase());
  if (!isVisible(profile)) notFound();
  return { title: profile!.name };
}

/**
 * SnapLink's own client-owned asset — deliberately NOT wrapped in Southline's
 * Header/Footer (see docs/architecture/AGENT_MANAGEMENT.md: "SnapLink never
 * depends on Southline"). Gated on snaplinkStatus, independent of whether the
 * Southline discovery listing (/agents/{slug}) is published.
 */
export default async function SnaplinkProfileRoute({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const cookieStore = await cookies();
  const lang = (cookieStore.get("sl_lang")?.value ?? "en") as Lang;
  const profile = await agentProfileStore.getByUsername(username.toLowerCase());
  if (!profile || profile.status === "archived" || profile.status === "suspended" || profile.snaplinkStatus !== "published") notFound();

  return (
    <div className="min-h-screen bg-[#EEE7DA] py-6">
      <AgentProfilePublicPage profile={publicAgentProfile(profile)} lang={lang} variant="snaplink" />
    </div>
  );
}
