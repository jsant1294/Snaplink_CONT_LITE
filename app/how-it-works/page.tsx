import { cookies } from "next/headers";
import type { Lang } from "@/lib/southline-i18n";
import { t } from "@/lib/southline-i18n";
import Header from "@/components/southline/Header";
import Footer from "@/components/southline/Footer";

export const dynamic = "force-dynamic";

export default async function HowItWorksPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("sl_lang")?.value ?? "en") as Lang;

  const steps = [
    {
      num: "1",
      icon: "💡",
      title: lang === "es" ? "Explora e inspírate" : "Explore & get inspired",
      desc: lang === "es"
        ? "Navega por categorías, proyectos DIY y tendencias. Encuentra ideas para tu próximo proyecto del hogar."
        : "Browse categories, DIY projects, and trends. Find ideas for your next home project.",
    },
    {
      num: "2",
      icon: "📋",
      title: lang === "es" ? "Planifica tu proyecto" : "Plan your project",
      desc: lang === "es"
        ? "Usa nuestro planificador para recibir estimaciones de presupuesto, tiempos y recomendaciones personalizadas."
        : "Use our planner to get budget estimates, timelines, and personalized recommendations.",
    },
    {
      num: "3",
      icon: "🔍",
      title: lang === "es" ? "Encuentra al profesional ideal" : "Find the right pro",
      desc: lang === "es"
        ? "Conecta con contratistas locales verificados. Ve sus perfiles, servicios y áreas de servicio."
        : "Connect with verified local contractors. View their profiles, services, and service areas.",
    },
    {
      num: "4",
      icon: "📅",
      title: lang === "es" ? "Reserva una consulta" : "Book a consultation",
      desc: lang === "es"
        ? "Envía los detalles de tu proyecto y el profesional te contactará directamente para coordinar."
        : "Send your project details and the professional will contact you directly to coordinate.",
    },
  ];

  return (
    <>
      <Header lang={lang} />
      <main>
        <section className="bg-page py-16 sm:py-24 text-center">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h1 className="font-display text-4xl sm:text-5xl text-primary leading-tight mb-4">
              {lang === "es" ? "Cómo funciona" : "How It Works"}
            </h1>
            <p className="text-lg text-text-muted max-w-xl mx-auto">
              {lang === "es"
                ? "De la inspiración a la acción en cuatro pasos simples."
                : "From inspiration to action in four simple steps."}
            </p>
          </div>
        </section>

        <section className="bg-page pb-24">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="space-y-8">
              {steps.map((step, i) => (
                <div key={i} className="flex gap-5 items-start">
                  <div className="w-12 h-12 rounded-2xl bg-accent-gold/10 border border-accent-gold/20 flex items-center justify-center text-xl shrink-0">
                    {step.icon}
                  </div>
                  <div>
                    <span className="text-xs tracking-[0.2em] uppercase text-accent-gold font-medium">
                      {lang === "es" ? "Paso" : "Step"} {step.num}
                    </span>
                    <h2 className="font-display text-xl text-primary mt-1 mb-2">{step.title}</h2>
                    <p className="text-text-muted leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-accent-dark py-16 text-center">
          <div className="max-w-xl mx-auto px-4">
            <h2 className="font-display text-2xl text-on-dark mb-3">
              {lang === "es" ? "¿Listo para empezar?" : "Ready to get started?"}
            </h2>
            <p className="text-bone/60 text-sm mb-6">
              {lang === "es"
                ? "Explora ideas, planifica tu proyecto y conecta con profesionales locales."
                : "Explore ideas, plan your project, and connect with local professionals."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="/planner" className="bg-accent-gold text-primary font-semibold px-8 py-3.5 rounded-xl">
                {t("startPlanning", lang)}
              </a>
              <a href="/book" className="border border-bone/20 text-on-dark font-medium px-8 py-3.5 rounded-xl hover:bg-bone/5">
                {lang === "es" ? "Reservar ahora" : "Book now"}
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer lang={lang} />
    </>
  );
}
