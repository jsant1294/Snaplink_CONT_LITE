"use client";

import { useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { t, type Lang } from "@/lib/southline-i18n";
import type {
  LocalDiscoveryDestination,
  SouthlineLocalCategory,
  SouthlineLocalDiscoveryContent,
} from "@/lib/southline-types";
import {
  buildDiscoveryTarget,
  getCategoryCta,
  getCategoryDestination,
  getDiscoveryHelperText,
  getOrCreateLocalDiscoverySessionId,
  isValidUsZip,
  LOCAL_SEARCH_EVENT,
  normalizeUsZip,
  readApprovedUtmParams,
  type ApprovedUtmParams,
  type DiscoveryTarget,
} from "@/lib/southline-local-discovery";

export type LocalSearchEventPayload = {
  locale: Lang;
  zipProvided: boolean;
  // The category slug actually forwarded to the destination (SnapLink slug for
  // SnapLink-owned categories, internal slug for Southline-owned ones), or null.
  category: string | null;
  destination: LocalDiscoveryDestination;
  source: "southline";
  // --- Attribution (Phase 7) ---
  placement: string;
  timestamp: string;
  sessionId: string;
  utm: ApprovedUtmParams;
};

// Deterministic outbound hand-off: calls the optional hook AND fires a
// window-level `local_search_submitted` CustomEvent carrying only aggregated
// fields — never the visitor's exact ZIP, which still goes to the destination
// as the user-requested search. Analytics failures must never block navigation,
// so every step here is wrapped defensively.
function emitLocalSearch(payload: LocalSearchEventPayload, onSearch?: (p: LocalSearchEventPayload) => void) {
  try {
    onSearch?.(payload);
  } catch {
    // never block navigation on a consumer's analytics handler
  }
  try {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent<LocalSearchEventPayload>(LOCAL_SEARCH_EVENT, { detail: payload }));
    }
  } catch {
    // never block navigation on analytics dispatch
  }
}

