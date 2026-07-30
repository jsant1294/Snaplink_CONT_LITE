import Link from "next/link";
import { demoAppointments, demoLeads, demoProperties, formatPropertyPrice } from "@/lib/real-estate/fixtures";
import Icon, { type IconName } from "./Icon";

const actions: { label: string; href: string; icon: IconName }[] = [
  { label: "New Property", href: "/real-estate/properties", icon: "home" },
  { label: "Create Campaign", href: "/real-estate/campaigns", icon: "campaign" },
  { label: "Generate QR", href: "/real-estate/qr-codes", icon: "qr" },
  { label: "Schedule Showing", href: "/real-estate/open-houses", icon: "calendar" },
  { label: "Create Flyer", href: "/real-estate/marketing-assets", icon: "image" },
  { label: "Add Buyer", href: "/real-estate/buyers", icon: "users" },
];

export default function RealEstateDashboard() {
  const propertyViews = demoProperties.reduce((sum, property) => sum + property.viewCount, 0);
  const qrScans = demoProperties.reduce((sum, property) => sum + property.qrScanCount, 0);
  const metrics = [
    ["Property views", propertyViews.toLocaleString(), "chart" as const],
    ["QR scans", qrScans.toLocaleString(), "qr" as const],
    ["Appointments", demoAppointments.length.toString(), "calendar" as const],
    ["Recent leads", demoLeads.length.toString(), "lead" as const],
  ];
  return <div className="mx-auto max-w-[1450px] p-4 sm:p-6 lg:p-8">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs uppercase tracking-[0.22em] text-[#B99A5B]">Phase 1 demonstration</p><h1 className="mt-2 font-display text-3xl text-[#F3EEE5] sm:text-4xl">Real Estate dashboard</h1><p className="mt-2 text-sm text-[#9FA098]">A fixture-powered preview of the professional workspace.</p></div><Link href="/real-estate/properties" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#B99A5B] px-4 py-3 text-sm font-semibold text-[#1A1C18]"><Icon name="plus" className="h-4 w-4" />New property</Link></div>
    <div className="mt-8 grid grid-cols-2 gap-3 xl:grid-cols-4">{metrics.map(([label, value, icon]) => <div key={label} className="rounded-2xl border border-white/[0.08] bg-[#20231F] p-5"><Icon name={icon as IconName} className="h-5 w-5 text-[#A88C52]" /><p className="mt-5 font-display text-3xl">{value}</p><p className="mt-1 text-xs text-[#9FA098]">{label}</p></div>)}</div>
    <section className="mt-6 rounded-2xl border border-white/[0.08] bg-[#20231F] p-5"><h2 className="font-display text-xl">Quick actions</h2><div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">{actions.map((action) => <Link key={action.label} href={action.href} className="rounded-xl border border-white/[0.07] bg-[#272A25] p-3 hover:border-[#B99A5B]/40"><Icon name={action.icon} className="h-4 w-4 text-[#B99A5B]" /><span className="mt-3 block text-xs text-[#D5D1C8]">{action.label}</span></Link>)}</div></section>
    <div className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
      <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#20231F]"><div className="border-b border-white/[0.07] p-5"><h2 className="font-display text-xl">Recent leads</h2></div><div className="divide-y divide-white/[0.06]">{demoLeads.map((lead) => <div key={lead.id} className="grid gap-2 p-4 sm:grid-cols-[1fr_1fr_auto]"><div><p className="text-sm font-medium">{lead.name}</p><p className="mt-1 text-xs text-[#8F928A]">{lead.type} · {lead.source}</p></div><p className="text-xs text-[#AAA9A2]">{lead.preferredCities.join(", ")}<br />{lead.budget ?? "Budget pending"}</p><span className="self-start rounded-full border border-[#789071]/30 bg-[#789071]/10 px-2 py-1 text-[10px] text-[#9BB294]">{lead.stage.replaceAll("_", " ")}</span></div>)}</div></section>
      <section className="rounded-2xl border border-white/[0.08] bg-[#20231F] p-5"><h2 className="font-display text-xl">Upcoming activity</h2><div className="mt-5 space-y-4">{demoAppointments.map((appointment) => <div key={appointment.id} className="flex gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#2B3028] text-[#B99A5B]"><Icon name="calendar" className="h-4 w-4" /></span><div><p className="text-sm">{appointment.type.replaceAll("_", " ")}</p><p className="mt-1 text-xs text-[#9A9D94]">{new Date(appointment.startsAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p></div></div>)}</div></section>
    </div>
    <section className="mt-6"><div className="mb-4 flex justify-between"><h2 className="font-display text-xl">Property performance</h2><Link href="/real-estate/properties" className="text-xs text-[#C4A562]">View properties</Link></div><div className="grid gap-4 md:grid-cols-3">{demoProperties.map((property) => <article key={property.id} className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#20231F]"><img src={property.imageUrls[0]} alt="" className="h-36 w-full object-cover" /><div className="p-4"><p className="text-[10px] uppercase tracking-widest text-[#A88C52]">{property.status.replace("_", " ")}</p><h3 className="mt-2 text-sm">{property.address}</h3><p className="mt-1 text-xs text-[#92958D]">{formatPropertyPrice(property.price)} · {property.bedrooms} bd · {property.bathrooms} ba</p><div className="mt-4 flex gap-4 border-t border-white/[0.06] pt-3 text-[11px] text-[#8D9088]"><span>{property.viewCount.toLocaleString()} views</span><span>{property.qrScanCount} scans</span></div></div></article>)}</div></section>
  </div>;
}
