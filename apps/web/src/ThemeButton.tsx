import { useEffect, useState } from "react";
import { Icon } from "./Icon";
import { getStoredTheme, saveTheme, type Theme } from "./theme";

export function ThemeButton({ className = "icon-button" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>(getStoredTheme);

  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<Theme>;
      if (custom.detail) setTheme(custom.detail);
    };
    window.addEventListener("cubo:theme-changed", handler);
    return () => window.removeEventListener("cubo:theme-changed", handler);
  }, []);

  const cycleTheme = () => {
    const next: Theme = theme === "oscuro" ? "claro" : theme === "claro" ? "sistema" : "oscuro";
    setTheme(next);
    saveTheme(next);
  };

  const label =
    theme === "oscuro"
      ? "Tema oscuro (clic para cambiar a claro)"
      : theme === "claro"
        ? "Tema claro (clic para cambiar a sistema)"
        : "Tema del sistema (clic para cambiar a oscuro)";

  return (
    <button
      type="button"
      className={className}
      onClick={cycleTheme}
      title={label}
      aria-label={label}
    >
      {theme === "oscuro" ? (
        <Icon name="moon" size={16} />
      ) : theme === "claro" ? (
        <Icon name="sun" size={16} />
      ) : (
        <Icon name="monitor" size={16} />
      )}
    </button>
  );
}
