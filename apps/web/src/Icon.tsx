export type IconName =
  | "cube"
  | "chat"
  | "tasks"
  | "folder"
  | "chart"
  | "settings"
  | "plus"
  | "search"
  | "refresh"
  | "close"
  | "menu"
  | "more"
  | "arrow"
  | "logs"
  | "check"
  | "clock"
  | "link"
  | "external"
  | "download"
  | "mic"
  | "pin"
  | "edit"
  | "trash"
  | "logout"
  | "file"
  | "copy"
  | "chevron"
  | "sun"
  | "moon"
  | "monitor"
  | "terminal"
  | "diff"
  | "command"
  | "git-branch"
  | "bolt"
  | "bell"
  | "shield"
  | "eye"
  | "commit"
  | "history";
const paths: Record<IconName, string> = {
  commit: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 12h6M15 12h6",
  history: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8M3 3v5h5M12 7v5l4 2",
  bolt: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  bell: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6",
  sun: "M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z",
  moon: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z",
  monitor: "M4 4h16v12H4zM8 20h8M12 16v4",
  terminal: "m4 17 6-6-6-6M12 19h8",
  diff: "M12 3v18M3 12h18M5 19h4M15 19h4",
  command:
    "M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z",
  "git-branch":
    "M6 3v12M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 9a9 9 0 0 1-9 9",
  external: "M14 3h7v7M21 3l-11 11M10 3H3v18h18v-7",
  mic: "M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0zM5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8",
  pin: "m9 3 9 9-3 1-3 5-6-6 5-3zM8 16l-5 5",
  edit: "m4 16 11-11 4 4L8 20H4zM14 6l4 4",
  trash: "M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7",
  logout: "M10 4H4v16h6M14 8l4 4-4 4M8 12h12",
  file: "M5 3h9l5 5v13H5zM14 3v6h5",
  copy: "M9 8h11v13H9zM15 8V3H4v13h5",
  chevron: "m7 10 5 5 5-5",
  cube: "M12 3 20 7.5v9L12 21l-8-4.5v-9zM4 7.5l8 4.5 8-4.5M12 12v9",
  chat: "M4 4h16v12H9l-5 4z",
  tasks: "M9 5h11M9 12h11M9 19h11M3 5l1 1 2-2M3 12l1 1 2-2M3 19l1 1 2-2",
  folder: "M3 6h7l2 2h9v12H3z",
  chart: "M4 20V12M10 20V4M16 20V8M22 20H2",
  settings: "M9 3h6l1 4 4 2v6l-4 2-1 4H9l-1-4-4-2V9l4-2zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6",
  plus: "M12 5v14M5 12h14",
  search: "M16 16l5 5M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14",
  refresh: "M20 8a8 8 0 0 0-14-3L3 8M3 3v5h5M4 16a8 8 0 0 0 14 3l3-3M21 21v-5h-5",
  close: "M6 6l12 12M18 6 6 18",
  menu: "M4 6h16M4 12h16M4 18h16",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  arrow: "M5 12h14M14 7l5 5-5 5",
  logs: "M4 5h16v14H4zM7 9l3 3-3 3M13 15h4",
  check: "M5 12l4 4L19 6",
  clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 7v5l3 2",
  link: "M9 15l6-6M8 16l-2 2a4 4 0 0 1-6-6l4-4M16 8l2-2a4 4 0 0 1 6 6l-4 4",
  download: "M12 3v12M7 10l5 5 5-5M4 17v4h16v-4",
};
export function Icon({
  name,
  size = 18,
  className,
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
