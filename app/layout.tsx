import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import type { Lang } from "@/lib/southline-i18n";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const lang = ((cookieStore.get("sl_lang")?.value ?? "en") as Lang);

  const titles = { es: "Southline Living — Ideas para tu hogar y profesionales de confianza", en: "Southline Living — Home ideas and trusted professionals" };
  const descriptions = {
    es: "Explora espacios inspiradores, planifica tu próximo proyecto y conecta con profesionales locales de Snaplink.",
    en: "Explore inspiring spaces, plan your next project, and connect with local Snaplink professionals.",
  };
  const ogTitles = { es: "Southline Living — Ideas para cada hogar", en: "Southline Living — Ideas for every home" };
  const ogDescriptions = {
    es: "Explora, planifica y conecta con profesionales de confianza para tu hogar.",
    en: "Explore, plan, and connect with trusted home professionals.",
  };

  return {
    metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
    title: titles[lang],
    description: descriptions[lang],
    openGraph: {
      type: "website",
      siteName: "Southline Living",
      title: ogTitles[lang],
      description: ogDescriptions[lang],
      locale: lang === "es" ? "es_US" : "en_US",
      images: [
        {
          url: "/og-image.jpg",
          width: 1200,
          height: 630,
          alt: "Southline Living",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitles[lang],
      description: ogDescriptions[lang],
      images: ["/og-image.jpg"],
    },
    alternates: {
      languages: {
        "en": "/",
        "es": "/",
      },
    },
  };
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
      <body className="bg-cream text-obsidian font-body antialiased">{children}</body>
    </html>
  );
}
