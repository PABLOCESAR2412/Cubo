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
  | "download";
const paths: Record<IconName, string> = {
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
export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
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
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
