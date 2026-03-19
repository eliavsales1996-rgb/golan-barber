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
          DEFAULT: "#c0a080",
          hover: "#d4b090",
          light: "#e2c9a1",
          dark: "#a68b6d",
        },
        accent: "#8e735b",
      },
      fontFamily: {
        serif: ['Playfair Display', 'serif'],
        sans: ['Assistant', 'sans-serif'],
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #e2c9a1 0%, #c0a080 50%, #8e735b 100%)',
      },
      boxShadow: {
        'gold': '0 0 40px rgba(192, 160, 128, 0.15)',
        'gold-hover': '0 10px 30px rgba(192, 160, 128, 0.4)',
      }
    },
  },
  plugins: [],
};
export default config;
