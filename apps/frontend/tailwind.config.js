/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: ["class", '[data-theme="devcollab-dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(2,6,23,0.06), 0 8px 24px -14px rgba(2,6,23,0.3)",
        "card-hover": "0 14px 36px -18px rgba(2,6,23,0.4)",
        glow: "0 8px 24px -12px rgba(2,6,23,0.3)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-18px)" },
        },
        aurora: {
          "0%, 100%": { transform: "translate3d(0,0,0) scale(1)" },
          "33%": { transform: "translate3d(6%,-4%,0) scale(1.1)" },
          "66%": { transform: "translate3d(-5%,5%,0) scale(0.95)" },
        },
        "gradient-pan": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both",
        float: "float 9s ease-in-out infinite",
        aurora: "aurora 22s ease-in-out infinite",
        "gradient-pan": "gradient-pan 6s ease infinite",
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        "devcollab-light": {
          primary: "#6d28d9",
          "primary-content": "#ffffff",
          secondary: "#0891b2",
          "secondary-content": "#ffffff",
          accent: "#db2777",
          neutral: "#1f2937",
          "base-100": "#ffffff",
          "base-200": "#f3f4fb",
          "base-300": "#e5e7f2",
          "base-content": "#0f172a",
          info: "#0ea5e9",
          success: "#16a34a",
          warning: "#d97706",
          error: "#dc2626",
          "--rounded-box": "1.25rem",
          "--rounded-btn": "0.85rem",
          "--border-btn": "1px",
        },
      },
      {
        "devcollab-dark": {
          primary: "#a78bfa",
          "primary-content": "#0b0a1a",
          secondary: "#22d3ee",
          "secondary-content": "#04121a",
          accent: "#f472b6",
          "accent-content": "#1a0610",
          neutral: "#1a2138",
          "base-100": "#10101e",
          "base-200": "#080812",
          "base-300": "#1c1d33",
          "base-content": "#e8eaf6",
          info: "#38bdf8",
          success: "#34d399",
          warning: "#fbbf24",
          error: "#fb7185",
          "--rounded-box": "1.25rem",
          "--rounded-btn": "0.85rem",
          "--border-btn": "1px",
        },
      },
    ],
    darkTheme: "devcollab-dark",
    logs: false,
  },
};
