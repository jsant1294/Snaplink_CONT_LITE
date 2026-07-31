import { ImageResponse } from "next/og.js";
import { writeFile } from "node:fs/promises";

const img = new ImageResponse(
  {
    type: "div",
    props: {
      style: {
        width: "1200px",
        height: "630px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px",
        backgroundColor: "#f1eadf",
        backgroundImage: "linear-gradient(135deg, #f1eadf 0%, #e7ddcf 100%)",
        fontFamily: "sans-serif",
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
                    color: "#C9A24B",
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
                    color: "#5d4635",
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
                    color: "#9a614d",
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
              borderTop: "1px solid rgba(93,70,53,0.2)",
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
                        style: { display: "flex", fontSize: 20, fontWeight: 600, color: "#5d4635" },
                        children: "Powered by SnapLink",
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: { display: "flex", fontSize: 16, color: "#9a614d", marginTop: 4 },
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
                    color: "#5d4635",
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
  { width: 1200, height: 630 }
);

const buf = Buffer.from(await img.arrayBuffer());
await writeFile(
  "public/og-image.png",
  buf
);
console.log("wrote", buf.length, "bytes");
