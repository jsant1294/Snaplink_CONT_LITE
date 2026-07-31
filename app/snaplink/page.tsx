import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import type { Lang } from "@/lib/southline-i18n";
import { PLATFORM_SECTIONS, TRUST_POINTS, CONSUMER_JOURNEY, PROFESSIONAL_JOURNEY } from "@/lib/snaplink-content";
import { FAQ_CATEGORIES, faqEntriesByCategory } from "@/lib/faq";
import Header from "@/components/southline/Header";
import Footer from "@/components/southline/Footer";

const appUrl = process.env.APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: "SnapLink | The Technology Behind Southline Living",
  description: "SnapLink is the professional platform powering digital profiles, NFC products, booking, and lead generation for every trusted professional on Southline Living.",
  alternates: { canonical: `${appUrl}/snaplink` },
};

export const dynamic = "force-dynamic";

function Journey({ steps, lang }: { steps: { es: string; en: string }[]; lang: Lang }) {
  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 rounded-full border border-walnut/20 bg-cream px-3.5 py-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-obsidian">{i + 1}</span>
            <span className="text-xs font-medium text-walnut sm:text-sm">{lang === "es" ? step.es : step.en}</span>
          </div>
          {i < steps.length - 1 && <span className="text-walnut/30">→</span>}
        </div>
      ))}
    </div>
  );
}

