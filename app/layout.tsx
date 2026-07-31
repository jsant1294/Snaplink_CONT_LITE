import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import type { Lang } from "@/lib/southline-i18n";
import { southlineStore } from "@/lib/southline-store";
import { buildSeoMetadata } from "@/lib/southline-seo";
import OrganizationJsonLd from "@/components/southline/OrganizationJsonLd";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const lang = ((cookieStore.get("sl_lang")?.value ?? "en") as Lang);

  const seo = await southlineStore.getSettings().then((s) => s.seo).catch(() => null);

  return buildSeoMetadata({ lang, seo, pageKey: "home" });
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("sl_lang")?.value ?? "en") as Lang;

  return (
    <html lang={lang}>
      <body className="bg-cream text-obsidian font-body antialiased">
        <OrganizationJsonLd />
        {children}
      </body>
    </html>
  );
}
