import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: { 50:"#eff6ff",100:"#dbeafe",500:"#3b82f6",600:"#2563eb",900:"#1e3a8a" },
        surface: { DEFAULT:"#0f1318", card:"#131820", border:"#1c2534" },
      },
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"], mono: ["Fira Code", "monospace"] },
      animation: { "fade-in": "fadeIn 0.2s ease", "slide-up": "slideUp 0.3s ease", "pulse-slow": "pulse 3s infinite" },
      keyframes: {
        fadeIn:  { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
      },
    },
  },
  plugins: [],
} satisfies Config;
