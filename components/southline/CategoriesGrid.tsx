import { t, type Lang } from "@/lib/southline-i18n";
import Link from "next/link";

export interface EditorialCategory {
  slug: string;
  image: string;
  titleEs: string;
  titleEn: string;
  subtitleEs: string;
  subtitleEn: string;
  featured: boolean;
  ctaEs: string;
  ctaEn: string;
}

// Stock-quality fallbacks. The CMS can pass the same shape without changing
// the component when editorial category management is connected.
export const DEFAULT_CATEGORIES: EditorialCategory[] = [
  {
    slug: "cocinas",
    image: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=900&q=85",
    titleEs: "Cocinas",
    titleEn: "Kitchens",
    subtitleEs: "Cocinas de lujo",
    subtitleEn: "Luxury kitchens",
    featured: true,
    ctaEs: "Explorar cocinas",
    ctaEn: "Explore kitchens",
  },
  {
    slug: "banos",
    image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=900&q=85",
    titleEs: "Baños",
    titleEn: "Bathrooms",
    subtitleEs: "Refugios inspirados en spas",
    subtitleEn: "Spa-inspired retreats",
    featured: true,
    ctaEs: "Explorar baños",
    ctaEn: "Explore bathrooms",
  },
  {
    slug: "patios",
    image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=900&q=85",
    titleEs: "Patios",
    titleEn: "Patios",
    subtitleEs: "Espacios para compartir",
    subtitleEn: "Spaces made for gathering",
    featured: false,
    ctaEs: "Explorar patios",
    ctaEn: "Explore patios",
  },
  {
    slug: "vida-al-aire-libre",
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=900&q=85",
    titleEs: "Vida al aire libre",
    titleEn: "Outdoor Living",
    subtitleEs: "Entretenimiento al aire libre",
    subtitleEn: "Outdoor entertaining",
    featured: true,
    ctaEs: "Ver ideas",
    ctaEn: "View ideas",
  },
  {
    slug: "jardineria",
    image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=900&q=85",
    titleEs: "Jardinería",
    titleEn: "Gardening",
    subtitleEs: "Jardines con intención",
    subtitleEn: "Landscapes with intention",
    featured: false,
    ctaEs: "Explorar jardines",
    ctaEn: "Explore gardens",
  },
  {
    slug: "oficinas",
    image: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=900&q=85",
    titleEs: "Oficinas en casa",
    titleEn: "Home Offices",
    subtitleEs: "Espacios de trabajo modernos",
    subtitleEn: "Modern workspaces",
    featured: false,
    ctaEs: "Ver oficinas",
    ctaEn: "View offices",
  },
  {
    slug: "garajes",
    image: "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=900&q=85",
    titleEs: "Garajes y talleres",
    titleEn: "Garage & Workshop",
    subtitleEs: "Talleres organizados",
    subtitleEn: "Organized workshops",
    featured: false,
    ctaEs: "Explorar talleres",
    ctaEn: "Explore workshops",
  },
  {
    slug: "almacenamiento",
    image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=900&q=85",
    titleEs: "Almacenamiento",
    titleEn: "Storage",
    subtitleEs: "Orden hecho a medida",
    subtitleEn: "Custom organization",
    featured: false,
    ctaEs: "Ver soluciones",
    ctaEn: "View solutions",
  },
  {
    slug: "ampliaciones",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=85",
    titleEs: "Ampliaciones",
    titleEn: "Home Additions",
    subtitleEs: "Más espacio, bien diseñado",
    subtitleEn: "More space, beautifully considered",
    featured: true,
    ctaEs: "Explorar ampliaciones",
    ctaEn: "Explore additions",
  },
  {
    slug: "reparaciones",
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=900&q=85",
    titleEs: "Reparaciones",
    titleEn: "Repairs",
    subtitleEs: "Cuidado profesional del hogar",
    subtitleEn: "Professional home care",
    featured: false,
    ctaEs: "Ver reparaciones",
    ctaEn: "View repairs",
  },
  {
    slug: "diy",
    image: "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=900&q=85",
    titleEs: "Proyectos DIY",
    titleEn: "DIY",
    subtitleEs: "Constrúyelo tú mismo",
    subtitleEn: "Build it yourself",
    featured: false,
    ctaEs: "Explorar proyectos",
    ctaEn: "Explore projects",
  },
];

export default function CategoriesGrid({
  lang,
  categories = DEFAULT_CATEGORIES,
}: {
  lang: Lang;
  categories?: EditorialCategory[];
}) {
  return (
    <section id="categories" className="bg-ivory py-14 sm:py-20">
      <div className="max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-12">
          <p className="text-xs tracking-[0.35em] uppercase text-gold font-medium mb-3">
            {t("inspirationTitle", lang)}
          </p>
          <h2 className="font-display text-3xl sm:text-4xl text-obsidian leading-tight">
            {t("inspirationSubtitle", lang)}
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-5">
          {categories.map((category) => {
            const title = lang === "es" ? category.titleEs : category.titleEn;
            const subtitle = lang === "es" ? category.subtitleEs : category.subtitleEn;
            const cta = lang === "es" ? category.ctaEs : category.ctaEn;

            return (
              <Link
                key={category.slug}
                href={`/ideas/${category.slug}`}
                aria-label={`${cta}: ${title}`}
                className="group relative isolate h-[230px] sm:h-[250px] overflow-hidden rounded-[18px] border border-cream/10 bg-snaplink-charcoal shadow-[0_18px_40px_rgba(0,0,0,0.18)] transition-[transform,box-shadow] duration-[225ms] ease-out hover:-translate-y-1 hover:shadow-[0_24px_48px_rgba(37,35,31,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-snaplink-gold focus-visible:ring-offset-2 focus-visible:ring-offset-ivory"
              >
                <img
                  src={category.image}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-[225ms] ease-out group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/20 to-black/70 transition-opacity duration-[225ms] ease-out group-hover:opacity-90" />

                {category.featured && (
                  <span className="absolute right-3 top-3 h-1.5 w-8 rounded-full bg-snaplink-gold/80" />
                )}

                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 transition-transform duration-[225ms] ease-out group-hover:-translate-y-1">
                  <h3 className="font-display text-xl sm:text-2xl font-semibold leading-none text-snaplink-cream">
                    {title}
                  </h3>
                  <p className="mt-1.5 text-[11px] sm:text-xs leading-snug text-snaplink-cream/75">
                    {subtitle}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
