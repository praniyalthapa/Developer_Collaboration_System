/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: ["class", '[data-theme="devcollab-dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.10)",
        "card-hover":
          "0 12px 24px -8px rgba(16,24,40,0.18), 0 4px 8px -4px rgba(16,24,40,0.12)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.25s ease-out",
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        "devcollab-light": {
          primary: "#4f46e5",
          "primary-content": "#ffffff",
          secondary: "#0ea5e9",
          accent: "#0d9488",
          neutral: "#1f2937",
          "base-100": "#ffffff",
          "base-200": "#f5f6f8",
          "base-300": "#e6e8ec",
          "base-content": "#111827",
          info: "#0ea5e9",
          success: "#16a34a",
          warning: "#d97706",
          error: "#dc2626",
          "--rounded-box": "0.875rem",
          "--rounded-btn": "0.625rem",
        },
      },
      {
        "devcollab-dark": {
          primary: "#818cf8",
          "primary-content": "#0b1020",
          secondary: "#38bdf8",
          accent: "#2dd4bf",
          neutral: "#1e293b",
          "base-100": "#0f172a",
          "base-200": "#131c30",
          "base-300": "#1e293b",
          "base-content": "#e2e8f0",
          info: "#38bdf8",
          success: "#22c55e",
          warning: "#f59e0b",
          error: "#f87171",
          "--rounded-box": "0.875rem",
          "--rounded-btn": "0.625rem",
        },
      },
    ],
    darkTheme: "devcollab-dark",
    logs: false,
  },
};
