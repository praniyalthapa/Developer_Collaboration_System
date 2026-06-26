export type Theme = "devcollab-light" | "devcollab-dark";

const THEME_KEY = "devcollab-theme";

const getSystemTheme = (): Theme => {
  if (typeof window === "undefined") return "devcollab-dark";
  return window.matchMedia?.("(prefers-color-scheme: light)").matches
    ? "devcollab-light"
    : "devcollab-dark";
};

export const getInitialTheme = (): Theme => {
  if (typeof window === "undefined") return "devcollab-dark";
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "devcollab-light" || stored === "devcollab-dark") {
    return stored;
  }
  return getSystemTheme();
};

export const applyTheme = (theme: Theme): void => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  root.classList.toggle("dark", theme === "devcollab-dark");
  localStorage.setItem(THEME_KEY, theme);
};

export const toggleTheme = (current: Theme): Theme =>
  current === "devcollab-dark" ? "devcollab-light" : "devcollab-dark";
