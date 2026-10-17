// Motor de temas de Cubo: persiste en localStorage del navegador.
// "oscuro" es el modo industrial sobrio; "claro" es el modo de alta precisión con acento ámbar; "sistema" respeta la preferencia del OS.
export type Theme = "sistema" | "oscuro" | "claro";

const STORAGE_KEY = "cubo:theme";
const VALID_THEMES: Theme[] = ["sistema", "oscuro", "claro"];

export function getStoredTheme(): Theme {
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    if (val && (VALID_THEMES as string[]).includes(val)) {
      return val as Theme;
    }
  } catch {
    // Si localStorage no está disponible
  }
  return "oscuro";
}

export function applyTheme(theme: Theme = getStoredTheme()): void {
  const root = document.documentElement;
  if (theme === "sistema") {
    root.removeAttribute("data-theme");
  } else {
    root.dataset.theme = theme;
  }
}

export function saveTheme(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Modo privado o sin permisos
  }
  applyTheme(theme);
  window.dispatchEvent(new CustomEvent("cubo:theme-changed", { detail: theme }));
}

// Inicializador para evitar parpadeo antes de montar React
export function initTheme(): void {
  applyTheme(getStoredTheme());
}
