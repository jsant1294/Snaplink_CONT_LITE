import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: "SnapLink Contractor",
  description:
    "Client intake, AI summaries, and estimate PDFs — in English & Español. Built by Southline One Digital Media.",
  openGraph: {
    type: "website",
    siteName: "SnapLink Contractor",
    title: "SnapLink Contractor — Stop losing leads. Get paid faster.",
    description:
      "Client intake, AI summaries, and estimate PDFs — in English & Español. Built by Southline One Digital Media, Alpharetta GA.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SnapLink Contractor by Southline One Digital Media — Alpharetta, GA",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SnapLink Contractor — Stop losing leads. Get paid faster.",
    description: "Client intake, AI summaries, and estimate PDFs — in English & Español.",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
