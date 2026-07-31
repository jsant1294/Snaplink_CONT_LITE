import { t, type Lang } from "@/lib/southline-i18n";

export default function AgentRecruitmentSection({ lang }: { lang: Lang }) {
  return (
    <section className="border-y border-gold/25 bg-obsidian py-14 sm:py-20">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.35em] text-gold">
          {t("featuredAgentsEyebrow", lang)}
        </p>
        <h2 className="mb-4 font-display text-3xl leading-tight text-cream sm:text-5xl">
          {t("agentRecruitmentHeadline", lang)}
        </h2>
        <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-cream/75 sm:text-lg">
          {t("agentRecruitmentSubcopy", lang)}
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a href="/agents/get-started" className="w-full rounded-xl bg-gold px-7 py-3 font-semibold text-obsidian transition-colors hover:bg-gold/90 sm:w-auto">
            {t("createAgentProfile", lang)}
          </a>
          <a href="/agents/get-started" className="w-full rounded-xl border border-gold/60 px-7 py-3 font-medium text-gold transition-colors hover:bg-cream/5 sm:w-auto">
            {t("claimAgentProfile", lang)}
          </a>
          <a href="/agents/get-started" className="w-full rounded-xl border border-cream/20 px-7 py-3 font-medium text-cream transition-colors hover:border-gold/60 sm:w-auto">
            {t("requestAgentDemo", lang)}
          </a>
          <a href="/agents/get-started#plans" className="w-full rounded-xl border border-cream/20 px-7 py-3 font-medium text-cream transition-colors hover:border-gold/60 sm:w-auto">
            {t("viewAgentPlans", lang)}
          </a>
        </div>
      </div>
    </section>
  );
}
