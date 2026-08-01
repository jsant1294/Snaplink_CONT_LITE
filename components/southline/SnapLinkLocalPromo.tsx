"use client";

import { useMemo } from "react";
import { t, type Lang } from "@/lib/southline-i18n";
import {
  buildCrossPromoUrl,
  CROSS_PROMO_EVENT,
  CROSS_PROMO_PLACEMENT,
  DEFAULT_LOCAL_PROMO_CATEGORIES,
  getOrCreateLocalDiscoverySessionId,
  readApprovedUtmParams,
  type ApprovedUtmParams,
  type CrossPromoCategory,
  type CrossPromoClickEventPayload,
} from "@/lib/southline-local-discovery";

// Deterministic outbound hand-off: calls the optional hook AND fires a
// window-level `snaplink_cross_promo_click` CustomEvent carrying only aggregated
// fields — never the visitor's identity, IP, or ZIP. Analytics failures must
// never block navigation, so every step here is wrapped defensively.
function emitCrossPromo(payload: CrossPromoClickEventPayload, onExplore?: (p: CrossPromoClickEventPayload) => void) {
  try {
    onExplore?.(payload);
  } catch {
    // never block navigation on a consumer's analytics handler
  }
  try {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent<CrossPromoClickEventPayload>(CROSS_PROMO_EVENT, { detail: payload }));
    }
  } catch {
    // never block navigation on analytics dispatch
  }
}

export default function SnapLinkLocalPromo({
  lang,
  categories = DEFAULT_LOCAL_PROMO_CATEGORIES,
  onExplore,
}: {
  lang: Lang;
  categories?: CrossPromoCategory[];
  onExplore?: (payload: CrossPromoClickEventPayload) => void;
}) {
  const inbound = useMemo(
    () => (typeof window === "undefined" ? {} : readApprovedUtmParams(window.location.search)),
    []
  );

  // Opens in a new tab so the visitor keeps their place in the Southline
  // homeowner journey while SnapLink Local opens alongside.
  const handOffProps = { target: "_blank", rel: "noopener noreferrer" } as const;

  function track(chipId: string | null, category: string | null) {
    emitCrossPromo(
      {
        locale: lang,
        chipId,
        category,
        destination: "snaplink",
        source: "southline",
        placement: CROSS_PROMO_PLACEMENT,
        timestamp: new Date().toISOString(),
        sessionId: getOrCreateLocalDiscoverySessionId(),
        utm: inbound,
      },
      onExplore
    );
  }

  return (
    <section aria-labelledby="snaplink-local-promo-title" className="border-b border-walnut/15 bg-cream">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-walnut/15 bg-ivory px-3.5 py-1.5">
            <span aria-hidden="true" className="flex h-5 w-5 items-center justify-center rounded-md bg-gold text-[10px] font-bold text-obsidian">
              S
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.35em] text-gold">{t("localPromoEyebrow", lang)}</span>
          </span>
          <h2 id="snaplink-local-promo-title" className="mt-4 font-display text-3xl leading-tight text-obsidian sm:text-4xl">
            {t("localPromoTitle", lang)}
          </h2>
          <p className="mt-3 text-clay">{t("localPromoBody", lang)}</p>
        </div>

        {categories.length > 0 && (
          <div className="mx-auto mt-8 flex max-w-4xl flex-wrap justify-center gap-2.5">
            {categories.map((chip) => (
              <a
                key={chip.id}
                href={buildCrossPromoUrl(lang, inbound, chip.snaplinkCategory)}
                {...handOffProps}
                onClick={() => track(chip.id, chip.snaplinkCategory)}
                className="inline-flex items-center gap-2 rounded-full border border-walnut/15 bg-ivory px-4 py-2 text-sm font-medium text-obsidian transition-[transform,border-color,background-color] hover:-translate-y-0.5 hover:border-gold/60 hover:bg-cream focus:outline-none focus-visible:ring-2 focus-visible:ring-gold motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                <span aria-hidden="true">{chip.emoji}</span>
                {lang === "es" ? chip.labelEs : chip.labelEn}
              </a>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <a
            href={buildCrossPromoUrl(lang, inbound)}
            {...handOffProps}
            onClick={() => track(null, null)}
            className="inline-flex items-center gap-2 rounded-xl bg-gold px-6 py-3 text-sm font-semibold text-obsidian transition-colors hover:bg-gold/90 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-obsidian focus-visible:ring-offset-2 focus-visible:ring-offset-cream motion-reduce:transition-none motion-reduce:active:scale-100"
          >
            {t("localPromoCta", lang)}
            <span aria-hidden="true">→</span>
          </a>
        </div>

        <p className="mt-6 text-center text-xs uppercase tracking-[0.25em] text-clay">
          {t("localPromoPoweredBy", lang)}
        </p>
      </div>
    </section>
  );
}