export default function LocalDiscovery({
  lang,
  content,
  onSearch,
}: {
  lang: Lang;
  content?: SouthlineLocalDiscoveryContent | null;
  onSearch?: (payload: LocalSearchEventPayload) => void;
}) {
  const [zip, setZip] = useState("");
  const [category, setCategory] = useState<string>(content?.defaultCategory ?? "");
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const zipInputId = useId();
  const categoryInputId = useId();
  const errorId = useId();
  const titleId = useId();

  const inbound = useMemo(
    () => (typeof window === "undefined" ? {} : readApprovedUtmParams(window.location.search)),
    []
  );

  if (!content?.enabled) return null;

  const categories = (content.categories ?? [])
    .filter((c) => c.visible !== false)
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));

  const pick = (en: string | null | undefined, esVal: string | null | undefined, fallback: string) =>
    (lang === "es" ? (esVal ?? en) : en) ?? fallback;

  const eyebrow = pick(content.eyebrowEn, content.eyebrowEs, t("localDiscoveryEyebrow", lang));
  const title = pick(content.titleEn, content.titleEs, t("localDiscoveryTitle", lang));
  const description = pick(
    content.descriptionEn,
    content.descriptionEs,
    t("localDiscoveryDescription", lang)
  );
  const zipPlaceholder = pick(
    content.zipPlaceholderEn,
    content.zipPlaceholderEs,
    t("localDiscoveryZipPlaceholder", lang)
  );
  const poweredBy = pick(
    content.poweredByLabelEn,
    content.poweredByLabelEs,
    t("localDiscoveryPoweredBy", lang)
  );

  const openBehavior = content.openBehavior ?? "same-tab";
  const placement = content.placementValue || "homepage-local-discovery";

  const selectedCategory = categories.find((c) => c.id === category) ?? null;
  const submitLabel = pick(
    content.submitLabelEn,
    content.submitLabelEs,
    getCategoryCta(lang, selectedCategory)
  );

  // Routing settings passed verbatim to the ownership builders. Only
  // `destination` on the category decides where it routes — the builders throw
  // for a misconfigured SnapLink category rather than guessing a slug.
  const routingSettings = {
    internalDirectoryRoute: content.internalDirectoryRoute,
    directoryBaseUrl: content.directoryBaseUrl,
    directoryRoute: content.directoryRoute,
    zipParam: content.zipParam,
    categoryParam: content.categoryParam,
    localeParam: content.localeParam,
    sourceValue: content.sourceValue,
    placementValue: content.placementValue,
    preserveUtm: content.preserveUtm !== false,
    attributionEnabled: content.attributionEnabled !== false,
    fallbackUrl: content.fallbackUrl,
  };

  function buildTarget(args: { zip?: string | null; category?: SouthlineLocalCategory | null }): DiscoveryTarget {
    const currentSearchParams =
      typeof window === "undefined" ? undefined : new URLSearchParams(window.location.search);
    return buildDiscoveryTarget({
      settings: routingSettings,
      locale: lang,
      zip: args.zip ?? null,
      category: args.category ?? null,
      currentSearchParams,
    });
  }

  // The category value recorded in analytics mirrors what was actually
  // forwarded to the destination — never a guessed slug.
  function forwardedCategory(selected: SouthlineLocalCategory | null): string | null {
    if (!selected) return null;
    if (getCategoryDestination(selected) === "snaplink") return selected.snaplinkCategory?.trim() || null;
    if (selected.id === "real-estate") return null; // routes to /homes, which has no category filter
    return selected.internalSlug?.trim() || selected.id;
  }

  function navigate(target: DiscoveryTarget) {
    if (target.external) {
      if (openBehavior === "new-tab") {
        window.open(target.url, "_blank", "noopener,noreferrer");
      } else {
        window.location.assign(target.url);
      }
      return;
    }
    router.push(target.url);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = normalizeUsZip(zip);
    if (!isValidUsZip(normalized)) {
      setError(t("localDiscoveryZipError", lang));
      return;
    }
    setError(null);
    try {
      const target = buildTarget({ zip: normalized, category: selectedCategory });
      emitLocalSearch(
        {
          locale: lang,
          zipProvided: true,
          category: forwardedCategory(selectedCategory),
          destination: target.destination,
          source: "southline",
          placement,
          timestamp: new Date().toISOString(),
          sessionId: getOrCreateLocalDiscoverySessionId(),
          utm: inbound,
        },
        onSearch
      );
      navigate(target);
    } catch {
      setError(t("localDiscoveryRoutingError", lang));
    }
  }

  function handleCategoryClick(c: SouthlineLocalCategory) {
    setError(null);
    try {
      const target = buildTarget({ zip: null, category: c });
      emitLocalSearch(
        {
          locale: lang,
          zipProvided: false,
          category: forwardedCategory(c),
          destination: target.destination,
          source: "southline",
          placement,
          timestamp: new Date().toISOString(),
          sessionId: getOrCreateLocalDiscoverySessionId(),
          utm: inbound,
        },
        onSearch
      );
      navigate(target);
    } catch {
      setError(t("localDiscoveryRoutingError", lang));
    }
  }

  return (
    <section aria-labelledby={titleId} className="bg-page">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          {eyebrow && (
            <p className="text-xs uppercase tracking-[0.35em] text-accent-gold">{eyebrow}</p>
          )}
          <h2 id={titleId} className="mt-3 font-display text-3xl leading-tight text-primary sm:text-4xl">
            {title}
          </h2>
          <p className="mt-3 text-text-muted">{description}</p>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-[1fr_1fr_auto]"
        >
          <div className="min-w-0">
            <label htmlFor={zipInputId} className="block text-sm font-medium text-primary mb-1.5">
              {t("localDiscoveryZipLabel", lang)}
            </label>
            <input
              id={zipInputId}
              type="text"
              inputMode="numeric"
              autoComplete="postal-code"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              placeholder={zipPlaceholder}
              aria-describedby={error ? errorId : undefined}
              aria-invalid={error ? true : undefined}
              className="w-full rounded-xl border border-border-default bg-surface px-4 py-3 text-primary placeholder:text-text-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold"
            />
          </div>

          <div className="min-w-0">
            <label htmlFor={categoryInputId} className="block text-sm font-medium text-primary mb-1.5">
              {t("localDiscoveryCategoryLabel", lang)}
            </label>
            <select
              id={categoryInputId}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-border-default bg-surface px-4 py-3 text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold"
            >
              <option value="">{t("localDiscoveryCategoryAny", lang)}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {lang === "es" ? c.labelEs : c.labelEn}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:self-end">
            <button
              type="submit"
              className="w-full rounded-xl bg-accent-gold px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-accent-gold/90 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-page motion-reduce:transition-none motion-reduce:active:scale-100"
            >
              {submitLabel}
            </button>
          </div>
        </form>

        <p id={errorId} role="alert" aria-live="assertive" className="mx-auto mt-3 max-w-3xl text-center text-sm font-medium text-state-error">
          {error}
        </p>

        <p className="mx-auto mt-3 max-w-3xl text-center text-xs text-text-muted">
          {getDiscoveryHelperText(lang, selectedCategory)}
        </p>

        {content.showCategoryCards !== false && categories.length > 0 && (
          <div className="mx-auto mt-10 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => handleCategoryClick(c)}
                className="group flex flex-col rounded-2xl border border-border-default bg-surface p-5 text-left shadow-sm transition-colors hover:border-accent-gold/60 hover:bg-surface-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold motion-reduce:transition-none"
              >
                {c.icon && (
                  <span aria-hidden="true" className="text-2xl">
                    {c.icon}
                  </span>
                )}
                <span className="mt-2 font-display text-lg text-primary group-hover:text-accent-gold">
                  {lang === "es" ? c.labelEs : c.labelEn}
                </span>
                <span className="mt-1 text-sm text-text-muted">
                  {lang === "es" ? (c.descriptionEs ?? c.descriptionEn) : c.descriptionEn}
                </span>
                <span className="mt-3 text-xs font-semibold text-accent-gold">
                  {getCategoryCta(lang, c)}
                </span>
              </button>
            ))}
          </div>
        )}

        <p className="mt-8 text-center text-xs uppercase tracking-[0.25em] text-text-muted">
          {poweredBy}
        </p>
      </div>
    </section>
  );
}
