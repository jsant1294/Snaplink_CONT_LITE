import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Header from "@/components/southline/Header";
import Footer from "@/components/southline/Footer";
import type { Lang } from "@/lib/southline-i18n";
import { demoAgents, demoTenant, formatPropertyPrice } from "@/lib/real-estate/fixtures";
import { findPropertyBySlugWithFallback } from "@/lib/real-estate/homes-fallback";
import LucioMount from "@/components/lucio/LucioMount";

const appUrl = process.env.APP_URL ?? "http://localhost:3000";
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const property = await findPropertyBySlugWithFallback(slug, demoTenant.id);
  if (!property) return { title: "Property not found | Southline Living", robots: { index: false, follow: false } };
  const url = `${appUrl}/homes/${property.slug}`;
  const images = property.imageUrls[0] ? [property.imageUrls[0]] : [];
  return {
    title: `${property.title} | Southline Living`,
    description: property.shortDescription || property.description.slice(0, 160),
    alternates: { canonical: url },
    openGraph: { title: property.title, description: property.shortDescription, url, type: "website", images },
    twitter: { card: "summary_large_image", title: property.title, description: property.shortDescription, images },
  };
}

export default async function PropertyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const lang = ((await cookies()).get("sl_lang")?.value ?? "en") as Lang;
  const property = await findPropertyBySlugWithFallback((await params).slug, demoTenant.id);
  if (!property) notFound();
  const agent = demoAgents.find((item) => item.id === property.agentId);
  return <>
    <Header lang={lang} />
    <main className="bg-page text-primary">
      <section className="relative min-h-[62vh] overflow-hidden">{property.imageUrls[0] ? <img src={property.imageUrls[0]} alt={property.title} className="absolute inset-0 h-full w-full object-cover" /> : <div className="absolute inset-0 bg-border-default" />}<div className="absolute inset-0 bg-gradient-to-t from-image-overlay/90 via-image-overlay/20 to-black/10" /><div className="relative mx-auto flex min-h-[62vh] max-w-7xl items-end px-4 pb-10 sm:pb-14"><div className="max-w-3xl text-on-dark"><p className="text-xs uppercase tracking-[0.3em] text-accent-gold">{property.status.replace("_", " ")} · {property.city}</p><h1 className="mt-4 font-display text-4xl sm:text-6xl">{property.title}</h1><p className="mt-3 text-on-dark-muted">{property.address}, {property.city}, {property.state} {property.postalCode}</p><div className="mt-6 flex flex-wrap gap-5 text-sm"><b className="text-xl">{formatPropertyPrice(property.price)}</b><span>{property.bedrooms} {lang === "es" ? "hab." : "beds"}</span><span>{property.bathrooms} {lang === "es" ? "baños" : "baths"}</span><span>{property.squareFeet.toLocaleString()} sq ft</span></div></div></div></section>
      {property.imageUrls.length > 1 && <section className="mx-auto grid max-w-7xl grid-cols-2 gap-3 px-4 pt-8 md:grid-cols-3">{property.imageUrls.slice(1).map((image, index) => <img key={image} src={image} alt={`${property.title} ${index + 2}`} loading="lazy" className="h-48 w-full rounded-[18px] object-cover sm:h-64" />)}</section>}
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 lg:grid-cols-[1fr_340px]"><article><p className="text-xs uppercase tracking-[0.25em] text-secondary">{property.propertyType.replaceAll("_", " ")}{property.yearBuilt ? ` · ${lang === "es" ? "Construida" : "Built"} ${property.yearBuilt}` : ""}</p><h2 className="mt-3 font-display text-3xl">{lang === "es" ? "Acerca de esta propiedad" : "About this property"}</h2><p className="mt-5 max-w-3xl whitespace-pre-line leading-7 text-secondary">{property.description}</p><div className="mt-10 grid gap-8 sm:grid-cols-2"><div><h2 className="font-display text-2xl">{lang === "es" ? "Características" : "Features"}</h2><ul className="mt-4 space-y-2">{property.features.map((item) => <li key={item} className="border-b border-border-default pb-2 text-sm text-secondary">{item}</li>)}</ul></div><div><h2 className="font-display text-2xl">{lang === "es" ? "Comodidades" : "Amenities"}</h2><ul className="mt-4 space-y-2">{property.amenities.map((item) => <li key={item} className="border-b border-border-default pb-2 text-sm text-secondary">{item}</li>)}</ul></div></div><div className="mt-10 grid h-64 place-items-center rounded-[18px] border border-border-default bg-surface text-center"><div><p className="font-display text-2xl">{lang === "es" ? "Ubicación" : "Location"}</p><p className="mt-2 text-sm text-text-muted">{property.city}, {property.state}</p><p className="mt-1 text-xs text-text-muted">{lang === "es" ? "Mapa disponible próximamente" : "Map integration coming later"}</p></div></div></article>
        <aside><div className="sticky top-24 rounded-[18px] bg-accent-dark p-6 text-on-dark shadow-xl">{agent && <><div className="flex gap-3">{agent.photoUrl && <img src={agent.photoUrl} alt={agent.name} className="h-14 w-14 rounded-xl object-cover object-[center_20%]" />}<div><p className="font-display text-xl">{agent.name}</p><p className="mt-1 text-xs text-on-dark-muted">{agent.brokerageName}</p></div></div><p className="mt-5 text-sm leading-relaxed text-on-dark-muted">{lang === "es" ? "Contacta al profesional de la propiedad para obtener más información." : "Contact the listing professional for more information."}</p><a href={`mailto:${agent.email}?subject=${encodeURIComponent(property.title)}`} className="mt-5 block rounded-xl bg-accent-gold px-4 py-3 text-center text-sm font-semibold text-primary">{lang === "es" ? "Contactar agente" : "Contact agent"}</a><a href={`mailto:${agent.email}?subject=${encodeURIComponent(`Showing request: ${property.title}`)}`} className="mt-3 block rounded-xl border border-accent-gold/50 px-4 py-3 text-center text-sm text-accent-gold">{lang === "es" ? "Solicitar visita" : "Request showing"}</a></>}</div></aside>
      </section>
    </main>
    <Footer lang={lang} />
    <LucioMount lang={lang} pageContext={{ type: "property", ref: property.slug }} />
  </>;
}
