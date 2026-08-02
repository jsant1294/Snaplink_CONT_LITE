"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { t, type Lang } from "@/lib/southline-i18n";

interface SearchResult {
  projects: { id: string; slug: string; titleEs: string; titleEn: string; difficulty: string }[];
  contractors: { id: string; name: string; tagline?: string; serviceArea: string; href: string }[];
  agents: { id: string; name: string; tagline?: string; serviceArea: string; href: string }[];
}

export default function SearchOverlay({ lang, onClose }: { lang: Lang; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/southline/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data);
      } catch {
        setResults({ projects: [], contractors: [], agents: [] });
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  function submitSearch() {
    if (!query.trim()) return;
    onClose();
    router.push(`/results?q=${encodeURIComponent(query.trim())}`);
  }

  const pros = results ? results.contractors.length + results.agents.length : 0;
  const total = results ? results.projects.length + pros : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-accent-dark/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg mx-4 bg-surface rounded-2xl shadow-2xl overflow-hidden">
        {/* Search input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitSearch();
          }}
          className="p-3 border-b border-border-default"
        >
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder", lang)}
            className="w-full bg-transparent text-primary placeholder:text-text-muted/40 outline-none text-sm rounded-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          />
        </form>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {loading && (
            <p className="text-xs text-text-muted/60 text-center py-4">{t("loading", lang)}</p>
          )}

          {!loading && query.length >= 2 && total === 0 && (
            <p className="text-xs text-text-muted/60 text-center py-4">{t("searchNoResults", lang)}</p>
          )}

          {results && results.projects.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] uppercase tracking-wider text-text-muted/50 px-2 mb-1">
                {t("diyTitle", lang)}
              </p>
              {results.projects.map((p) => (
                <Link
                  key={p.id}
                  href={`/diy/${p.slug}`}
                  onClick={onClose}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-surface/20 transition-colors"
                >
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                    p.difficulty === "easy" ? "bg-accent-green/15 text-secondary" : p.difficulty === "medium" ? "bg-accent-gold/15 text-accent-gold-text" : "bg-state-error/15 text-state-error"
                  }`}>
                    {t(p.difficulty === "easy" ? "diyEasy" : p.difficulty === "medium" ? "diyMedium" : "diyHard", lang)}
                  </span>
                  <span className="text-sm text-primary">{lang === "es" ? p.titleEs : p.titleEn}</span>
                </Link>
              ))}
            </div>
          )}

          {results && results.contractors.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] uppercase tracking-wider text-text-muted/50 px-2 mb-1">
                {t("navPros", lang)}
              </p>
              {results.contractors.map((c) => (
                <Link
                  key={c.id}
                  href={c.href}
                  onClick={onClose}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-surface/20 transition-colors"
                >
                  <span className="text-sm text-primary font-medium">{c.name}</span>
                  <span className="text-[10px] text-text-muted/60">{c.serviceArea}</span>
                </Link>
              ))}
            </div>
          )}

          {results && results.agents.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] uppercase tracking-wider text-text-muted/50 px-2 mb-1">
                {t("featuredAgentsEyebrow", lang)}
              </p>
              {results.agents.map((a) => (
                <Link
                  key={a.id}
                  href={a.href}
                  onClick={onClose}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-surface/20 transition-colors"
                >
                  <span className="text-sm text-primary font-medium">{a.name}</span>
                  <span className="text-[10px] text-text-muted/60">{a.serviceArea}</span>
                </Link>
              ))}
            </div>
          )}

          {!loading && query.length >= 2 && total > 0 && (
            <Link
              href={`/results?q=${encodeURIComponent(query.trim())}`}
              onClick={onClose}
              className="mt-2 flex items-center justify-center gap-1 rounded-xl border border-border-default py-2 text-xs font-semibold text-primary hover:bg-surface/20 transition-colors"
            >
              {t("resultsViewAll", lang)}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
