import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { agentProfileStore } from "@/lib/agent-profiles/store";
import { publicAgentProfile } from "@/lib/agent-profiles/auth";
import type { Lang } from "@/lib/southline-i18n";
import Header from "@/components/southline/Header";
import Footer from "@/components/southline/Footer";
import AgentProfilePublicPage from "@/components/agent-profiles/AgentProfilePublicPage";

export const dynamic = "force-dynamic";

export default async function AgentProfileRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const lang = (cookieStore.get("sl_lang")?.value ?? "en") as Lang;
  const profile = await agentProfileStore.getBySlug(slug);
  if (!profile || profile.status !== "active") notFound();

  return (
    <>
      <Header lang={lang} />
      <div className="bg-[#EEE7DA] py-6">
        <AgentProfilePublicPage profile={publicAgentProfile(profile)} lang={lang} />
      </div>
      <Footer lang={lang} />
    </>
  );
}
