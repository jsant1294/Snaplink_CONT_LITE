import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: "#0B0B0D",
        charcoal: "#151519",
        slateink: "#1F1F26",
        gold: "#C9A24B",
        goldlight: "#E4C879",
        bone: "#F2EEE6",
        muted: "#8B8B96",
        success: "#3E9B6E",
        warn: "#D08A3E",
        danger: "#C4554D",
      },
      fontFamily: {
        display: ["'Cormorant Garamond'", "Georgia", "serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 0 rgba(201,162,75,0.15), 0 8px 24px rgba(0,0,0,0.45)",
      },
    },
  },
  plugins: [],
};
export default config;
