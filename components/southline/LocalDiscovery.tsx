"use client";

import { useId, useMemo, useState } from "react";
import { t, type Lang } from "@/lib/southline-i18n";
import type { SouthlineLocalCategory, SouthlineLocalDiscoveryContent } from "@/lib/southline-types";
import {
  buildSnaplinkLocalUrl,
  isValidUsZip,
  LOCAL_SEARCH_EVENT,
  normalizeUsZip,
  readApprovedUtmParams,
} from "@/lib/southline-local-discovery";

export type LocalSearchEventPayload = {
  locale: Lang;
  zipProvided: boolean;
  category: string | null;
  destination: "snaplink";
  source: "southline";
};

// Deterministic outbound hand-off: calls the optional hook AND fires a
// window-level `local_search_submitted` CustomEvent carrying only aggregated
// fields — never the visitor's exact ZIP, which still goes to SnapLink as the
// user-requested search.
function emitLocalSearch(payload: LocalSearchEventPayload, onSearch?: (p: LocalSearchEventPayload) => void) {
  onSearch?.(payload);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent<LocalSearchEventPayload>(LOCAL_SEARCH_EVENT, { detail: payload }));
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
  const submitLabel = pick(
    content.submitLabelEn,
    content.submitLabelEs,
    t("localDiscoverySubmit", lang)
  );
  const poweredBy = pick(
    content.poweredByLabelEn,
    content.poweredByLabelEs,
    t("localDiscoveryPoweredBy", lang)
  );

  function directoryUrl({ zip: zipValue, category: categoryValue }: { zip?: string | null; category?: string | null }) {
    return buildSnaplinkLocalUrl({
      baseUrl: content?.directoryBaseUrl,
      locale: lang,
      zip: zipValue ?? null,
      category: categoryValue ?? null,
      source: inbound.utm_source ?? null,
      medium: inbound.utm_medium ?? null,
      campaign: inbound.utm_campaign ?? null,
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = normalizeUsZip(zip);
    if (!isValidUsZip(normalized)) {
      setError(t("localDiscoveryZipError", lang));
      return;
    }
    setError(null);
    const selected = categories.find((c) => c.id === category) ?? null;
    const snaplinkCategory = selected ? (selected.snaplinkCategory ?? selected.id) : null;
    const url = directoryUrl({ zip: normalized, category: snaplinkCategory });
    emitLocalSearch(
      {
        locale: lang,
        zipProvided: true,
        category: snaplinkCategory,
        destination: "snaplink",
        source: "southline",
      },
      onSearch
    );
    window.location.assign(url);
  }

  function trackCard(c: SouthlineLocalCategory) {
    emitLocalSearch(
      {
        locale: lang,
        zipProvided: false,
        category: c.snaplinkCategory ?? c.id,
        destination: "snaplink",
        source: "southline",
      },
      onSearch
    );
  }

  return (
    <section aria-labelledby={titleId} className="border-b border-walnut/15 bg-ivory">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          {eyebrow && (
            <p className="text-xs uppercase tracking-[0.35em] text-gold">{eyebrow}</p>
          )}
          <h2 id={titleId} className="mt-3 font-display text-3xl leading-tight text-obsidian sm:text-4xl">
            {title}
          </h2>
          <p className="mt-3 text-clay">{description}</p>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-[1fr_1fr_auto]"
        >
          <div className="min-w-0">
            <label htmlFor={zipInputId} className="block text-sm font-medium text-obsidian mb-1.5">
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
              className="w-full rounded-xl border border-walnut/25 bg-cream px-4 py-3 text-obsidian placeholder:text-clay/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            />
          </div>

          <div className="min-w-0">
            <label htmlFor={categoryInputId} className="block text-sm font-medium text-obsidian mb-1.5">
              {t("localDiscoveryCategoryLabel", lang)}
            </label>
            <select
              id={categoryInputId}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-walnut/25 bg-cream px-4 py-3 text-obsidian focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
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
              className="w-full rounded-xl bg-gold px-6 py-3 text-sm font-semibold text-obsidian transition-colors hover:bg-gold/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-ivory motion-reduce:transition-none"
            >
              {submitLabel}
            </button>
          </div>
        </form>

        <p id={errorId} role="alert" aria-live="assertive" className="mx-auto mt-3 max-w-3xl text-center text-sm font-medium text-danger">
          {error}
        </p>

        <p className="mx-auto mt-3 max-w-3xl text-center text-xs text-clay">
          {t("localDiscoveryExternalNote", lang)}
        </p>

        {content.showCategoryCards !== false && categories.length > 0 && (
          <div className="mx-auto mt-10 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((c) => (
              <a
                key={c.id}
                href={directoryUrl({ category: c.snaplinkCategory ?? c.id })}
                onClick={() => trackCard(c)}
                className="group flex flex-col rounded-2xl border border-walnut/15 bg-cream p-5 transition-colors hover:border-gold/60 hover:bg-cream/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold motion-reduce:transition-none"
              >
                {c.icon && (
                  <span aria-hidden="true" className="text-2xl">
                    {c.icon}
                  </span>
                )}
                <span className="mt-2 font-display text-lg text-obsidian group-hover:text-gold">
                  {lang === "es" ? c.labelEs : c.labelEn}
                </span>
                <span className="mt-1 text-sm text-clay">
                  {lang === "es" ? (c.descriptionEs ?? c.descriptionEn) : c.descriptionEn}
                </span>
                <span className="mt-3 text-xs font-semibold text-gold">
                  {t("localDiscoverySubmit", lang)}
                </span>
              </a>
            ))}
          </div>
        )}

        <p className="mt-8 text-center text-xs uppercase tracking-[0.25em] text-clay">
          {poweredBy}
        </p>
      </div>
    </section>
  );
}
