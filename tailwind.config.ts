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
          50: "#f0fbf6",
          100: "#dbf5e7",
          200: "#b8ebd0",
          300: "#87dab2",
          400: "#4fc08f",
          500: "#28a373",
          600: "#1b835c",
          700: "#17694b",
          800: "#16543d",
          900: "#134534",
        },
      },
    },
  },
  plugins: [],
};

export default config;
