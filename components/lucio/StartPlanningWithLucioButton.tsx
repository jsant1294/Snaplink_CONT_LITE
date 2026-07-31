"use client";

import { t, type Lang } from "@/lib/southline-i18n";
import { openLucioWidget } from "@/lib/lucio/widget-state";

// Hero.tsx is a server component (it renders CMS-driven content), so this
// button is its own small client boundary — just enough to call into the
// widget's open/close store.
export default function StartPlanningWithLucioButton({ lang }: { lang: Lang }) {
  return (
    <button
      type="button"
      onClick={openLucioWidget}
      className="w-full sm:w-auto rounded-xl bg-gold/90 px-8 py-3.5 text-center font-semibold text-obsidian shadow-lg transition-colors hover:bg-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-cream focus-visible:ring-offset-2 focus-visible:ring-offset-[#2a241e]"
    >
      {t("startPlanningWithLucio", lang)}
    </button>
  );
}
