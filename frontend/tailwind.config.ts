import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1D4ED8",
        primaryDark: "#1E3A8A",
        secondary: "#0F766E",
        accent: "#F59E0B",
        success: "#15803D",
        warning: "#B45309",
        danger: "#B91C1C",
        bg: "#F8FAFC",
        surface: "#FFFFFF",
        border: "#E2E8F0",
        ink: "#0F172A",
        subtext: "#334155",
        muted: "#64748B",
        tierBasic: "#475569",
        tierPlus: "#1D4ED8",
        tierPremium: "#1E3A8A",
      },
      borderRadius: {
        md: "12px",
        lg: "16px",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      transitionTimingFunction: {
        standard: "cubic-bezier(0.2, 0, 0, 1)",
      },
      transitionDuration: {
        120: "120ms",
        200: "200ms",
        280: "280ms",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
      },
    },
  },
  plugins: [],
};

export default config;
