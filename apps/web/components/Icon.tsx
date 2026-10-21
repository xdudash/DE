/**
 * The app's icon set, drawn inline so it works offline and inherits colour.
 * Icons are always decorative: the control or figure next to them carries the name,
 * so every icon is hidden from assistive technology.
 */
import type { ReactNode } from "react";

export type IconName =
  | "home" | "practice" | "map" | "profile"
  | "flame" | "bolt" | "heart" | "lock" | "check" | "close" | "clock" | "target"
  | "sound" | "globe" | "calendar" | "bell" | "user" | "phone" | "trash" | "book";

const STROKE = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

const SHAPES: Record<IconName, ReactNode> = {
  home: <path {...STROKE} d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" />,
  practice: (
    <g {...STROKE}>
      <path d="M20 12a8 8 0 1 1-2.6-5.9" />
      <path d="M20 4v4h-4" />
    </g>
  ),
  map: (
    <g {...STROKE}>
      <circle cx="6" cy="7" r="2.5" />
      <circle cx="18" cy="12" r="2.5" />
      <circle cx="7" cy="18" r="2.5" />
      <path d="M8.2 8.3 15.6 11M16.4 14l-7 2.6" />
    </g>
  ),
  profile: (
    <g {...STROKE}>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </g>
  ),
  user: (
    <g {...STROKE}>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </g>
  ),
  flame: (
    <path
      fill="currentColor"
      d="M12.6 2.2c.3 3 2.4 4.6 4 6.6 1.3 1.7 2.2 3.5 2.2 5.6A6.8 6.8 0 0 1 12 21.2a6.8 6.8 0 0 1-6.8-6.6c0-2.6 1.3-4.6 3.3-6.1.1 1.8.9 3.2 2.3 3.9-.5-3.6.5-7 1.8-10.2z"
    />
  ),
  bolt: <path fill="currentColor" d="M13.8 2 4.6 13.6h6.2L9.6 22l9.8-12.1h-6.3z" />,
  heart: (
    <path fill="currentColor" d="M12 20.8S3.8 15.9 3.8 9.9A4.4 4.4 0 0 1 12 7.6a4.4 4.4 0 0 1 8.2 2.3c0 6-8.2 10.9-8.2 10.9z" />
  ),
  lock: (
    <g {...STROKE}>
      <rect x="5" y="11" width="14" height="9.5" rx="2" />
      <path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3" />
    </g>
  ),
  check: <path {...STROKE} strokeWidth={3} d="M5 12.5 10 17.5 19.5 7" />,
  close: <path {...STROKE} strokeWidth={2.5} d="M6 6l12 12M18 6 6 18" />,
  clock: (
    <g {...STROKE}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </g>
  ),
  target: (
    <g {...STROKE}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </g>
  ),
  sound: (
    <g {...STROKE}>
      <path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" />
      <path d="M15.5 9a4.5 4.5 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11" />
    </g>
  ),
  globe: (
    <g {...STROKE}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.4 2.4 3.6 5.2 3.6 8.5s-1.2 6.1-3.6 8.5c-2.4-2.4-3.6-5.2-3.6-8.5S9.6 5.9 12 3.5z" />
    </g>
  ),
  calendar: (
    <g {...STROKE}>
      <rect x="4" y="5.5" width="16" height="14.5" rx="2" />
      <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" />
    </g>
  ),
  bell: (
    <g {...STROKE}>
      <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15z" />
      <path d="M10 20.5a2.2 2.2 0 0 0 4 0" />
    </g>
  ),
  phone: (
    <g {...STROKE}>
      <rect x="7" y="3" width="10" height="18" rx="2.5" />
      <path d="M11 17.5h2" />
    </g>
  ),
  trash: (
    <g {...STROKE}>
      <path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13" />
    </g>
  ),
  book: (
    <g {...STROKE}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
      <path d="M4 5.5v15" />
    </g>
  ),
};

export function Icon({ name, size = 22, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={className}>
      {SHAPES[name]}
    </svg>
  );
}
