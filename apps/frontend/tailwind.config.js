/** @type {import('tailwindcss').Config} */
import daisyui from "daisyui";

export default {
	darkMode: "class",
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			backgroundImage: {
				// Dark mode mesh gradient - deep blue/purple tones
				"mesh-gradient-dark":
					"radial-gradient(1200px 600px at -10% -20%, rgba(99,102,241,0.35), transparent), radial-gradient(800px 400px at 110% -10%, rgba(16,185,129,0.35), transparent), radial-gradient(800px 400px at 50% 120%, rgba(236,72,153,0.35), transparent)",
				// Light mode mesh gradient - softer, warmer tones
				"mesh-gradient-light":
					"radial-gradient(1200px 600px at -10% -20%, rgba(99,102,241,0.15), transparent), radial-gradient(800px 400px at 110% -10%, rgba(16,185,129,0.15), transparent), radial-gradient(800px 400px at 50% 120%, rgba(236,72,153,0.12), transparent)",
			},
		},
	},
	plugins: [daisyui],
	daisyui: {
		themes: [
			{
				// Light theme - clean, professional look
				light: {
					primary: "#4F46E5", // Indigo - slightly deeper for better contrast
					secondary: "#0EA5E9", // Sky blue
					accent: "#06B6D4", // Cyan
					neutral: "#1F2937", // Dark gray for text
					"base-100": "#FFFFFF", // Pure white background
					"base-200": "#F8FAFC", // Slate-50 - very light gray
					"base-300": "#E2E8F0", // Slate-200
					"base-content": "#1E293B", // Slate-800 - dark text
					info: "#3B82F6", // Blue
					success: "#10B981", // Emerald
					warning: "#F59E0B", // Amber
					error: "#EF4444", // Red
				},
			},
			{
				// Dark theme - original design
				dark: {
					primary: "#5B7CFF",
					secondary: "#3ABFF8",
					accent: "#22D3EE",
					neutral: "#0B1220",
					"base-100": "#0E1628",
					"base-200": "#131D33",
					"base-300": "#1A2744",
					"base-content": "#E2E8F0",
					info: "#60A5FA",
					success: "#22C55E",
					warning: "#F59E0B",
					error: "#EF4444",
				},
			},
		],
		logs: false,
	},
};
