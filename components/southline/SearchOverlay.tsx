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
      <div className="absolute inset-0 bg-obsidian/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg mx-4 bg-paper rounded-2xl shadow-2xl overflow-hidden">
        {/* Search input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitSearch();
          }}
          className="p-3 border-b border-sand/20"
        >
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder", lang)}
            className="w-full bg-transparent text-obsidian placeholder:text-clay/40 outline-none text-sm rounded-lg focus-visible:ring-2 focus-visible:ring-obsidian focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
          />
        </form>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {loading && (
            <p className="text-xs text-clay/60 text-center py-4">{t("loading", lang)}</p>
          )}

          {!loading && query.length >= 2 && total === 0 && (
            <p className="text-xs text-clay/60 text-center py-4">{t("searchNoResults", lang)}</p>
          )}

          {results && results.projects.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] uppercase tracking-wider text-clay/50 px-2 mb-1">
                {t("diyTitle", lang)}
              </p>
              {results.projects.map((p) => (
                <Link
                  key={p.id}
                  href={`/diy/${p.slug}`}
                  onClick={onClose}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-sand/20 transition-colors"
                >
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                    p.difficulty === "easy" ? "bg-sage/15 text-sage" : p.difficulty === "medium" ? "bg-amber-900/15 text-amber" : "bg-danger/15 text-danger"
                  }`}>
                    {t(p.difficulty === "easy" ? "diyEasy" : p.difficulty === "medium" ? "diyMedium" : "diyHard", lang)}
                  </span>
                  <span className="text-sm text-obsidian">{lang === "es" ? p.titleEs : p.titleEn}</span>
                </Link>
              ))}
            </div>
          )}

          {results && results.contractors.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] uppercase tracking-wider text-clay/50 px-2 mb-1">
                {t("navPros", lang)}
              </p>
              {results.contractors.map((c) => (
                <Link
                  key={c.id}
                  href={c.href}
                  onClick={onClose}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-sand/20 transition-colors"
                >
                  <span className="text-sm text-obsidian font-medium">{c.name}</span>
                  <span className="text-[10px] text-clay/60">{c.serviceArea}</span>
                </Link>
              ))}
            </div>
          )}

          {results && results.agents.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] uppercase tracking-wider text-clay/50 px-2 mb-1">
                {t("featuredAgentsEyebrow", lang)}
              </p>
              {results.agents.map((a) => (
                <Link
                  key={a.id}
                  href={a.href}
                  onClick={onClose}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-sand/20 transition-colors"
                >
                  <span className="text-sm text-obsidian font-medium">{a.name}</span>
                  <span className="text-[10px] text-clay/60">{a.serviceArea}</span>
                </Link>
              ))}
            </div>
          )}

          {!loading && query.length >= 2 && total > 0 && (
            <Link
              href={`/results?q=${encodeURIComponent(query.trim())}`}
              onClick={onClose}
              className="mt-2 flex items-center justify-center gap-1 rounded-xl border border-sand/40 py-2 text-xs font-semibold text-obsidian hover:bg-sand/20 transition-colors"
            >
              {t("resultsViewAll", lang)}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
