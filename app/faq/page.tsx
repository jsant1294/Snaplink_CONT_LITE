import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import type { Lang } from "@/lib/southline-i18n";
import { FAQ_CATEGORIES, faqEntriesByCategory } from "@/lib/faq";
import { southlineStore } from "@/lib/southline-store";
import { visibleFaqItems } from "@/lib/southline-faq";
import { buildSeoMetadata } from "@/lib/southline-seo";
import Header from "@/components/southline/Header";
import Footer from "@/components/southline/Footer";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const lang = ((cookieStore.get("sl_lang")?.value ?? "en") as Lang);
  const seo = await southlineStore.getSettings().then((s) => s.seo).catch(() => null);
  return buildSeoMetadata({ lang, seo, pageKey: "faq" });
}

export const dynamic = "force-dynamic";

export default async function FaqPage() {
  const lang = ((await cookies()).get("sl_lang")?.value ?? "en") as Lang;
  const settings = await southlineStore.getSettings().catch(() => null);
  const faq = settings?.faq;

  if (faq?.enabled === false) notFound();

  const cmsItems = visibleFaqItems(faq);
  const eyebrow = lang === "es" ? faq?.eyebrowEs : faq?.eyebrowEn;
  const title = lang === "es" ? faq?.titleEs : faq?.titleEn;
  const subtitle = lang === "es" ? faq?.subtitleEs : faq?.subtitleEn;

  return (
    <>
      <Header lang={lang} />
      <main className="bg-page">
        <section className="border-b border-border-default px-4 py-14 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs uppercase tracking-[0.35em] text-accent-gold">{eyebrow ?? "Southline Living"}</p>
            <h1 className="mt-4 font-display text-4xl leading-tight text-primary sm:text-5xl">
              {title ?? (lang === "es" ? "Preguntas frecuentes" : "Frequently Asked Questions")}
            </h1>
            <p className="mt-4 text-text-muted">
              {subtitle ??
                (lang === "es"
                  ? "Respuestas sobre Southline Living, SnapLink, casas, profesionales, cotizaciones, reservas y más."
                  : "Answers about Southline Living, SnapLink, homes, professionals, quotes, booking, and more.")}
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
          {cmsItems.length > 0 ? (
            <div className="space-y-4">
              {cmsItems.map((item) => (
                <details key={item.id} className="group rounded-2xl border border-border-default bg-page p-5 open:shadow-sm">
                  <summary className="cursor-pointer list-none font-display text-lg text-primary marker:content-none">
                    {lang === "es" ? item.questionEs : item.questionEn}
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-text-muted">
                    {lang === "es" ? item.answerEs : item.answerEn}
                  </p>
                </details>
              ))}
            </div>
          ) : (
            FAQ_CATEGORIES.map((category) => {
              const entries = faqEntriesByCategory(category.id);
              if (entries.length === 0) return null;
              return (
                <div key={category.id} className="mb-12">
                  <h2 className="font-display text-2xl text-primary mb-5 border-l-2 border-accent-gold pl-3">
                    {lang === "es" ? category.es : category.en}
                  </h2>
                  <div className="space-y-4">
                    {entries.map((entry) => (
                      <details key={entry.id} className="group rounded-2xl border border-border-default bg-page p-5 open:shadow-sm">
                        <summary className="cursor-pointer list-none font-display text-lg text-primary marker:content-none">
                          {lang === "es" ? entry.questionEs : entry.questionEn}
                        </summary>
                        <p className="mt-3 text-sm leading-relaxed text-text-muted">
                          {lang === "es" ? entry.answerEs : entry.answerEn}
                        </p>
                      </details>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </section>
      </main>
      <Footer lang={lang} footer={settings?.footer} contact={settings?.contact} />
    </>
  );
}
