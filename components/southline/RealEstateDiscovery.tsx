import Link from "next/link";
import type { Lang } from "@/lib/southline-i18n";
import { demoProperties, formatPropertyPrice } from "@/lib/real-estate/fixtures";

export default function RealEstateDiscovery({ lang }: { lang: Lang }) {
  const property = demoProperties[0];
  return (
    <section className="bg-[#DDD1C0] py-14 sm:py-20">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="overflow-hidden rounded-[18px] border border-walnut/15 shadow-[0_18px_40px_rgba(47,41,35,0.16)]">
          <img src={property.imageUrls[0]} alt="" loading="lazy" className="h-72 w-full object-cover sm:h-96" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-[#6F552A]">
            {lang === "es" ? "Bienes raíces · Vista previa" : "Real Estate · Preview"}
          </p>
          <h2 className="mt-3 font-display text-3xl leading-tight text-[#2F2923] sm:text-4xl">
            {lang === "es" ? "Encuentra un hogar para tu próxima etapa." : "Find a home for what comes next."}
          </h2>
          <p className="mt-4 max-w-xl leading-relaxed text-[#62584F]">
            {lang === "es"
              ? "Explora una vista previa de propiedades presentadas por profesionales locales de SnapLink."
              : "Explore a preview of properties presented by local SnapLink real-estate professionals."}
          </p>
          <div className="mt-6 border-l-2 border-[#B99552] pl-4">
            <p className="font-display text-xl text-[#2F2923]">{property.address}</p>
            <p className="mt-1 text-sm text-[#6A5F55]">{formatPropertyPrice(property.price)} · {property.city}, {property.state}</p>
          </div>
          <Link href="/homes" className="mt-7 inline-flex rounded-xl bg-[#2F2923] px-6 py-3 text-sm font-semibold text-[#F5EFE4] transition-colors hover:bg-[#42392F]">
            {lang === "es" ? "Explorar casas" : "Explore homes"}
          </Link>
        </div>
      </div>
    </section>
  );
}
