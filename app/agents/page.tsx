import { cookies } from "next/headers";
import Link from "next/link";
import { agentProfileStore } from "@/lib/agent-profiles/store";
import { publicAgentProfile } from "@/lib/agent-profiles/auth";
import { agentProfessionTypeLabel, professionPlaceholderPhotoFor } from "@/lib/profession-types";
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
              <article key={agent.id} className="overflow-hidden rounded-2xl border border-walnut/15 bg-cream shadow-sm">
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={agent.photoUrl || professionPlaceholderPhotoFor(agent.id, agent.professionType)}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-obsidian/80 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.15em] text-cream">
                    {agentProfessionTypeLabel(agent.professionType, lang)}
                  </span>
                </div>
                <div className="p-5">
                  <h2 className="font-display text-xl text-obsidian">{agent.name}</h2>
                  {agent.brokerageName && <p className="mt-1 text-sm text-[#6A5F55]">{agent.brokerageName}</p>}
                  {agent.serviceArea && <p className="mt-1 text-xs text-[#6F552A]">{agent.serviceArea}</p>}
                  <Link href={`/agents/${agent.slug}`} className="mt-4 inline-flex min-h-[44px] items-center rounded-xl border border-walnut/25 px-4 py-2 text-sm font-semibold text-obsidian focus:outline-none focus-visible:ring-2 focus-visible:ring-gold">
                    {t("viewProfile", lang)}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
      <Footer lang={lang} />
    </>
  );
}
