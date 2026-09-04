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
        brand: {
          50: "#eff9fa",
          100: "#d7f0f2",
          200: "#b0e1e6",
          300: "#7ecbd3",
          400: "#4aabb6",
          500: "#1e8a96",
          600: "#176d78",
          700: "#15565f",
          800: "#14444b",
          900: "#12383e",
        },
        sunset: {
          50: "#fff4ed",
          100: "#ffe6d5",
          200: "#ffc9a8",
          300: "#ffa370",
          400: "#ff7d47",
          500: "#ff5c1f",
          600: "#e6440f",
          700: "#bf350e",
          800: "#992c12",
          900: "#7c2611",
        },
        sky: {
          50: "#effaff",
          100: "#dcf3ff",
          200: "#b3e8ff",
          300: "#75d9ff",
          400: "#2fc4ff",
          500: "#05a9f0",
          600: "#0086cc",
          700: "#016ba5",
          800: "#075b89",
          900: "#0b4c72",
        },
      },
    },
  },
  plugins: [],
};

export default config;
