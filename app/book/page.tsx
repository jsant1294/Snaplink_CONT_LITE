import { cookies } from "next/headers";
import { contractorStore } from "@/lib/store";
import type { Lang } from "@/lib/southline-i18n";
import Header from "@/components/southline/Header";
import Footer from "@/components/southline/Footer";
import BookingFlow from "@/components/southline/BookingFlow";

export const dynamic = "force-dynamic";

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ contractor?: string }>;
}) {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("sl_lang")?.value ?? "en") as Lang;
  const { contractor: contractorId } = await searchParams;

  const contractors = await contractorStore.list().catch(() => []);

  return (
    <>
      <Header lang={lang} />
      <main>
        <div className="bg-gradient-to-b from-cream to-sand/30 py-8 sm:py-12 text-center">
          <p className="text-xs tracking-[0.35em] uppercase text-gold font-medium mb-3">
            Southline Living
          </p>
          <h1 className="font-display text-3xl sm:text-4xl text-obsidian leading-tight mb-2">
            {lang === "es" ? "Reserva una consulta" : "Book a Consultation"}
          </h1>
          <p className="text-clay max-w-xl mx-auto px-4">
            {lang === "es"
              ? "Cuéntanos sobre tu proyecto y un profesional de Snaplink te contactará."
              : "Tell us about your project and a Snaplink professional will reach out."}
          </p>
        </div>
        <BookingFlow
          lang={lang}
          contractors={contractors}
          preselectedContractorId={contractorId}
        />
      </main>
      <Footer lang={lang} />
    </>
  );
}
