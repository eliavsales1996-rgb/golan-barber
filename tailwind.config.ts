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
        primary: {
          DEFAULT: "#40916c",
          hover: "#52b788",
          light: "#74c69d",
          dark: "#2d6a4f",
        },
        accent: "#1b4332",
      },
      fontFamily: {
        serif: ['Playfair Display', 'serif'],
        sans: ['Assistant', 'sans-serif'],
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #74c69d 0%, #40916c 50%, #1b4332 100%)',
      },
      boxShadow: {
        'gold': '0 0 40px rgba(64, 145, 108, 0.15)',
        'gold-hover': '0 10px 30px rgba(64, 145, 108, 0.4)',
      }
    },
  },
  plugins: [],
};
export default config;
