import Link from "next/link";
import { demoTenant, demoUser } from "@/lib/real-estate/fixtures";
import Icon, { type IconName } from "./Icon";

const nav: { href: string; label: string; icon: IconName }[] = [
  { href: "/real-estate", label: "Dashboard", icon: "grid" },
  { href: "/real-estate/properties", label: "Properties", icon: "home" },
  { href: "/real-estate/transactions", label: "Transactions", icon: "lead" },
  { href: "/real-estate/agents", label: "Agents", icon: "user" },
  { href: "/real-estate/brokerages", label: "Brokerages", icon: "office" },
  { href: "/real-estate/buyers", label: "Buyers", icon: "users" },
  { href: "/real-estate/sellers", label: "Sellers", icon: "users" },
  { href: "/real-estate/leads", label: "Leads", icon: "lead" },
  { href: "/real-estate/showings", label: "Showings", icon: "calendar" },
  { href: "/real-estate/open-houses", label: "Open Houses", icon: "calendar" },
  { href: "/real-estate/calendar", label: "Calendar", icon: "calendar" },
  { href: "/real-estate/communications", label: "Communications", icon: "lead" },
  { href: "/real-estate/automation", label: "Automation", icon: "campaign" },
  { href: "/real-estate/notifications", label: "Notifications", icon: "star" },
  { href: "/real-estate/campaigns", label: "Campaigns", icon: "campaign" },
  { href: "/real-estate/marketing-assets", label: "Marketing Assets", icon: "image" },
  { href: "/real-estate/qr-codes", label: "QR Codes", icon: "qr" },
  { href: "/real-estate/reviews", label: "Reviews", icon: "star" },
  { href: "/real-estate/analytics", label: "Analytics", icon: "chart" },
  { href: "/real-estate/reports", label: "Reports", icon: "chart" },
  { href: "/real-estate/settings/integrations", label: "Integrations", icon: "settings" },
  { href: "/real-estate/settings", label: "Settings", icon: "settings" },
];

export default function ProfessionalShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#171916] text-[#EEE9DF]">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#171916]/95">
        <div className="flex h-16 items-center justify-between px-4 lg:px-7">
          <Link href="/real-estate" className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-[#B99A5B]/35 bg-[#22251F] text-[#D1B06A]"><Icon name="home" className="h-5 w-5" /></span>
            <span><span className="block text-[10px] uppercase tracking-[0.22em] text-[#AFA99E]">SnapLink</span><span className="block font-display text-lg leading-none">Real Estate</span></span>
          </Link>
          <div className="text-right"><p className="text-sm font-medium">{demoTenant.name}</p><p className="text-[10px] uppercase tracking-wider text-[#8F9188]">{demoUser.name} · Broker owner</p></div>
        </div>
      </header>
      <div className="lg:grid lg:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="border-b border-white/10 bg-[#1D201C] lg:min-h-[calc(100vh-4rem)] lg:border-b-0 lg:border-r">
          <nav aria-label="Real Estate module" className="flex gap-1 overflow-x-auto p-3 lg:block lg:space-y-1 lg:p-4">
            {nav.map((item) => <Link key={item.href} href={item.href} className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#B9B7AF] transition-colors hover:bg-white/[0.06] hover:text-[#F2EDE4]"><Icon name={item.icon} className="h-4 w-4 text-[#A88C52]" />{item.label}</Link>)}
          </nav>
          <div className="mx-4 mt-4 hidden rounded-2xl border border-[#B99A5B]/20 bg-[#24271F] p-4 lg:block"><p className="text-[10px] uppercase tracking-[0.2em] text-[#B99A5B]">Consumer channel</p><p className="mt-2 text-sm leading-relaxed text-[#B9B7AF]">Published property previews appear in Southline Living.</p><Link href="/homes" className="mt-3 inline-flex items-center gap-1 text-xs text-[#D1B06A]">Preview homes <Icon name="arrow" className="h-3.5 w-3.5" /></Link></div>
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
