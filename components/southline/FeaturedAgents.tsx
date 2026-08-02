import { t, type Lang } from "@/lib/southline-i18n";
import type { AgentProfile } from "@/lib/agent-profiles/types";

export default function FeaturedAgents({
  agents,
  lang,
}: {
  agents: Omit<AgentProfile, "pin">[];
  lang: Lang;
}) {
  if (!agents.length) return null;

  return (
    <section id="agents" className="bg-page py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.35em] text-accent-gold">
            {t("featuredAgentsEyebrow", lang)}
          </p>
          <h2 className="mb-3 font-display text-3xl leading-tight text-primary sm:text-4xl">
            {t("featuredAgentsTitle", lang)}
          </h2>
          <p className="text-sm text-primary/75">{t("featuredAgentsSubtitle", lang)}</p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {agents.map((agent) => (
            <div key={agent.id} className="marketplace-card transition-shadow hover:shadow-md">
              <div className="marketplace-card-body">
                <div className="mb-3 flex items-start gap-3">
                  {agent.photoUrl && (
                    <img src={agent.photoUrl} alt={agent.name} className="h-12 w-12 shrink-0 rounded-full object-cover object-[center_20%]" />
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-display text-xl text-primary">{agent.name}</h3>
                    {agent.brokerageName && <p className="mt-1 truncate text-sm text-text-muted">{agent.brokerageName}</p>}
                  </div>
                </div>

                {agent.serviceArea && (
                  <div className="mb-3 flex items-center gap-1.5 text-xs text-text-muted">
                    <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{agent.serviceArea}</span>
                  </div>
                )}

                {agent.specialties.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-1.5">
                    {agent.specialties.slice(0, 4).map((s) => (
                      <span key={s} className="marketplace-chip">{s}</span>
                    ))}
                    {agent.specialties.length > 4 && (
                      <span className="px-1 py-1 text-xs text-text-muted/60">+{agent.specialties.length - 4}</span>
                    )}
                  </div>
                )}

                {agent.languages.length > 0 && (
                  <p className="mb-3 text-xs font-medium text-secondary">{agent.languages.join(", ")}</p>
                )}
              </div>

              <div className="flex gap-2 border-t border-border-default p-4 sm:p-5">
                <a href={`/agents/${agent.slug}`} className="flex-1 rounded-xl border border-border-default py-2 text-center text-sm font-medium text-text-muted transition-colors hover:bg-surface/20">
                  {t("viewProfile", lang)}
                </a>
                <a href={`/agents/${agent.slug}`} className="flex-1 rounded-xl bg-accent-dark py-2 text-center text-sm font-medium text-on-dark transition-colors hover:bg-accent-dark/90">
                  {t("contactAgent", lang)}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
