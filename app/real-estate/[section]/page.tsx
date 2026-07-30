import { notFound } from "next/navigation";
import Icon from "@/components/real-estate/Icon";
import { isRealEstateSection, REAL_ESTATE_SECTION_META } from "@/lib/real-estate/navigation";

export default async function RealEstateSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!isRealEstateSection(section)) notFound();
  const meta = REAL_ESTATE_SECTION_META[section];
  return <div className="mx-auto max-w-[1450px] p-4 sm:p-6 lg:p-8"><div className="flex items-center gap-2 text-[#B99A5B]"><Icon name={meta.icon} className="h-4 w-4" /><span className="text-[10px] uppercase tracking-[0.22em]">Phase 1 placeholder</span></div><h1 className="mt-3 font-display text-3xl text-[#F3EEE5] sm:text-4xl">{meta.title}</h1><p className="mt-2 max-w-2xl text-sm text-[#9FA098]">{meta.description}</p><section className="mt-8 rounded-2xl border border-dashed border-white/15 bg-[#20231F] p-8 text-center"><Icon name={meta.icon} className="mx-auto h-8 w-8 text-[#A88C52]" /><h2 className="mt-4 font-display text-xl">Surface reserved</h2><p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#92958D]">This route establishes navigation and permission boundaries only. Persistent workflows begin after the Phase 1 foundation is approved.</p></section></div>;
}
