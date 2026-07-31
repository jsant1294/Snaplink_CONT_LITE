"use client";

import type { Lang } from "@/lib/southline-i18n";
import LucioWidget, { type LucioPageContext } from "./LucioWidget";

export default function LucioMount({ lang, pageContext }: { lang: Lang; pageContext?: LucioPageContext }) {
  return <LucioWidget lang={lang} pageContext={pageContext} />;
}
