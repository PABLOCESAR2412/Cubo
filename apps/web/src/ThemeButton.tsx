import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { getStoredTheme, saveTheme, type Theme } from "./theme";

export function ThemeButton({ className = "icon-button" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>(getStoredTheme);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<Theme>;
      if (custom.detail) setTheme(custom.detail);
    };
    window.addEventListener("cubo:theme-changed", handler);
    return () => window.removeEventListener("cubo:theme-changed", handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", onClickOutside);
    return () => window.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const selectTheme = (next: Theme) => {
    setTheme(next);
    saveTheme(next);
    setOpen(false);
  };

  return (
    <div className="theme-selector-container" ref={containerRef}>
      <button
        type="button"
        className={`${className} theme-selector-trigger ${open ? "active" : ""}`}
        onClick={() => setOpen((prev) => !prev)}
        title="Cambiar tema de color"
        aria-label="Seleccionar tema (Oscuro, Claro o Sistema)"
        aria-expanded={open}
      >
        {theme === "oscuro" ? (
          <Icon name="moon" size={15} />
        ) : theme === "claro" ? (
          <Icon name="sun" size={15} />
        ) : (
          <Icon name="monitor" size={15} />
        )}
        <Icon name="chevron" size={10} className="theme-chevron" />
      </button>

      {open && (
        <div className="theme-dropdown-menu" role="menu">
          <button
            type="button"
            className={`theme-menu-item ${theme === "oscuro" ? "selected" : ""}`}
            onClick={() => selectTheme("oscuro")}
            role="menuitem"
          >
            <Icon name="moon" size={14} />
            <span>Oscuro</span>
            {theme === "oscuro" && <Icon name="check" size={12} className="theme-check" />}
          </button>
          <button
            type="button"
            className={`theme-menu-item ${theme === "claro" ? "selected" : ""}`}
            onClick={() => selectTheme("claro")}
            role="menuitem"
          >
            <Icon name="sun" size={14} />
            <span>Claro</span>
            {theme === "claro" && <Icon name="check" size={12} className="theme-check" />}
          </button>
          <button
            type="button"
            className={`theme-menu-item ${theme === "sistema" ? "selected" : ""}`}
            onClick={() => selectTheme("sistema")}
            role="menuitem"
          >
            <Icon name="monitor" size={14} />
            <span>Sistema</span>
            {theme === "sistema" && <Icon name="check" size={12} className="theme-check" />}
          </button>
        </div>
      )}
    </div>
  );
}
