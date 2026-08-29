import { cookies } from "next/headers";
import { contractorStore } from "@/lib/store";
import type { Lang } from "@/lib/southline-i18n";
import Header from "@/components/southline/Header";
import Footer from "@/components/southline/Footer";
import ProjectPlanner from "@/components/southline/ProjectPlanner";
import LucioMount from "@/components/lucio/LucioMount";

export const dynamic = "force-dynamic";

export default async function PlannerPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("sl_lang")?.value ?? "en") as Lang;

  const contractors = (await contractorStore.list().catch(() => [])).filter((c) => !c.isDemo);

  return (
    <>
      <Header lang={lang} />
      <main>
        <div className="bg-page py-8 sm:py-12 text-center">
          <p className="text-xs tracking-[0.35em] uppercase text-accent-gold font-medium mb-3">
            Southline Living
          </p>
          <h1 className="font-display text-3xl sm:text-4xl text-primary leading-tight mb-2">
            {lang === "es" ? "Planifica tu proyecto" : "Plan Your Project"}
          </h1>
          <p className="text-text-muted max-w-xl mx-auto px-4">
            {lang === "es"
              ? "Cuéntanos sobre tu proyecto y te daremos un presupuesto estimado, tiempos y recomendaciones de profesionales."
              : "Tell us about your project and we'll give you an estimated budget, timeline, and professional recommendations."}
          </p>
        </div>
        <ProjectPlanner lang={lang} contractors={contractors} />
      </main>
      <Footer lang={lang} />
      <LucioMount lang={lang} pageContext={{ type: "planner" }} />
    </>
  );
}
