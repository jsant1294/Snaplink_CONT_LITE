import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import Header from "@/components/southline/Header";
import Footer from "@/components/southline/Footer";
import type { Lang } from "@/lib/southline-i18n";
import { demoAgents, demoTenant, formatPropertyPrice } from "@/lib/real-estate/fixtures";
import { listPublishedRentalsWithFallback } from "@/lib/real-estate/homes-fallback";
import LucioMount from "@/components/lucio/LucioMount";

const appUrl = process.env.APP_URL ?? "http://localhost:3000";

export const dynamic = "force-dynamic";

async function currentLang(): Promise<Lang> {
  return ((await cookies()).get("sl_lang")?.value ?? "en") as Lang;
}

export async function generateMetadata(): Promise<Metadata> {
  const lang = await currentLang();
  const first = (await listPublishedRentalsWithFallback(demoTenant.id, { pageSize: 1 })).properties[0];
  const images = first?.imageUrls[0] ? [first.imageUrls[0]] : [];
  const title = lang === "es" ? "Alquileres y Escapadas | Southline Living" : "Rentals & Getaways | Southline Living";
  const description = lang === "es"
    ? "Casas en renta y escapadas publicadas por profesionales locales de SnapLink."
    : "Rental homes and getaway stays published by local SnapLink professionals.";
  return {
    title,
    description,
    alternates: { canonical: `${appUrl}/rentals` },
    openGraph: { title, description, url: `${appUrl}/rentals`, type: "website", images },
    twitter: { card: "summary_large_image", title, description, images },
  };
}

export default async function RentalsPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const lang = await currentLang();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const result = await listPublishedRentalsWithFallback(demoTenant.id, { search: params.q, page, pageSize: 9 });
  const pages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const heroImage = result.properties[0]?.imageUrls[0];
  return <>
    <Header lang={lang} />
    <main className="min-h-screen bg-[#EEE7DA] text-[#2F2923]">
      <section className="relative overflow-hidden border-b border-walnut/15">
        {heroImage ? <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover" /> : <div className="absolute inset-0 bg-[#BDAF9D]" />}
        <div className="absolute inset-0 bg-gradient-to-t from-[#191714]/90 via-[#211E19]/40 to-black/10" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:py-24">
          <p className="text-xs uppercase tracking-[0.3em] text-[#D6AD55]">Southline Living · {lang === "es" ? "Alquileres y Escapadas" : "Rentals & Getaways"}</p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl leading-tight text-[#F5EFE4] sm:text-6xl">{lang === "es" ? "Encuentra tu estancia, de temporada o a largo plazo." : "Find your stay, seasonal or long-term."}</h1>
          <p className="mt-4 max-w-2xl leading-relaxed text-[#E6DED1]">{lang === "es" ? "Casas en renta y escapadas publicadas por profesionales locales de SnapLink." : "Rental homes and getaway stays published by local SnapLink professionals."}</p>
          <form className="mt-7 flex max-w-xl gap-2">
            <input name="q" defaultValue={params.q} placeholder={lang === "es" ? "Buscar por ciudad o título" : "Search by city or title"} className="min-w-0 flex-1 rounded-xl border border-[#F5EFE4]/30 bg-[#F5EFE4]/90 px-4 py-3 text-base text-[#2F2923] placeholder:text-[#6F552A]/60 outline-none focus:border-[#D6AD55] focus-visible:ring-2 focus-visible:ring-[#F5EFE4] focus-visible:ring-offset-2 focus-visible:ring-offset-[#191714]" />
            <button className="rounded-xl bg-[#D6AD55] px-5 py-3 text-sm font-semibold text-[#2F2923]">{lang === "es" ? "Buscar" : "Search"}</button>
          </form>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
        {result.properties.length === 0 ? <div className="rounded-[18px] border border-walnut/15 bg-[#E4DACB] p-10 text-center"><h2 className="font-display text-2xl">{lang === "es" ? "No hay alquileres disponibles" : "No rentals available"}</h2><p className="mt-2 text-sm text-[#6A5F55]">{lang === "es" ? "Prueba otra búsqueda o vuelve pronto." : "Try another search or check back soon."}</p><Link href="/homes" className="mt-5 inline-block rounded-xl bg-[#2F2923] px-5 py-3 text-sm font-semibold text-[#F5EFE4]">{lang === "es" ? "Explorar casas en venta" : "Browse homes for sale"}</Link></div> :
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{result.properties.map((property) => {
          const agent = demoAgents.find((item) => item.id === property.agentId);
          return <Link key={property.id} href={`/homes/${property.slug}`} className="group overflow-hidden rounded-[18px] border border-walnut/15 bg-[#E4DACB] shadow-[0_16px_36px_rgba(47,41,35,0.12)]"><div className="relative h-64 overflow-hidden">{property.imageUrls[0] ? <img src={property.imageUrls[0]} alt={`${property.title}, ${property.city}`} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" /> : <div className="h-full bg-[#CFC2B0]" />}<span className="absolute left-4 top-4 rounded-full bg-[#25231F]/90 px-3 py-1.5 text-[10px] uppercase tracking-wider text-[#E0C276]">{lang === "es" ? "Alquiler" : "Rental"}</span></div><div className="p-5"><p className="text-lg font-semibold">{formatPropertyPrice(property.price)}</p><h2 className="mt-2 font-display text-2xl">{property.title}</h2><p className="mt-1 text-sm text-[#6A5F55]">{property.city}, {property.state} · {property.bedrooms} bd · {property.bathrooms} ba · {property.squareFeet.toLocaleString()} sq ft</p>{agent && <p className="mt-4 border-t border-walnut/10 pt-3 text-xs text-[#6F552A]">{lang === "es" ? "Agente" : "Listed by"} {agent.name}</p>}<p className="mt-3 text-sm font-semibold text-[#6F552A]">{lang === "es" ? "Ver alquiler" : "View rental"} →</p></div></Link>;
        })}</div>}
        {result.total > result.pageSize && <nav aria-label="Rental pages" className="mt-8 flex items-center justify-center gap-3">{page > 1 && <Link href={`/rentals?q=${encodeURIComponent(params.q ?? "")}&page=${page - 1}`} className="rounded-xl border border-walnut/20 px-4 py-2 text-sm">{lang === "es" ? "Anterior" : "Previous"}</Link>}<span className="text-sm text-[#6A5F55]">{page} / {pages}</span>{page < pages && <Link href={`/rentals?q=${encodeURIComponent(params.q ?? "")}&page=${page + 1}`} className="rounded-xl border border-walnut/20 px-4 py-2 text-sm">{lang === "es" ? "Siguiente" : "Next"}</Link>}</nav>}
      </section>
    </main>
    <Footer lang={lang} />
    <LucioMount lang={lang} pageContext={{ type: "rentals" }} />
  </>;
}
