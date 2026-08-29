import { cookies } from "next/headers";
import { contractorStore } from "@/lib/store";
import type { Lang } from "@/lib/southline-i18n";
import Header from "@/components/southline/Header";
import Footer from "@/components/southline/Footer";
import RecruitmentForm from "@/components/southline/RecruitmentForm";

export const dynamic = "force-dynamic";

export default async function ForContractorsPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("sl_lang")?.value ?? "en") as Lang;

  const contractors = (await contractorStore.list().catch(() => [])).filter((c) => !c.isDemo);

  return (
    <>
      <Header lang={lang} />
      <main>
        {/* Hero */}
        <section className="bg-gradient-to-b from-cream to-sand/30 py-16 sm:py-24 text-center">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <p className="text-xs tracking-[0.35em] uppercase text-gold font-medium mb-3">
              Snaplink
            </p>
            <h1 className="font-display text-4xl sm:text-5xl text-obsidian leading-tight mb-4">
              {lang === "es"
                ? "Haz crecer tu negocio. Consigue más trabajos locales."
                : "Grow your business. Get more local jobs."}
            </h1>
            <p className="text-lg text-clay max-w-xl mx-auto mb-3">
              {lang === "es"
                ? "Deja de depender solo de recomendaciones. Haz que nuevos clientes te encuentren."
                : "Stop relying only on referrals. Let new clients find you."}
            </p>
            <p className="text-sm text-clay/80 max-w-lg mx-auto">
              {lang === "es"
                ? "Crea una presencia profesional, muestra tu trabajo, recibe oportunidades locales y permite que los propietarios te contacten o reserven directamente."
                : "Create a professional presence, showcase your work, receive local opportunities, and let homeowners contact or book you directly."}
            </p>
          </div>
        </section>

        {/* Benefits */}
        <section className="bg-cream py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                {
                  icon: "📱",
                  title: lang === "es" ? "Presencia profesional" : "Professional presence",
                  desc: lang === "es"
                    ? "Tu propia página pública con servicios, fotos, reseñas y contacto directo."
                    : "Your own public page with services, photos, reviews, and direct contact.",
                },
                {
                  icon: "📋",
                  title: lang === "es" ? "Clientes organizados" : "Organized clients",
                  desc: lang === "es"
                    ? "Cada solicitud de cliente llega a tu tablero con resumen IA y seguimiento."
                    : "Every client request lands in your dashboard with AI summary and tracking.",
                },
                {
                  icon: "📄",
                  title: lang === "es" ? "Presupuestos y PDFs" : "Estimates & PDFs",
                  desc: lang === "es"
                    ? "Crea presupuestos profesionales con PDF, propuestas e invoices en ambos idiomas."
                    : "Create professional estimates with PDFs, proposals, and invoices in both languages.",
                },
              ].map((benefit, i) => (
                <div key={i} className="bg-paper rounded-2xl border border-sand/40 p-6 text-center">
                  <span className="text-3xl mb-3 block">{benefit.icon}</span>
                  <h3 className="font-display text-lg text-obsidian mb-2">{benefit.title}</h3>
                  <p className="text-sm text-clay">{benefit.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Form */}
        <section className="bg-sand/20 py-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h2 className="font-display text-2xl sm:text-3xl text-obsidian text-center mb-2">
              {lang === "es" ? "Empieza hoy" : "Start today"}
            </h2>
            <p className="text-clay text-center text-sm mb-8">
              {lang === "es"
                ? "Déjanos tus datos y te contactaremos para crear tu perfil profesional."
                : "Leave your info and we'll contact you to set up your professional profile."}
            </p>
            <RecruitmentForm lang={lang} contractors={contractors} />
          </div>
        </section>

        {/* Existing contractors CTA */}
        <section className="bg-cream py-16 text-center">
          <div className="max-w-xl mx-auto px-4">
            <h2 className="font-display text-2xl text-obsidian mb-2">
              {lang === "es" ? "¿Ya tienes cuenta?" : "Already have an account?"}
            </h2>
            <p className="text-clay text-sm mb-6">
              {lang === "es"
                ? "Accede a tu panel de control para gestionar prospectos, presupuestos y más."
                : "Access your dashboard to manage leads, estimates, and more."}
            </p>
            <a
              href="/contractor-admin"
              className="bg-obsidian text-cream font-semibold px-8 py-3.5 rounded-xl inline-block hover:bg-obsidian/90 transition-colors"
            >
              {lang === "es" ? "Acceder al panel" : "Go to dashboard"}
            </a>
          </div>
        </section>
      </main>
      <Footer lang={lang} />
    </>
  );
}
