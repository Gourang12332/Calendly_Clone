import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#e8f2ff",
          100: "#cce0ff",
          500: "#006bff",
          600: "#006bff",
          700: "#0056d6",
        },
        calendly: {
          blue: "#006bff",
          "blue-hover": "#0056d6",
          navy: "#1a1f36",
        },
      },
      borderRadius: {
        pill: "9999px",
      },
    },
  },
  plugins: [],
};
export default config;
