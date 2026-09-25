import type { Config } from "tailwindcss";

/**
 * Design tokens transcribed exactly from the project's confirmed frontend
 * design reference ("simple, professional editorial" direction) - see
 * claude/frontend-design-reference.md in the project. Do NOT use the
 * parked dark-glassmorphism mood board's colors here.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          900: "#0F172A", // Ink - header/nav/footer/primary headings
          800: "#152238", // header gradient-free hover surface
          700: "#1E293B", // secondary headings / hover on ink surfaces
        },
        accent: {
          700: "#B91C1C", // hover/active state for accent-600 (buttons, links)
          600: "#DC2626", // Signal Red - breaking news, primary CTA, active nav
          50: "#FEF2F2", // accent background tint
        },
        surface: {
          0: "#FFFFFF", // page/card background
          50: "#F8FAFC", // section / alternating-row background
        },
        border: {
          200: "#E2E8F0", // card borders / dividers
        },
        text: {
          900: "#1E293B", // body headings
          600: "#475569", // body copy
          400: "#94A3B8", // meta text
        },
        success: {
          600: "#16A34A", // published / approved
        },
        warning: {
          600: "#D97706", // pending / under review / changes requested
        },
        error: {
          600: "#DC2626", // rejected (reuses accent)
        },
        info: {
          600: "#2563EB", // scheduled / informational / subscriber-only tag
        },
        // Low-saturation category tag tints (desaturated, not bright).
        category: {
          blue: { bg: "#EFF6FF", text: "#1D4ED8" },
          teal: { bg: "#F0FDFA", text: "#0F766E" },
          purple: { bg: "#FAF5FF", text: "#7E22CE" },
          green: { bg: "#F0FDF4", text: "#15803D" },
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      maxWidth: {
        // Single source of truth for the page/content measure, used by the
        // .container-page utility in globals.css - keeps every page's
        // horizontal centering identical instead of each page repeating
        // its own max-w-6xl px-4 by hand.
        page: "72rem", // 1152px, same as max-w-6xl
        prose: "42rem", // comfortable reading width for article body copy
      },
    },
  },
  plugins: [],
};

export default config;
