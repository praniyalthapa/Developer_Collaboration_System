const THEME_KEY = "devtinder-theme";

const getSystemTheme = () => {
	if (typeof window === "undefined") return "dark"; // Default to dark

	const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
	return prefersDark ? "dark" : "light";
};

export const getInitialTheme = () => {
	if (typeof window === "undefined") return "dark";

	const stored = localStorage.getItem(THEME_KEY);
	if (stored === "light" || stored === "dark") return stored;

	return getSystemTheme();
};

export const applyTheme = (theme) => {
	if (typeof document === "undefined") return;

	const root = document.documentElement;

	// For DaisyUI - use our custom theme names
	root.setAttribute("data-theme", theme);

	// Support Tailwind `dark:` utilities
	if (theme === "dark") {
		root.classList.add("dark");
	} else {
		root.classList.remove("dark");
	}

	localStorage.setItem(THEME_KEY, theme);
};
