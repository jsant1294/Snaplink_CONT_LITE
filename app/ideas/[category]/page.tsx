import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import type { Lang } from "@/lib/southline-i18n";
import { t } from "@/lib/southline-i18n";
import { listProjects } from "@/lib/southline-diy";
import { contractorStore } from "@/lib/store";
import { categoryIdsForContractor } from "@/lib/southline-search";
import { professionPlaceholderPhotoFor, professionTypeLabel } from "@/lib/profession-types";
import Header from "@/components/southline/Header";
import Footer from "@/components/southline/Footer";
import Link from "next/link";

export const dynamic = "force-dynamic";

const CATEGORY_LABELS: Record<string, { es: string; en: string }> = {
  cocinas: { es: "Cocinas", en: "Kitchens" },
  banos: { es: "Baños", en: "Bathrooms" },
  patios: { es: "Patios", en: "Patios" },
  "vida-al-aire-libre": { es: "Vida al aire libre", en: "Outdoor Living" },
  jardineria: { es: "Jardinería", en: "Gardening" },
  oficinas: { es: "Oficinas en casa", en: "Home Offices" },
  garajes: { es: "Garajes y talleres", en: "Garages & Workshops" },
  almacenamiento: { es: "Almacenamiento", en: "Storage" },
  ampliaciones: { es: "Ampliaciones", en: "Home Additions" },
  reparaciones: { es: "Reparaciones", en: "Repairs" },
  diy: { es: "Proyectos DIY", en: "DIY Projects" },
};

const CATEGORY_TO_DIY: Record<string, string> = {
  cocinas: "catCocinas",
  banos: "catBanos",
  patios: "catPatios",
  jardineria: "catJardineria",
  reparaciones: "catReparaciones",
  diy: "catDIY",
};

// Maps this page's homeowner-facing idea categories onto the contractor
// service-vertical taxonomy (lib/services.ts SERVICE_CATEGORIES) so the
// "Professionals" section on each category page actually shows professionals
// relevant to that category, instead of the same unfiltered list everywhere.
// Not a new taxonomy — just a bridge between two that already exist.
const CATEGORY_TO_SERVICE_CATEGORIES: Record<string, string[]> = {
  cocinas: ["remodeling"],
  banos: ["remodeling", "plumbing"],
  patios: ["outdoor", "concrete"],
  "vida-al-aire-libre": ["outdoor"],
  jardineria: ["outdoor"],
  oficinas: ["remodeling"],
  garajes: ["remodeling", "handyman"],
  almacenamiento: ["handyman", "remodeling"],
  ampliaciones: ["remodeling", "concrete"],
  reparaciones: ["handyman", "plumbing", "electrical"],
  diy: ["handyman"],
};

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const cookieStore = await cookies();
  const lang = (cookieStore.get("sl_lang")?.value ?? "en") as Lang;

  const label = CATEGORY_LABELS[category];
  if (!label) notFound();

  const allProjects = await listProjects();
  const diyKey = CATEGORY_TO_DIY[category];
  const projects = diyKey ? allProjects.filter((p) => p.category === diyKey) : [];
  const allContractors = await contractorStore.list().catch(() => []);
  const wantedServiceCategories = CATEGORY_TO_SERVICE_CATEGORIES[category] ?? [];
  const contractors = allContractors
    .filter((c) => categoryIdsForContractor(c).some((id) => wantedServiceCategories.includes(id)))
    .slice(0, 6);

  return (
    <>
      <Header lang={lang} />
      <main>
        {/* Breadcrumb */}
        <div className="bg-page border-b border-border-default">
          <div className="max-w-5xl mx-auto px-4 py-3 text-xs text-text-muted/60">
            <Link href="/" className="hover:text-accent-gold transition-colors">{t("navHome", lang)}</Link>
            <span className="mx-2">/</span>
            <span className="text-primary">{label[lang]}</span>
          </div>
        </div>

        {/* Hero */}
        <section className="bg-page py-16 text-center">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h1 className="font-display text-4xl sm:text-5xl text-primary leading-tight mb-4">
              {label[lang]}
            </h1>
            <p className="text-text-muted max-w-lg mx-auto">
              {lang === "es"
                ? `Explora proyectos e ideas para ${label.es.toLowerCase()}. Encuentra inspiración y profesionales locales.`
                : `Explore projects and ideas for ${label.en.toLowerCase()}. Find inspiration and local professionals.`}
            </p>
          </div>
        </section>

        {/* DIY Projects */}
        {projects.length > 0 && (
          <section className="bg-page pb-12">
            <div className="max-w-5xl mx-auto px-4 sm:px-6">
              <h2 className="font-display text-xl text-primary mb-6">{t("diyTitle", lang)}</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((p) => (
                  <Link
                    key={p.id}
                    href={`/diy/${p.slug}`}
                    className="marketplace-card marketplace-card-body hover:shadow-lg transition-all"
                  >
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      p.difficulty === "easy" ? "bg-accent-green/15 text-secondary" : p.difficulty === "medium" ? "bg-accent-gold/15 text-accent-gold-text" : "bg-state-error/15 text-state-error"
                    }`}>
                      {t(p.difficulty === "easy" ? "diyEasy" : p.difficulty === "medium" ? "diyMedium" : "diyHard", lang)}
                    </span>
                    <h3 className="font-display text-base text-primary mt-2 mb-1">
                      {lang === "es" ? p.titleEs : p.titleEn}
                    </h3>
                    <p className="text-xs text-text-muted line-clamp-2">{lang === "es" ? p.descEs : p.descEn}</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Contractors */}
        <section className="bg-page pb-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <h2 className="font-display text-xl text-primary mb-6 pt-12">{t("featuredTitle", lang)}</h2>
            {contractors.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {contractors.map((c) => (
                  <Link
                    key={c.id}
                    href={`/contractor/${c.username}`}
                    className="marketplace-card hover:shadow-lg transition-all flex flex-col"
                  >
                    <div className="marketplace-card-media">
                      <img
                        src={c.avatarUrl || c.logoUrl || professionPlaceholderPhotoFor(c.id, c.professionType)}
                        alt=""
                        loading="lazy"
                        className="marketplace-image-project"
                      />
                      <span className="absolute left-3 top-3 rounded-full bg-accent-dark/80 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-on-dark">
                        {professionTypeLabel(c.professionType, lang)}
                      </span>
                    </div>
                    <div className="marketplace-card-body">
                      <h3 className="font-display text-base text-primary mb-1">{c.businessName}</h3>
                      {c.tagline && <p className="text-xs text-text-muted line-clamp-2">{c.tagline}</p>}
                      <span className="text-xs text-accent-gold mt-2 block">{t("viewProfile", lang)} →</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-border-default bg-surface px-6 py-10 text-center">
                <p className="text-sm text-text-muted">{t("noProfessionalsYet", lang)}</p>
              </div>
            )}
            <div className="mt-8 text-center">
              <Link href="/results" className="text-sm font-medium text-accent-gold hover:underline">
                {t("browseAllServices", lang)} →
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer lang={lang} />
    </>
  );
}
