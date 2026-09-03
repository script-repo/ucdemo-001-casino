import type { ReactNode } from "react";

/**
 * Line icons drawn inline rather than pulled from a package. The portal needs
 * about thirty glyphs at one weight, which is not worth a dependency, and
 * inline paths keep the icon set on the same 24px grid as the design guide.
 */
export type IconName =
  | "grid"
  | "zap"
  | "code"
  | "dice"
  | "megaphone"
  | "coins"
  | "shield"
  | "book"
  | "star"
  | "clock"
  | "checkCircle"
  | "sparkles"
  | "search"
  | "bell"
  | "chevronDown"
  | "arrowRight"
  | "users"
  | "workflow"
  | "trendingUp"
  | "tag"
  | "chart"
  | "mail"
  | "eye"
  | "fileText"
  | "plus"
  | "messageSquare"
  | "alertTriangle"
  | "checkShield"
  | "crown";

const PATHS: Record<IconName, ReactNode> = {
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  zap: <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />,
  code: <path d="m8 6-6 6 6 6M16 6l6 6-6 6" />,
  dice: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="15.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </>
  ),
  megaphone: (
    <>
      <path d="M4 10v4a2 2 0 0 0 2 2h1l2 4h2l-1-4 8 3V5L9 8H6a2 2 0 0 0-2 2Z" />
      <path d="M19 9a3 3 0 0 1 0 6" />
    </>
  ),
  coins: (
    <>
      <ellipse cx="9" cy="7" rx="6" ry="3" />
      <path d="M3 7v5c0 1.7 2.7 3 6 3s6-1.3 6-3V7" />
      <path d="M9 15v2c0 1.7 2.7 3 6 3s6-1.3 6-3v-5c0-1.2-1.4-2.3-3.4-2.8" />
    </>
  ),
  shield: <path d="M12 3 5 6v6c0 4.2 2.9 7.7 7 9 4.1-1.3 7-4.8 7-9V6l-7-3Z" />,
  book: (
    <>
      <path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H19v16H7.5A2.5 2.5 0 0 0 5 20.5Z" />
      <path d="M5 20.5A2.5 2.5 0 0 1 7.5 18H19v4H7.5A2.5 2.5 0 0 1 5 20.5Z" />
    </>
  ),
  star: <path d="m12 3 2.7 5.7 6.3.9-4.5 4.4 1 6.2-5.5-3-5.5 3 1-6.2L3 9.6l6.3-.9L12 3Z" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  checkCircle: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.5 2.5 4.5-5" />
    </>
  ),
  sparkles: (
    <>
      <path d="m12 3 1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3Z" />
      <path d="M18 16.5 18.8 18.5 20.8 19.3 18.8 20.1 18 22.1 17.2 20.1 15.2 19.3 17.2 18.5 18 16.5Z" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.6-3.6" />
    </>
  ),
  bell: (
    <>
      <path d="M18 15V10a6 6 0 1 0-12 0v5l-2 3h16l-2-3Z" />
      <path d="M10.5 21a2 2 0 0 0 3 0" />
    </>
  ),
  chevronDown: <path d="m6 9 6 6 6-6" />,
  arrowRight: <path d="M4 12h15m-6-6 6 6-6 6" />,
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M16.5 5.2a3.5 3.5 0 0 1 0 6.6M17 14.2a6.5 6.5 0 0 1 4.5 5.8" />
    </>
  ),
  workflow: (
    <>
      <rect x="3" y="3" width="7" height="6" rx="1.5" />
      <rect x="14" y="15" width="7" height="6" rx="1.5" />
      <path d="M6.5 9v5a3 3 0 0 0 3 3H14" />
    </>
  ),
  trendingUp: <path d="m3 17 6-6 4 4 8-8m0 0h-5m5 0v5" />,
  tag: (
    <>
      <path d="M3 12.5V4.5A1.5 1.5 0 0 1 4.5 3h8l8.5 8.5a1.5 1.5 0 0 1 0 2.1l-6.9 6.9a1.5 1.5 0 0 1-2.1 0L3 12.5Z" />
      <circle cx="7.8" cy="7.8" r="1.4" />
    </>
  ),
  chart: <path d="M4 20V10m5 10V4m5 16v-7m5 7V8" />,
  mail: (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="2" />
      <path d="m3.5 7 8.5 6 8.5-6" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  fileText: (
    <>
      <path d="M13.5 2.5H7A2 2 0 0 0 5 4.5v15a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5.5-5.5Z" />
      <path d="M13.5 2.5V8H19M9 13h6M9 17h4" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  messageSquare: <path d="M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v10Z" />,
  alertTriangle: (
    <>
      <path d="M10.3 3.9 2.5 17.5A2 2 0 0 0 4.2 20.5h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4.5M12 17h.01" />
    </>
  ),
  checkShield: (
    <>
      <path d="M12 3 5 6v6c0 4.2 2.9 7.7 7 9 4.1-1.3 7-4.8 7-9V6l-7-3Z" />
      <path d="m9 12 2.2 2.2L15.5 10" />
    </>
  ),
  crown: <path d="M4 18h16M4 18 3 7l5 4 4-6 4 6 5-4-1 11" />,
};

export function Icon({
  name,
  className = "size-5",
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {PATHS[name]}
    </svg>
  );
}
