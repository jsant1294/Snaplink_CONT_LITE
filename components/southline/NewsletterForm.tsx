"use client";

import { useState } from "react";
import { t, type Lang } from "@/lib/southline-i18n";

export default function NewsletterForm({ lang }: { lang: Lang }) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await fetch("/api/southline/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, lang }),
      });
      setDone(true);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      {done ? (
        <p className="text-sm text-accent-gold w-full text-center py-2.5">
          {lang === "es" ? "¡Gracias por suscribirte!" : "Thanks for subscribing!"}
        </p>
      ) : (
        <>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("newsletterPlaceholder", lang)}
            className="flex-1 bg-charcoal border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-dark placeholder:text-on-dark/30 focus:outline-none focus:border-accent-gold/60"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-accent-gold text-primary font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-accent-gold/90 transition-colors shrink-0 disabled:opacity-40"
          >
            {loading ? "…" : t("newsletterSubmit", lang)}
          </button>
        </>
      )}
    </form>
  );
}