export default async function SnapLinkPage() {
  const lang = ((await cookies()).get("sl_lang")?.value ?? "en") as Lang;
  const snaplinkFaqs = faqEntriesByCategory("snaplink");

  return (
    <>
      <Header lang={lang} />
      <main className="bg-ivory">
        {/* What is SnapLink? */}
        <section className="border-b border-walnut/15 bg-obsidian px-4 py-16 text-cream sm:py-24">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-xs uppercase tracking-[0.35em] text-gold">
              {lang === "es" ? "SnapLink · Conecta. Toca. Crece." : "SnapLink · Connect. Tap. Grow."}
            </p>
            <h1 className="mt-4 font-display text-4xl leading-tight text-cream sm:text-6xl">
              {lang === "es" ? "¿Qué es SnapLink?" : "What is SnapLink?"}
            </h1>
            <p className="mt-5 text-base leading-relaxed text-cream/75 sm:text-lg">
              {lang === "es"
                ? "SnapLink es la plataforma tecnológica detrás de Southline Living. Impulsa el perfil digital, las reservas, los clientes potenciales y la conexión con el cliente de cada profesional, incluyendo productos NFC y QR inteligentes que permiten a un profesional compartir su perfil con un toque o un escaneo."
                : "SnapLink is the technology platform behind Southline Living. It powers every professional's digital profile, booking, leads, and customer connection — including smart NFC and QR products that let a professional share their profile with a tap or a scan."}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/contractor-admin" className="rounded-xl bg-gold px-6 py-3 text-sm font-semibold text-obsidian transition-colors hover:bg-goldlight active:scale-[0.98] motion-reduce:active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-cream focus-visible:ring-offset-2 focus-visible:ring-offset-obsidian">
                {lang === "es" ? "Únete a SnapLink" : "Join SnapLink"}
              </Link>
              <Link href="/book" className="rounded-xl border border-cream/25 px-6 py-3 text-sm font-medium text-cream transition-colors hover:bg-cream/10 active:scale-[0.98] motion-reduce:active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-cream focus-visible:ring-offset-2 focus-visible:ring-offset-obsidian">
                {lang === "es" ? "Solicitar demostración" : "Request Demo"}
              </Link>
            </div>
          </div>
        </section>

        {/* Platform sections */}
        <section className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PLATFORM_SECTIONS.map((s) => (
              <div key={s.id} id={s.id} className="rounded-2xl border border-walnut/15 bg-cream p-6">
                <h2 className="font-display text-xl text-obsidian">{lang === "es" ? s.titleEs : s.titleEn}</h2>
                <p className="mt-2 text-sm leading-relaxed text-clay">{lang === "es" ? s.bodyEs : s.bodyEn}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Journeys */}
        <section className="border-y border-walnut/15 bg-sand/20 px-4 py-14 sm:py-20">
          <div className="mx-auto max-w-6xl grid gap-10 lg:grid-cols-2">
            <div>
              <h2 className="mb-4 font-display text-2xl text-obsidian">
                {lang === "es" ? "El recorrido del propietario" : "The Homeowner Journey"}
              </h2>
              <Journey steps={CONSUMER_JOURNEY} lang={lang} />
            </div>
            <div>
              <h2 className="mb-4 font-display text-2xl text-obsidian">
                {lang === "es" ? "El recorrido del profesional" : "The Professional Journey"}
              </h2>
              <Journey steps={PROFESSIONAL_JOURNEY} lang={lang} />
            </div>
          </div>
          <div className="mx-auto mt-12 max-w-6xl">
            <h3 className="mb-4 font-display text-xl text-obsidian">
              {lang === "es" ? "Por qué los propietarios confían en SnapLink" : "Why Homeowners Trust SnapLink"}
            </h3>
            <div className="flex flex-wrap gap-2">
              {TRUST_POINTS.map((p, i) => (
                <span key={i} className="rounded-full border border-olive/25 bg-cream px-3.5 py-1.5 text-xs font-medium text-olive">
                  {lang === "es" ? p.es : p.en}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Professional Success Stories — no fabricated testimonials; this app has
            no real customer-story content yet, so we say that honestly rather than
            invent names/quotes, matching how ratings were handled elsewhere. */}
        <section className="mx-auto max-w-4xl px-4 py-14 text-center sm:py-20">
          <h2 className="font-display text-2xl text-obsidian sm:text-3xl">
            {lang === "es" ? "Historias de éxito de profesionales" : "Professional Success Stories"}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-clay">
            {lang === "es"
              ? "Estamos reuniendo historias reales de profesionales de SnapLink. Vuelve pronto, o contáctanos si quieres compartir la tuya."
              : "We're gathering real stories from SnapLink professionals. Check back soon, or reach out if you'd like to share yours."}
          </p>
        </section>

        {/* Pricing — no specific numbers are published yet; contact-based rather
            than invented dollar figures. */}
        <section className="border-t border-walnut/15 bg-sand/20 px-4 py-14 text-center sm:py-20">
          <h2 className="font-display text-2xl text-obsidian sm:text-3xl">{lang === "es" ? "Precios" : "Pricing"}</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-clay">
            {lang === "es"
              ? "Los planes varían según tus necesidades. Contáctanos para conocer los precios y encontrar el plan adecuado para tu negocio."
              : "Plans vary based on your needs. Reach out to learn current pricing and find the right fit for your business."}
          </p>
          <Link href="/contractor-admin" className="mt-6 inline-flex rounded-xl bg-obsidian px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-obsidian/90 active:scale-[0.98] motion-reduce:active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-obsidian focus-visible:ring-offset-2 focus-visible:ring-offset-ivory">
            {lang === "es" ? "Únete a SnapLink" : "Join SnapLink"}
          </Link>
        </section>

        {/* FAQ (SnapLink category) — full FAQ lives at /faq */}
        <section className="mx-auto max-w-3xl px-4 py-14 sm:py-20">
          <h2 className="mb-6 text-center font-display text-2xl text-obsidian sm:text-3xl">
            {lang === "es" ? "Preguntas frecuentes" : "Frequently Asked Questions"}
          </h2>
          <div className="space-y-4">
            {snaplinkFaqs.map((entry) => (
              <details key={entry.id} className="group rounded-2xl border border-walnut/15 bg-cream p-5">
                <summary className="cursor-pointer list-none font-display text-lg text-obsidian marker:content-none">
                  {lang === "es" ? entry.questionEs : entry.questionEn}
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-clay">{lang === "es" ? entry.answerEs : entry.answerEn}</p>
              </details>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link href="/faq" className="text-sm font-medium text-olive hover:text-obsidian focus:outline-none focus-visible:ring-2 focus-visible:ring-obsidian focus-visible:ring-offset-2 focus-visible:ring-offset-ivory rounded-sm">
              {lang === "es" ? "Ver todas las preguntas frecuentes" : "View all FAQ"} →
            </Link>
          </div>
          <p className="mt-8 text-center text-xs uppercase tracking-wide text-walnut/40">
            {FAQ_CATEGORIES.length} {lang === "es" ? "categorías cubiertas en /faq" : "categories covered at /faq"}
          </p>
        </section>

        {/* Join / Request Demo */}
        <section className="border-t border-walnut/15 bg-obsidian px-4 py-16 text-center text-cream sm:py-20">
          <h2 className="font-display text-2xl sm:text-3xl">
            {lang === "es" ? "Haz crecer tu negocio con SnapLink" : "Grow Your Business with SnapLink"}
          </h2>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/contractor-admin" className="rounded-xl bg-gold px-6 py-3 text-sm font-semibold text-obsidian transition-colors hover:bg-goldlight active:scale-[0.98] motion-reduce:active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-cream focus-visible:ring-offset-2 focus-visible:ring-offset-obsidian">
              {lang === "es" ? "Únete a SnapLink" : "Join SnapLink"}
            </Link>
            <Link href="/book" className="rounded-xl border border-cream/25 px-6 py-3 text-sm font-medium text-cream transition-colors hover:bg-cream/10 active:scale-[0.98] motion-reduce:active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-cream focus-visible:ring-offset-2 focus-visible:ring-offset-obsidian">
              {lang === "es" ? "Solicitar demostración" : "Request Demo"}
            </Link>
            <Link href="/contractor-admin" className="rounded-xl border border-cream/25 px-6 py-3 text-sm font-medium text-cream transition-colors hover:bg-cream/10 active:scale-[0.98] motion-reduce:active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-cream focus-visible:ring-offset-2 focus-visible:ring-offset-obsidian">
              {lang === "es" ? "Acceso profesional" : "Professional Login"}
            </Link>
          </div>
        </section>
      </main>
      <Footer lang={lang} />
    </>
  );
}
