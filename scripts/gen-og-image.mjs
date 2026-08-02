import { ImageResponse } from "next/og.js";
import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

// Single source of truth per locale — every visible text field on the card
// comes from the SAME resolved locale object. No field may read from a
// different locale, and none falls back to a hardcoded default independently
// of the whole locale.
export const OG_IMAGE_COPY = {
  en: {
    eyebrow: "SOUTHLINE LIVING",
    headline: "Ideas for every home.",
    supportingCopy: "Explore, plan, and connect with trusted home professionals.",
    poweredLine: "Powered by SnapLink",
    location: "Alpharetta, GA · Hablamos español",
    urlText: "southlineliving.southlineone.com",
  },
  es: {
    eyebrow: "SOUTHLINE LIVING",
    headline: "Ideas para cada hogar.",
    supportingCopy: "Explora, planifica y conecta con profesionales de confianza para tu hogar.",
    poweredLine: "Impulsado por SnapLink",
    location: "Alpharetta, GA · Hablamos español",
    urlText: "southlineliving.southlineone.com",
  },
};

export const OG_IMAGE_OUTPUT_PATH = {
  en: "public/og-image.png",
  es: "public/og-image-es.png",
};

// Pure function: builds the ImageResponse element tree for one locale, using
// only that locale's copy object. Exported so a test can assert its text
// content directly (proving the Spanish tree never contains English strings)
// without needing to decode the rendered PNG.
export function buildOgImageTree(heroDataUrl, copy) {
  return {
    type: "div",
    props: {
      style: {
        position: "relative",
        width: "1200px",
        height: "630px",
        display: "flex",
        fontFamily: "sans-serif",
      },
      children: [
        // Hero photo background
        {
          type: "img",
          props: {
            src: heroDataUrl,
            style: {
              position: "absolute",
              inset: 0,
              width: "1200px",
              height: "630px",
              objectFit: "cover",
            },
          },
        },
        // Dark gradient overlay for text legibility (mirrors components/southline/Hero.tsx)
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              inset: 0,
              display: "flex",
              backgroundImage:
                "linear-gradient(115deg, rgba(20,17,13,0.92) 0%, rgba(30,25,19,0.72) 42%, rgba(30,25,19,0.28) 75%, rgba(30,25,19,0.1) 100%)",
            },
          },
        },
        // Content
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "72px",
            },
            children: [
              {
                type: "div",
                props: {
                  style: { display: "flex", flexDirection: "column" },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          display: "flex",
                          fontSize: 22,
                          letterSpacing: 8,
                          textTransform: "uppercase",
                          color: "#E4C879",
                          fontWeight: 600,
                          marginBottom: 28,
                        },
                        children: copy.eyebrow,
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: {
                          display: "flex",
                          fontSize: 84,
                          fontWeight: 700,
                          color: "#F2EEE6",
                          lineHeight: 1.08,
                          letterSpacing: -2,
                          maxWidth: 980,
                        },
                        children: copy.headline,
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: {
                          display: "flex",
                          fontSize: 30,
                          color: "#F2EEE6",
                          opacity: 0.85,
                          marginTop: 28,
                          maxWidth: 880,
                          lineHeight: 1.4,
                        },
                        children: copy.supportingCopy,
                      },
                    },
                  ],
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderTop: "1px solid rgba(242,238,230,0.25)",
                    paddingTop: 28,
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: { display: "flex", flexDirection: "column" },
                        children: [
                          {
                            type: "div",
                            props: {
                              style: { display: "flex", fontSize: 20, fontWeight: 600, color: "#F2EEE6" },
                              children: copy.poweredLine,
                            },
                          },
                          {
                            type: "div",
                            props: {
                              style: { display: "flex", fontSize: 16, color: "#F2EEE6", opacity: 0.75, marginTop: 4 },
                              children: copy.location,
                            },
                          },
                        ],
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: {
                          display: "flex",
                          fontSize: 18,
                          color: "#F2EEE6",
                          fontWeight: 500,
                        },
                        children: copy.urlText,
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  };
}

async function main() {
  const heroBuffer = await readFile("public/images/southline-living-hero.png");
  const heroDataUrl = `data:image/png;base64,${heroBuffer.toString("base64")}`;

  for (const lang of ["en", "es"]) {
    const img = new ImageResponse(buildOgImageTree(heroDataUrl, OG_IMAGE_COPY[lang]), { width: 1200, height: 630 });
    const buf = Buffer.from(await img.arrayBuffer());
    await writeFile(OG_IMAGE_OUTPUT_PATH[lang], buf);
    console.log(`wrote ${OG_IMAGE_OUTPUT_PATH[lang]} (${lang}), ${buf.length} bytes`);
  }
}

// Only run when invoked directly (`node scripts/gen-og-image.mjs`), not when
// imported by a test for buildOgImageTree/OG_IMAGE_COPY. Compared as URLs
// (not raw string concatenation) so paths containing spaces still match.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
