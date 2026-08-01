import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { agentProfileStore } from "@/lib/agent-profiles/store";
import { publicAgentProfile } from "@/lib/agent-profiles/auth";
import type { Lang } from "@/lib/southline-i18n";
import AgentProfilePublicPage from "@/components/agent-profiles/AgentProfilePublicPage";

export const dynamic = "force-dynamic";

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
