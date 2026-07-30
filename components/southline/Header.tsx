"use client";

import { useState } from "react";
import Link from "next/link";
import { t, type Lang } from "@/lib/southline-i18n";
import LangToggle from "./LangToggle";
import SearchOverlay from "./SearchOverlay";

interface NavItem {
  key: string;
  href: string;
  labelEs?: string;
  labelEn?: string;
  visible?: boolean;
}

const DEFAULT_NAV: NavItem[] = [
  { key: "navHome", href: "/" },
  { key: "navIdeas", href: "/#categories" },
  { key: "navProjects", href: "/planner" },
  { key: "navDIY", href: "/diy" },
  { key: "navPros", href: "/#professionals" },
  { key: "navBook", href: "/book" },
  { key: "navForContractors", href: "/for-contractors" },
];

export default function Header({
  lang,
  navItems,
}: {
  lang: Lang;
  navItems?: NavItem[] | null;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const items = navItems?.filter((i) => i.visible !== false) ?? DEFAULT_NAV;

  return (
    <header className="sticky top-0 z-50 bg-cream/95 backdrop-blur-sm border-b border-walnut/15">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="text-xl font-display font-bold text-obsidian tracking-tight">
              Southline
            </span>
            <span className="text-xl font-display font-light text-gold">
              Living
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {items.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className="px-3 py-2 text-sm font-medium text-clay hover:text-obsidian transition-colors rounded-lg hover:bg-sand/30"
              >
                {item.labelEs && item.labelEn
                  ? lang === "es" ? item.labelEs : item.labelEn
                  : t(item.key as keyof typeof t, lang)}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-lg hover:bg-sand/30 transition-colors"
              aria-label="Search"
            >
              <svg className="w-5 h-5 text-clay" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <LangToggle lang={lang} />
            <Link
              href="/contractor-admin"
              className="hidden sm:flex flex-col items-end rounded-lg px-2 py-1 leading-none hover:bg-ivory transition-colors"
            >
              <span className="text-[9px] uppercase tracking-[0.16em] text-taupe">
                Powered by <span className="text-snaplink-gold-dark font-semibold">Snaplink</span>
              </span>
              <span className="mt-1 text-xs font-semibold text-snaplink-charcoal">
                {t("contractorLogin", lang)}
              </span>
            </Link>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-sand/30 transition-colors"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              <svg className="w-6 h-6 text-obsidian" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {searchOpen && <SearchOverlay lang={lang} onClose={() => setSearchOpen(false)} />}

      {menuOpen && (
        <div className="md:hidden border-t border-sand/50 bg-cream">
          <nav className="max-w-7xl mx-auto px-4 py-4 space-y-1">
            {items.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-3 text-base font-medium text-clay hover:text-obsidian hover:bg-sand/30 rounded-lg transition-colors"
              >
                {item.labelEs && item.labelEn
                  ? lang === "es" ? item.labelEs : item.labelEn
                  : t(item.key as keyof typeof t, lang)}
              </Link>
            ))}
            <Link
              href="/contractor-admin"
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-3 mt-2 text-base font-medium text-cream bg-obsidian rounded-xl text-center"
            >
              {t("contractorLogin", lang)}
            </Link>
            <p className="text-center text-[10px] uppercase tracking-[0.16em] text-taupe pt-1">
              Powered by <span className="text-snaplink-gold-dark">Snaplink</span>
            </p>
          </nav>
        </div>
      )}
    </header>
  );
}
