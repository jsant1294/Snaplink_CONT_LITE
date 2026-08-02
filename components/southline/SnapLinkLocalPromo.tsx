"use client";

import { useMemo, useState } from "react";
import { t, type Lang } from "@/lib/southline-i18n";
import { DEFAULT_SNAPLINK_PROMO, type SnapLinkPromoContent } from "@/lib/southline-types";
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

const FOCAL_CLASS: Record<SnapLinkPromoContent["focalPoint"], string> = {
  left: "object-left",
  center: "object-center",
  right: "object-right",
  bottom: "object-bottom",
};

const MOBILE_FOCAL_CLASS: Record<SnapLinkPromoContent["mobileFocalPoint"], string> = {
  top: "object-top",
  center: "object-center",
  bottom: "object-bottom",
};

// Tasteful, on-brand fallback when a configured image is missing or fails to
// load — the section must never collapse or show a broken-image icon.
function ImageFallback({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`bg-gradient-to-br from-accent-dark/25 via-accent-gold/15 to-page ${className ?? ""}`}
    />
  );
}

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

function Badge({ lang, tone, label }: { lang: Lang; tone: "onLight" | "onDark"; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 ${
        tone === "onLight" ? "border-border-default bg-surface" : "border-on-dark/25 bg-accent-dark/30 backdrop-blur-sm"
      }`}
    >
      <span aria-hidden="true" className="flex h-5 w-5 items-center justify-center rounded-md bg-accent-gold text-[10px] font-bold text-primary">
        S
      </span>
      <span className="text-xs font-semibold uppercase tracking-[0.35em] text-eyebrow">{label}</span>
    </span>
  );
}

function ChipRow({
  lang,
  categories,
  inbound,
  track,
  handOffProps,
  tone,
}: {
  lang: Lang;
  categories: CrossPromoCategory[];
  inbound: ApprovedUtmParams;
  track: (chipId: string | null, category: string | null) => void;
  handOffProps: { target: "_blank"; rel: "noopener noreferrer" };
  tone: "onLight" | "onDark";
}) {
  if (categories.length === 0) return null;
  const chipClass =
    tone === "onLight"
      ? "border-border-default bg-surface text-primary hover:border-accent-gold/60 hover:bg-page focus-visible:ring-accent-gold"
      : "border-on-dark/25 bg-accent-dark/30 text-on-dark backdrop-blur-sm hover:border-accent-gold/70 hover:bg-accent-dark/45 focus-visible:ring-on-dark";
  return (
    <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible">
      {categories.slice(0, 6).map((chip) => (
        <a
          key={chip.id}
          href={buildCrossPromoUrl(lang, inbound, chip.snaplinkCategory)}
          {...handOffProps}
          onClick={() => track(chip.id, chip.snaplinkCategory)}
          className={`inline-flex shrink-0 items-center rounded-full border px-4 py-2 text-sm font-medium transition-[transform,border-color,background-color] hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${chipClass}`}
        >
          {lang === "es" ? chip.labelEs : chip.labelEn}
        </a>
      ))}
    </div>
  );
}

const OVERLAY_CLASS: Record<SnapLinkPromoContent["overlayStrength"], Record<SnapLinkPromoContent["contentAlignment"], string>> = {
  none: { left: "", right: "" },
  light: {
    left: "bg-gradient-to-t from-image-overlay/45 via-image-overlay/10 to-transparent md:bg-gradient-to-r md:from-image-overlay/50 md:via-image-overlay/10 md:to-transparent",
    right: "bg-gradient-to-t from-image-overlay/45 via-image-overlay/10 to-transparent md:bg-gradient-to-l md:from-image-overlay/50 md:via-image-overlay/10 md:to-transparent",
  },
  medium: {
    left: "bg-gradient-to-t from-image-overlay/65 via-image-overlay/20 to-transparent md:bg-gradient-to-r md:from-image-overlay/70 md:via-image-overlay/25 md:to-transparent",
    right: "bg-gradient-to-t from-image-overlay/65 via-image-overlay/20 to-transparent md:bg-gradient-to-l md:from-image-overlay/70 md:via-image-overlay/25 md:to-transparent",
  },
  strong: {
    left: "bg-gradient-to-t from-image-overlay/80 via-image-overlay/35 to-transparent md:bg-gradient-to-r md:from-image-overlay/85 md:via-image-overlay/35 md:to-transparent",
    right: "bg-gradient-to-t from-image-overlay/80 via-image-overlay/35 to-transparent md:bg-gradient-to-l md:from-image-overlay/85 md:via-image-overlay/35 md:to-transparent",
  },
};

export default function SnapLinkLocalPromo({
  lang,
  content = DEFAULT_SNAPLINK_PROMO,
  categories = DEFAULT_LOCAL_PROMO_CATEGORIES,
  onExplore,
}: {
  lang: Lang;
  content?: SnapLinkPromoContent | null;
  categories?: CrossPromoCategory[];
  onExplore?: (payload: CrossPromoClickEventPayload) => void;
}) {
  const promo = content ?? DEFAULT_SNAPLINK_PROMO;
  const [desktopImageFailed, setDesktopImageFailed] = useState(false);
  const [mobileImageFailed, setMobileImageFailed] = useState(false);

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

  const alt = lang === "es" ? promo.imageAltEs : promo.imageAltEn;
  const desktopSrc = promo.desktopImageUrl || DEFAULT_SNAPLINK_PROMO.desktopImageUrl;
  const mobileSrc = promo.mobileImageUrl || desktopSrc;
  const showDesktopImage = Boolean(desktopSrc) && !desktopImageFailed;
  const showMobileImage = Boolean(mobileSrc) && !mobileImageFailed;
  const isFullBackground = promo.layout === "full-background";
  const tone: "onLight" | "onDark" = isFullBackground ? "onDark" : "onLight";

  // CMS copy overrides fall back to the i18n dictionary when unset — same
  // "empty means use the shipped default" contract as this section's image
  // fields, so existing settings rows render exactly as before this field
  // existed.
  const eyebrowText = (lang === "es" ? promo.eyebrowEs : promo.eyebrowEn) || t("localPromoEyebrow", lang);
  const titleText = (lang === "es" ? promo.titleEs : promo.titleEn) || t("localPromoTitle", lang);
  const bodyText = (lang === "es" ? promo.bodyEs : promo.bodyEn) || t("localPromoBody", lang);
  const ctaLabelText = (lang === "es" ? promo.ctaLabelEs : promo.ctaLabelEn) || t("localPromoCta", lang);
  const secondaryLineText = (lang === "es" ? promo.secondaryLineEs : promo.secondaryLineEn) || t("localPromoPoweredBy", lang);

  const eyebrowNode = promo.showBadge && <Badge lang={lang} tone={tone} label={eyebrowText} />;
  const titleNode = (
    <h2
      id="snaplink-local-promo-title"
      className={`southline-section-title mt-4 ${isFullBackground ? "!text-on-dark" : "text-primary"}`}
    >
      {titleText}
    </h2>
  );
  const bodyNode = (
    <p className={`southline-section-description ${isFullBackground ? "!text-on-dark/85" : "text-secondary"}`}>{bodyText}</p>
  );
  const chipsNode = promo.showChips && (
    <ChipRow lang={lang} categories={categories} inbound={inbound} track={track} handOffProps={handOffProps} tone={tone} />
  );
  const ctaNode = (
    <a
      href={buildCrossPromoUrl(lang, inbound)}
      {...handOffProps}
      onClick={() => track(null, null)}
      className="inline-flex items-center gap-2 rounded-xl bg-accent-gold px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-accent-gold/90 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-page motion-reduce:transition-none motion-reduce:active:scale-100"
    >
      {ctaLabelText}
      <span aria-hidden="true">→</span>
    </a>
  );
  const secondaryLineNode = promo.showSecondaryLine && (
    <p className={`mt-6 text-xs uppercase tracking-[0.25em] ${isFullBackground ? "text-on-dark/70" : "text-text-muted"}`}>
      {secondaryLineText}
    </p>
  );

  if (isFullBackground) {
    const overlayClass = OVERLAY_CLASS[promo.overlayStrength][promo.contentAlignment];
    return (
      <section aria-labelledby="snaplink-local-promo-title" className="relative overflow-hidden border-b border-border-default bg-accent-dark">
        <div className="absolute inset-0">
          {showDesktopImage ? (
            <img
              src={desktopSrc}
              alt={alt}
              onError={() => setDesktopImageFailed(true)}
              loading="lazy"
              className={`hidden h-full w-full object-cover sm:block ${FOCAL_CLASS[promo.focalPoint]}`}
            />
          ) : (
            <ImageFallback className="hidden h-full w-full sm:block" />
          )}
          {showMobileImage ? (
            <img
              src={mobileSrc}
              alt={alt}
              onError={() => setMobileImageFailed(true)}
              loading="lazy"
              className={`h-full w-full object-cover sm:hidden ${MOBILE_FOCAL_CLASS[promo.mobileFocalPoint]}`}
            />
          ) : (
            <ImageFallback className="h-full w-full sm:hidden" />
          )}
          {overlayClass && <div className={`absolute inset-0 ${overlayClass}`} />}
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <div className={`max-w-xl ${promo.contentAlignment === "right" ? "ml-auto text-right" : "text-left"}`}>
            {eyebrowNode}
            {titleNode}
            {bodyNode}
            <div className={`mt-8 ${promo.contentAlignment === "right" ? "flex flex-col items-end gap-6" : "space-y-6"}`}>
              {chipsNode}
              {ctaNode}
            </div>
            {secondaryLineNode}
          </div>
        </div>
      </section>
    );
  }

  const imageIsRight = promo.layout === "image-right";
  return (
    <section aria-labelledby="snaplink-local-promo-title" className="border-b border-border-default bg-page">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
        <div className="overflow-hidden rounded-3xl border border-border-default bg-surface shadow-sm md:grid md:grid-cols-5 md:items-stretch">
          <div className={`relative h-64 sm:h-80 md:col-span-3 md:h-auto ${imageIsRight ? "md:order-2" : "md:order-1"}`}>
            {showDesktopImage ? (
              <img
                src={desktopSrc}
                alt={alt}
                onError={() => setDesktopImageFailed(true)}
                loading="lazy"
                className={`hidden h-full w-full object-cover md:block ${FOCAL_CLASS[promo.focalPoint]}`}
              />
            ) : (
              <ImageFallback className="hidden h-full w-full md:block" />
            )}
            {showMobileImage ? (
              <img
                src={mobileSrc}
                alt={alt}
                onError={() => setMobileImageFailed(true)}
                loading="lazy"
                className={`h-full w-full object-cover md:hidden ${MOBILE_FOCAL_CLASS[promo.mobileFocalPoint]}`}
              />
            ) : (
              <ImageFallback className="h-full w-full md:hidden" />
            )}
          </div>
          <div className={`flex flex-col justify-center gap-1 p-6 sm:p-10 md:col-span-2 ${imageIsRight ? "md:order-1" : "md:order-2"}`}>
            {eyebrowNode}
            {titleNode}
            {bodyNode}
            <div className="mt-6 space-y-5">
              {chipsNode}
              {ctaNode}
            </div>
            {secondaryLineNode}
          </div>
        </div>
      </div>
    </section>
  );
}
