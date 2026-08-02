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
        // Southline Living semantic palette. Components should consume these
        // names rather than raw values or the legacy material-name palette.
        page: "rgb(var(--color-bg-page-rgb) / <alpha-value>)",
        section: "rgb(var(--color-bg-section-rgb) / <alpha-value>)",
        surface: "rgb(var(--color-bg-surface-rgb) / <alpha-value>)",
        "surface-soft": "rgb(var(--color-bg-surface-soft-rgb) / <alpha-value>)",
        "surface-raised": "rgb(var(--color-bg-surface-raised-rgb) / <alpha-value>)",
        primary: "rgb(var(--color-text-primary-rgb) / <alpha-value>)",
        secondary: "rgb(var(--color-text-secondary-rgb) / <alpha-value>)",
        "text-muted": "rgb(var(--color-text-muted-rgb) / <alpha-value>)",
        "border-default": "rgb(var(--color-border-default-rgb) / <alpha-value>)",
        "accent-gold": "rgb(var(--color-accent-gold-rgb) / <alpha-value>)",
        "accent-gold-text": "rgb(var(--color-accent-gold-text-rgb) / <alpha-value>)",
        eyebrow: "rgb(var(--color-eyebrow-rgb) / <alpha-value>)",
        "accent-green": "rgb(var(--color-accent-green-rgb) / <alpha-value>)",
        "accent-dark": "rgb(var(--color-accent-dark-rgb) / <alpha-value>)",
        "on-dark": "rgb(var(--color-text-on-dark-rgb) / <alpha-value>)",
        "on-dark-muted": "rgb(var(--color-text-on-dark-muted-rgb) / <alpha-value>)",
        "image-overlay": "rgb(var(--color-image-overlay-rgb) / <alpha-value>)",
        "state-error": "rgb(var(--color-state-error-rgb) / <alpha-value>)",
        "state-success": "rgb(var(--color-state-success-rgb) / <alpha-value>)",
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
        // Southline Living consumer palette
        cream: "#f1eadf",
        ivory: "#e9dfd0",
        sand: "#ddd1c0",
        mushroom: "#b8aa98",
        clay: "#9a614d",
        sage: "#78816a",
        blush: "#D4A8A0",
        taupe: "#8b7b68",
        walnut: "#5d4635",
        olive: "#62643f",
        paper: "#e7ddcf",
        "snaplink-black": "#11110f",
        "snaplink-charcoal": "#25231f",
        "snaplink-gold": "#caa34f",
        "snaplink-gold-light": "#e0c276",
        "snaplink-gold-dark": "#92712e",
        "snaplink-cream": "#f5efe2",
      },
      fontFamily: {
        display: ["'Cormorant Garamond'", "Georgia", "serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 0 rgba(201,162,75,0.15), 0 8px 24px rgba(0,0,0,0.45)",
        "southline-card": "0 1px 1px rgba(32, 32, 32, 0.05), 0 14px 34px rgba(32, 32, 32, 0.12)",
      },
    },
  },
  plugins: [],
};
export default config;
