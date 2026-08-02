import { cookies } from "next/headers";
import Link from "next/link";
import { agentProfileStore } from "@/lib/agent-profiles/store";
import { publicAgentProfile } from "@/lib/agent-profiles/auth";
import { agentProfessionTypeLabel } from "@/lib/profession-types";
import { t, type Lang } from "@/lib/southline-i18n";
import Header from "@/components/southline/Header";
import Footer from "@/components/southline/Footer";

export const dynamic = "force-dynamic";

export default async function AgentsDirectoryPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("sl_lang")?.value ?? "en") as Lang;
  const profiles = (await agentProfileStore.listActive())
    .filter((p) => p.southlineStatus === "published" || p.southlineStatus === "featured")
    .map(publicAgentProfile);

  return (
    <>
      <Header lang={lang} />
      <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-[#6F552A]">
          {t("professionalDirectoryEyebrow", lang)}
        </p>
        <h1 className="mt-3 font-display text-3xl leading-tight text-[#2F2923] sm:text-4xl">
          {t("professionalDirectoryTitle", lang)}
        </h1>
        {profiles.length === 0 ? (
          <p className="mt-6 text-sm text-[#62584F]">{t("agentsDirectoryEmpty", lang)}</p>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {profiles.map((agent) => (
              <article key={agent.id} className="rounded-2xl border border-walnut/15 bg-cream p-5 shadow-sm">
                <p className="inline-block rounded-full border border-walnut/20 bg-sand/25 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.15em] text-[#6F552A]">
                  {agentProfessionTypeLabel(agent.professionType, lang)}
                </p>
                <h2 className="mt-2 font-display text-xl text-obsidian">{agent.name}</h2>
                {agent.brokerageName && <p className="mt-1 text-sm text-[#6A5F55]">{agent.brokerageName}</p>}
                {agent.serviceArea && <p className="mt-1 text-xs text-[#6F552A]">{agent.serviceArea}</p>}
                <Link href={`/agents/${agent.slug}`} className="mt-4 inline-flex rounded-xl border border-walnut/25 px-4 py-2 text-sm font-semibold text-obsidian">
                  {t("viewProfile", lang)}
                </Link>
              </article>
            ))}
          </div>
        )}
      </main>
      <Footer lang={lang} />
    </>
  );
}
