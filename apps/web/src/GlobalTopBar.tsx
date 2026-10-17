import { Icon } from "./Icon";
import { ThemeButton } from "./ThemeButton";

export function GlobalTopBar({
  onOpenCommandPalette,
  onNewTask: _onNewTask,
  onOpenMenu,
  activeRepo,
  activeBranch,
}: {
  onOpenCommandPalette: () => void;
  onNewTask?: () => void;
  onOpenMenu: () => void;
  online: boolean;
  activeRepo?: string;
  activeBranch?: string;
}) {
  const isMac =
    typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const shortcutHint = isMac ? "⌘K" : "Ctrl+K";

  return (
    <header className="cubo-topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="icon-button mobile-only"
          onClick={onOpenMenu}
          aria-label="Abrir navegación"
        >
          <Icon name="menu" size={17} />
        </button>

        {activeRepo ? (
          <div className="topbar-repo-pill" title={`Repositorio activo: ${activeRepo}`}>
            <Icon name="folder" size={13} />
            <span className="topbar-repo-name">{activeRepo}</span>
            {activeBranch && (
              <>
                <span className="topbar-repo-sep">/</span>
                <span className="topbar-branch-name">{activeBranch}</span>
              </>
            )}
          </div>
        ) : (
          <div className="topbar-repo-pill desktop-only" title="Repositorio base del control plane">
            <Icon name="folder" size={13} />
            <span className="topbar-repo-name">PABLOCESAR2412/Cubo</span>
            <span className="topbar-repo-sep">/</span>
            <span className="topbar-branch-name">main</span>
          </div>
        )}
      </div>

      <div className="topbar-center">
        <button
          type="button"
          className="topbar-search-trigger"
          onClick={onOpenCommandPalette}
          title={`Abrir paleta de comandos (${shortcutHint})`}
          aria-keyshortcuts={isMac ? "Meta+K" : "Control+K"}
        >
          <Icon name="search" size={14} />
          <span className="search-placeholder">Buscar, navegar o ejecutar comando…</span>
          <kbd className="topbar-kbd">{shortcutHint}</kbd>
        </button>
      </div>

      <div className="topbar-right">
        <ThemeButton className="icon-button topbar-theme-btn" />
      </div>
    </header>
  );
}
