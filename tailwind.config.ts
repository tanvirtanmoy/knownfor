import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Calm, trustworthy European professional palette.
        ink: {
          DEFAULT: "#1c2433",
          soft: "#3c4658",
          muted: "#697489",
        },
        canvas: {
          DEFAULT: "#f7f6f3",
          card: "#ffffff",
          subtle: "#efeee9",
        },
        brand: {
          DEFAULT: "#2f6f6b",
          dark: "#235451",
          soft: "#e3efee",
        },
        line: "#e4e2dc",
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px rgba(28, 36, 51, 0.04), 0 8px 24px rgba(28, 36, 51, 0.06)",
        soft: "0 1px 2px rgba(28, 36, 51, 0.05)",
      },
      borderRadius: {
        xl: "0.9rem",
        "2xl": "1.25rem",
      },
      maxWidth: {
        content: "72rem",
      },
    },
  },
  plugins: [],
};

export default config;
