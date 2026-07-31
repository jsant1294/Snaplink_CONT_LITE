import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import Header from "@/components/southline/Header";
import Footer from "@/components/southline/Footer";
import type { Lang } from "@/lib/southline-i18n";
import { demoAgents, demoTenant, formatPropertyPrice } from "@/lib/real-estate/fixtures";
import { listPublishedPropertiesWithFallback } from "@/lib/real-estate/homes-fallback";
import LucioMount from "@/components/lucio/LucioMount";

const appUrl = process.env.APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: "Homes | Southline Living",
  description: "Browse published homes presented by local SnapLink real-estate professionals.",
  alternates: { canonical: `${appUrl}/homes` },
  openGraph: { title: "Homes | Southline Living", description: "Browse published homes presented by local professionals.", url: `${appUrl}/homes`, type: "website" },
  twitter: { card: "summary_large_image", title: "Homes | Southline Living", description: "Browse published homes presented by local professionals." },
};

export const dynamic = "force-dynamic";

export default async function HomesPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const lang = ((await cookies()).get("sl_lang")?.value ?? "en") as Lang;
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const result = await listPublishedPropertiesWithFallback(demoTenant.id, { search: params.q, page, pageSize: 9 });
  const pages = Math.max(1, Math.ceil(result.total / result.pageSize));
  return <>
    <Header lang={lang} />
    <main className="min-h-screen bg-[#EEE7DA] text-[#2F2923]">
      <section className="border-b border-walnut/15 px-4 py-14 sm:py-20"><div className="mx-auto max-w-7xl"><p className="text-xs uppercase tracking-[0.3em] text-[#6F552A]">Southline Living · {lang === "es" ? "Casas" : "Homes"}</p><h1 className="mt-4 max-w-3xl font-display text-4xl leading-tight sm:text-6xl">{lang === "es" ? "Hogares para tu próxima etapa" : "Homes for what comes next"}</h1><p className="mt-4 max-w-2xl leading-relaxed text-[#62584F]">{lang === "es" ? "Explora propiedades publicadas por profesionales locales de SnapLink." : "Explore properties published by local SnapLink real-estate professionals."}</p><form className="mt-7 flex max-w-xl gap-2"><input name="q" defaultValue={params.q} placeholder={lang === "es" ? "Buscar por ciudad o título" : "Search by city or title"} className="min-w-0 flex-1 rounded-xl border border-walnut/20 bg-[#F5EFE4]/70 px-4 py-3 text-base text-[#2F2923] placeholder:text-[#6F552A]/60 outline-none focus:border-[#B99552] focus-visible:ring-2 focus-visible:ring-[#2F2923] focus-visible:ring-offset-2 focus-visible:ring-offset-[#EEE7DA]" /><button className="rounded-xl bg-[#2F2923] px-5 py-3 text-sm font-semibold text-[#F5EFE4]">{lang === "es" ? "Buscar" : "Search"}</button></form></div></section>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
        {result.properties.length === 0 ? <div className="rounded-[18px] border border-walnut/15 bg-[#E4DACB] p-10 text-center"><h2 className="font-display text-2xl">{lang === "es" ? "No hay propiedades disponibles" : "No properties available"}</h2><p className="mt-2 text-sm text-[#6A5F55]">{lang === "es" ? "Prueba otra búsqueda o vuelve pronto." : "Try another search or check back soon."}</p></div> :
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{result.properties.map((property) => {
          const agent = demoAgents.find((item) => item.id === property.agentId);
          return <Link key={property.id} href={`/homes/${property.slug}`} className="group overflow-hidden rounded-[18px] border border-walnut/15 bg-[#E4DACB] shadow-[0_16px_36px_rgba(47,41,35,0.12)]"><div className="relative h-64 overflow-hidden">{property.imageUrls[0] ? <img src={property.imageUrls[0]} alt={`${property.title}, ${property.city}`} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" /> : <div className="h-full bg-[#CFC2B0]" />}<span className="absolute left-4 top-4 rounded-full bg-[#25231F]/90 px-3 py-1.5 text-[10px] uppercase tracking-wider text-[#E0C276]">{property.status.replace("_", " ")}</span></div><div className="p-5"><p className="text-lg font-semibold">{formatPropertyPrice(property.price)}</p><h2 className="mt-2 font-display text-2xl">{property.title}</h2><p className="mt-1 text-sm text-[#6A5F55]">{property.city}, {property.state} · {property.bedrooms} bd · {property.bathrooms} ba · {property.squareFeet.toLocaleString()} sq ft</p>{agent && <p className="mt-4 border-t border-walnut/10 pt-3 text-xs text-[#6F552A]">{lang === "es" ? "Agente" : "Listed by"} {agent.name}</p>}</div></Link>;
        })}</div>}
        {result.total > result.pageSize && <nav aria-label="Property pages" className="mt-8 flex items-center justify-center gap-3">{page > 1 && <Link href={`/homes?q=${encodeURIComponent(params.q ?? "")}&page=${page - 1}`} className="rounded-xl border border-walnut/20 px-4 py-2 text-sm">{lang === "es" ? "Anterior" : "Previous"}</Link>}<span className="text-sm text-[#6A5F55]">{page} / {pages}</span>{page < pages && <Link href={`/homes?q=${encodeURIComponent(params.q ?? "")}&page=${page + 1}`} className="rounded-xl border border-walnut/20 px-4 py-2 text-sm">{lang === "es" ? "Siguiente" : "Next"}</Link>}</nav>}
      </section>
    </main>
    <Footer lang={lang} />
    <LucioMount lang={lang} />
  </>;
}
