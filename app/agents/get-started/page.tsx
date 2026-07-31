import { cookies } from "next/headers";
import { t, type Lang } from "@/lib/southline-i18n";
import Header from "@/components/southline/Header";
import Footer from "@/components/southline/Footer";
import AgentRequestForm from "@/components/agent-profiles/AgentRequestForm";

export const dynamic = "force-dynamic";

const TIERS: { key: string; features: string[] }[] = [
  { key: "basic", features: ["Public profile", "Contact information", "Service areas", "Limited listings", "Shareable link"] },
  { key: "professional", features: ["Enhanced profile", "Featured listings", "Reviews", "Video", "Lead capture", "Booking", "Analytics", "Custom branding"] },
  { key: "featured", features: ["Priority placement", "Homepage exposure", "Community-page placement", "Featured agent badge", "Sponsored content opportunities", "Expanded analytics"] },
];

export default async function AgentGetStartedPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("sl_lang")?.value ?? "en") as Lang;

  return (
    <>
      <Header lang={lang} />
      <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-[#6F552A]">{t("featuredAgentsEyebrow", lang)}</p>
        <h1 className="mt-3 font-display text-3xl leading-tight text-[#2F2923] sm:text-4xl">{t("agentRequestFormTitle", lang)}</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#62584F]">{t("agentRecruitmentSubcopy", lang)}</p>
        <div className="mt-8 max-w-md">
          <AgentRequestForm lang={lang} />
        </div>

        <section id="plans" className="mt-16 scroll-mt-24">
          <h2 className="font-display text-2xl text-[#2F2923]">{t("viewAgentPlans", lang)}</h2>
          <p className="mt-2 text-sm text-[#62584F]">
            {lang === "es" ? "Pricing se confirma con un operador al activar tu perfil." : "Pricing is confirmed with an operator when your profile is activated."}
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {TIERS.map((tier) => (
              <div key={tier.key} className="rounded-2xl border border-walnut/15 bg-cream p-5">
                <h3 className="font-display text-lg capitalize text-obsidian">{tier.key}</h3>
                <ul className="mt-3 space-y-1.5 text-xs text-[#62584F]">
                  {tier.features.map((f) => <li key={f}>• {f}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer lang={lang} />
    </>
  );
}
