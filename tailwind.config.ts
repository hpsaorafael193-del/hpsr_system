import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/data/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-hpsr)', 'Roboto', '"Segoe UI"', 'Arial', 'sans-serif'],
      },
      colors: {
        hpsr: {
          bg: "#f1e4d3",
          paper: "#fcf6ee",
          cream: "#fcf6ee",
          wine: "#672614",
          wineDark: "#2a0700",
          wineLight: "#672614",
          text: "#2a0700",
          muted: "#70574f",
          border: "#e2d3c3"
        }
      },
      boxShadow: {
        soft: "0 14px 34px rgba(42, 7, 0, 0.07)",
        calm: "0 10px 26px rgba(42, 7, 0, 0.052)"
      }
    },
  },
  plugins: [],
};
export default config;
