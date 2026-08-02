"use client";

import { t, type Lang } from "@/lib/southline-i18n";

export default function LangToggle({ lang }: { lang: Lang }) {
  const nextLang: Lang = lang === "es" ? "en" : "es";

  function toggle() {
    document.cookie = `sl_lang=${nextLang};path=/;max-age=31536000;SameSite=Lax`;
    window.location.reload();
  }

  return (
    <button
      onClick={toggle}
      className="text-sm font-medium text-text-muted hover:text-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-surface/50"
      aria-label={t("langLabel", lang)}
    >
      {t("langSwitch", lang)}
    </button>
  );
}
