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
        ink: "#17212b",
        paper: "#f8faf7",
        moss: "#456653",
        lake: "#326c7b",
        amber: "#d48a31",
      },
      boxShadow: {
        soft: "0 12px 32px rgba(23, 33, 43, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
