import { ImageResponse } from "next/og.js";
import { readFile, writeFile } from "node:fs/promises";

const heroBuffer = await readFile("public/images/southline-living-hero.png");
const heroDataUrl = `data:image/png;base64,${heroBuffer.toString("base64")}`;

const img = new ImageResponse(
  {
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
                        children: "SOUTHLINE LIVING",
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
                        children: "Ideas for every home.",
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
                        children: "Explore, plan, and connect with trusted home professionals.",
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
                              children: "Powered by SnapLink",
                            },
                          },
                          {
                            type: "div",
                            props: {
                              style: { display: "flex", fontSize: 16, color: "#F2EEE6", opacity: 0.75, marginTop: 4 },
                              children: "Alpharetta, GA · Hablamos español",
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
                        children: "southlineliving.southlineone.com",
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
  },
  { width: 1200, height: 630 }
);

const buf = Buffer.from(await img.arrayBuffer());
await writeFile(
  "public/og-image.png",
  buf
);
console.log("wrote", buf.length, "bytes");
