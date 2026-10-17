import { useEffect, useId, useRef, useState } from "react";
import { Icon, type IconName } from "./Icon";
import { saveTheme } from "./theme";

export interface CommandItem {
  id: string;
  group: string;
  label: string;
  icon: IconName;
  shortcut?: string;
  keywords?: string;
  run: () => void | Promise<void>;
}

export function CommandPalette({
  open,
  onClose,
  onNavigate,
  onNewTask,
  onNewProject,
  onNewChat,
  onShowVersions,
  onLogout,
}: {
  open: boolean;
  onClose: () => void;
  onNavigate: (view: "tareas" | "proyectos" | "chat" | "analiticas" | "ajustes") => void;
  onNewTask: () => void;
  onNewProject: () => void;
  onNewChat: () => void;
  onShowVersions: () => void;
  onLogout: () => void;
}) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  const commands: CommandItem[] = [
    {
      id: "new-task",
      group: "ACCIONES RÁPIDAS",
      label: "Nueva tarea de agente (OpenCode / Codex)",
      icon: "plus",
      shortcut: "Ctrl+T",
      keywords: "crear agente opencode codex lanzar ejecutar",
      run: () => {
        onClose();
        onNewTask();
      },
    },
    {
      id: "new-project",
      group: "ACCIONES RÁPIDAS",
      label: "Nuevo proyecto",
      icon: "folder",
      shortcut: "Ctrl+Shift+P",
      keywords: "crear repo git github importar",
      run: () => {
        onClose();
        onNewProject();
      },
    },
    {
      id: "new-chat",
      group: "ACCIONES RÁPIDAS",
      label: "Nuevo chat",
      icon: "chat",
      shortcut: "Ctrl+N",
      keywords: "conversacion prompt preguntar hablar",
      run: () => {
        onClose();
        onNewChat();
      },
    },
    {
      id: "nav-tareas",
      group: "NAVEGACIÓN",
      label: "Ir a Tareas y Proceso",
      icon: "tasks",
      keywords: "ejecuciones diffs logs runner aprobaciones",
      run: () => {
        onClose();
        onNavigate("tareas");
      },
    },
    {
      id: "nav-proyectos",
      group: "NAVEGACIÓN",
      label: "Ir a Proyectos",
      icon: "folder",
      keywords: "repositorios carpetas github branches",
      run: () => {
        onClose();
        onNavigate("proyectos");
      },
    },
    {
      id: "nav-chat",
      group: "NAVEGACIÓN",
      label: "Ir a Chat",
      icon: "chat",
      keywords: "asistente conversar agentes turnos",
      run: () => {
        onClose();
        onNavigate("chat");
      },
    },
    {
      id: "nav-analiticas",
      group: "NAVEGACIÓN",
      label: "Ir a Analíticas y Costes",
      icon: "chart",
      keywords: "metricas tokens cuotas graficas uso",
      run: () => {
        onClose();
        onNavigate("analiticas");
      },
    },
    {
      id: "nav-ajustes",
      group: "NAVEGACIÓN",
      label: "Ir a Ajustes",
      icon: "settings",
      keywords: "configuracion claves api proveedores perfil",
      run: () => {
        onClose();
        onNavigate("ajustes");
      },
    },
    {
      id: "theme-dark",
      group: "APARIENCIA",
      label: "Cambiar a Tema Oscuro (Industrial Amber)",
      icon: "moon",
      keywords: "dark mode noche",
      run: () => {
        saveTheme("oscuro");
        onClose();
      },
    },
    {
      id: "theme-light",
      group: "APARIENCIA",
      label: "Cambiar a Tema Claro (High Precision)",
      icon: "sun",
      keywords: "light mode dia blanco",
      run: () => {
        saveTheme("claro");
        onClose();
      },
    },
    {
      id: "theme-system",
      group: "APARIENCIA",
      label: "Usar Tema del Sistema (Automático)",
      icon: "monitor",
      keywords: "system automatico os",
      run: () => {
        saveTheme("sistema");
        onClose();
      },
    },
    {
      id: "app-versions",
      group: "SISTEMA",
      label: "Ver historial de versiones y novedades",
      icon: "cube",
      keywords: "changelog version updates cambios semver",
      run: () => {
        onClose();
        onShowVersions();
      },
    },
    {
      id: "logout",
      group: "SISTEMA",
      label: "Cerrar sesión",
      icon: "logout",
      keywords: "salir desconectar",
      run: () => {
        onClose();
        onLogout();
      },
    },
  ];

  const normalize = (text: string) =>
    text
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase();

  const queryTerms = normalize(query.trim()).split(/\s+/).filter(Boolean);

  const filtered = commands.filter((cmd) => {
    if (!queryTerms.length) return true;
    const searchTarget = normalize(`${cmd.group} ${cmd.label} ${cmd.keywords ?? ""}`);
    return queryTerms.every((term) => searchTarget.includes(term));
  });

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((idx) => (idx + 1) % Math.max(1, filtered.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((idx) => (idx - 1 + filtered.length) % Math.max(1, filtered.length));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].run();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, filtered, selectedIndex, onClose]);

  if (!open) return null;

  // Group filtered items
  const grouped: Record<string, CommandItem[]> = {};
  for (const cmd of filtered) {
    if (!grouped[cmd.group]) grouped[cmd.group] = [];
    grouped[cmd.group].push(cmd);
  }

  let flatIndex = -1;

  return (
    <div className="command-palette-backdrop">
      <button
        type="button"
        className="command-palette-scrim"
        onClick={onClose}
        aria-label="Cerrar paleta de comandos"
      />
      <div
        className="command-palette-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="command-palette-search">
          <Icon name="search" size={17} />
          <input
            ref={inputRef}
            type="search"
            placeholder="Escribe un comando o busca una sección… (Esc para cerrar)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            aria-label="Buscar comandos"
            autoComplete="off"
            spellCheck="false"
          />
          <kbd className="command-shortcut-hint">ESC</kbd>
        </div>

        <div className="command-palette-list" ref={listRef} role="listbox">
          {filtered.length === 0 ? (
            <div className="command-palette-empty">
              <span>No se encontraron comandos para &quot;{query}&quot;</span>
            </div>
          ) : (
            Object.entries(grouped).map(([groupTitle, items]) => (
              <div key={groupTitle} className="command-palette-group">
                <div className="command-palette-group-title">{groupTitle}</div>
                {items.map((cmd) => {
                  flatIndex++;
                  const isSelected = flatIndex === selectedIndex;
                  return (
                    <button
                      key={cmd.id}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      className={`command-palette-item ${isSelected ? "selected" : ""}`}
                      onClick={() => cmd.run()}
                      onMouseEnter={() => {
                        // find its index
                        const idx = filtered.findIndex((c) => c.id === cmd.id);
                        if (idx !== -1) setSelectedIndex(idx);
                      }}
                    >
                      <span className="command-item-icon">
                        <Icon name={cmd.icon} size={15} />
                      </span>
                      <span className="command-item-label">{cmd.label}</span>
                      {cmd.shortcut && <kbd className="command-item-shortcut">{cmd.shortcut}</kbd>}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="command-palette-footer">
          <div className="command-footer-hints">
            <span>
              <kbd>↑</kbd> <kbd>↓</kbd> Navegar
            </span>
            <span>
              <kbd>↵</kbd> Ejecutar
            </span>
            <span>
              <kbd>ESC</kbd> Cerrar
            </span>
          </div>
          <span className="command-footer-brand">Cubo Command Suite</span>
        </div>
      </div>
    </div>
  );
}
