import type { ReactElement } from 'react'

/**
 * Jeu d'icônes ligne porté À L'IDENTIQUE de `design/wireframe/wf-lib.jsx` (ICONS).
 * Chaque entrée = les enfants SVG, rendus dans le wrapper `<Icon>` (viewBox 24×24,
 * stroke currentColor). Ne pas réinterpréter les `d`/coordonnées.
 */
export const ICONS = {
  grid: (
    <>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.4" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.4" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.4" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.4" />
    </>
  ),
  exchange: (
    <>
      <path d="M8 4v15" />
      <path d="M5 16l3 3 3-3" />
      <path d="M16 20V5" />
      <path d="M19 8l-3-3-3 3" />
    </>
  ),
  gauge: (
    <>
      <path d="M5 17a7 7 0 0 1 14 0" />
      <path d="M12 17l4.5-3.2" />
      <circle cx="12" cy="17" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </>
  ),
  analytics: (
    <>
      <path d="M4 20h16" />
      <path d="M6 20v-7" />
      <path d="M11 20V6" />
      <path d="M16 20v-4" />
      <path d="M20.5 20v-9" />
    </>
  ),
  wallet: (
    <>
      <path d="M4 8.5C4 7 5 6 6.5 6H18v3" />
      <path d="M4 8.5V18a2 2 0 0 0 2 2h13a1 1 0 0 0 1-1V9H6" />
      <circle cx="16.5" cy="14" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  bank: (
    <>
      <path d="M4 9l8-5 8 5" />
      <path d="M5 9h14" />
      <path d="M6 9v8M10 9v8M14 9v8M18 9v8" />
      <path d="M4 20h16" />
    </>
  ),
  bell: (
    <>
      <path d="M6 9a6 6 0 0 1 12 0c0 5 1.8 6.5 1.8 6.5H4.2S6 14 6 9z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.2 5.2l2.1 2.1M16.7 16.7l2.1 2.1M18.8 5.2l-2.1 2.1M7.3 16.7l-2.1 2.1" />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M20 20l-4.8-4.8" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14M5 12h14" />
    </>
  ),
  chevron: (
    <>
      <path d="M9 5l7 7-7 7" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5.5" width="16" height="15" rx="2" />
      <path d="M4 10h16M8.5 3v4M15.5 3v4" />
    </>
  ),
  menu: (
    <>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </>
  ),
  up: (
    <>
      <path d="M7 17L17 7" />
      <path d="M9 7h8v8" />
    </>
  ),
  down: (
    <>
      <path d="M7 7l10 10" />
      <path d="M17 9v8h-8" />
    </>
  ),
  filter: (
    <>
      <path d="M4 6h16M7 12h10M10 18h4" />
    </>
  ),
  flag: (
    <>
      <path d="M6 21V4" />
      <path d="M6 4h11l-2 3.5L17 11H6" />
    </>
  ),
  arrowR: (
    <>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </>
  ),
  home: (
    <>
      <path d="M4 11l8-7 8 7" />
      <path d="M6 9.5V20h12V9.5" />
      <path d="M10 20v-5h4v5" />
    </>
  ),
  more: (
    <>
      <circle cx="6" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="18" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  bolt: (
    <>
      <path d="M13 3L5 13h6l-1 8 8-11h-6z" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      <circle cx="12" cy="15.5" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  unlock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 7.5-2" />
      <circle cx="12" cy="15.5" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.4" />
      <path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l7 3v5c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M4 12h16" />
      <path d="M12 4c2.6 2.4 2.6 13.6 0 16M12 4c-2.6 2.4-2.6 13.6 0 16" />
    </>
  ),
  tag: (
    <>
      <path d="M4 12.8V5.5A1.5 1.5 0 0 1 5.5 4h7.3a2 2 0 0 1 1.4.6l5.2 5.2a2 2 0 0 1 0 2.8l-6.3 6.3a2 2 0 0 1-2.8 0L4.6 14.2A2 2 0 0 1 4 12.8z" />
      <circle cx="8.5" cy="8.5" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M9.4 9.3a2.8 2.8 0 0 1 5.3 1c0 1.9-2.7 2.2-2.7 3.9" />
      <circle cx="12" cy="17" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  logout: (
    <>
      <path d="M14 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4" />
      <path d="M14 12H4M7 8l-4 4 4 4" />
    </>
  ),
  check: (
    <>
      <path d="M5 13l4 4L19 7" />
    </>
  ),
  moon: (
    <>
      <path d="M20 13.5A8 8 0 1 1 10.5 4 6.5 6.5 0 0 0 20 13.5z" />
    </>
  ),
  download: (
    <>
      <path d="M12 4v10M8 11l4 4 4-4M5 19h14" />
    </>
  ),
  trash: (
    <>
      <path d="M5 7h14M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6.5 7l1 13h9l1-13" />
    </>
  ),
  edit: (
    <>
      <path d="M4 20h4L18 10l-4-4L4 16z" />
      <path d="M13.5 6.5l4 4" />
    </>
  ),
  card: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10h18" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="2.6" />
    </>
  ),
  inbox: (
    <>
      <path d="M4 13l2.5-7.5h11L20 13" />
      <path d="M4 13v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5h-5l-1.5 2.5h-3L9 13z" />
    </>
  ),
  alert: (
    <>
      <path d="M12 4l9 16H3z" />
      <path d="M12 10v4.5" />
      <circle cx="12" cy="17.5" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  message: (
    <>
      <path d="M5 5h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H10l-4 3.2V15H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />
      <path d="M8.5 9.5h7M8.5 12h4" />
    </>
  ),
  send: (
    <>
      <path d="M5 12l14-7-5.5 15-3-6z" />
      <path d="M19 5l-8 7" />
    </>
  ),
  repeat: (
    <>
      <path d="M19 12a7 7 0 1 1-2.2-5.1" />
      <path d="M20 4.5V9h-4.5" />
    </>
  ),
  trendUp: (
    <>
      <path d="M4 20h16" />
      <path d="M5 16l4.5-4.5 3 3L18 8" />
      <path d="M14.5 8H18v3.5" />
    </>
  ),
  pause: (
    <>
      <path d="M9 5v14" />
      <path d="M15 5v14" />
    </>
  ),
  cash: (
    <>
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.6" />
    </>
  ),
  // Note vocale (Lot B2) — micro, stop, smartphone : glyphes maison ajoutés (absents du
  // jeu wireframe d'origine ; le wireframe capture les nomme `mic`/`stop`/`phone`).
  mic: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M6 11a6 6 0 0 0 12 0" />
      <path d="M12 17v4" />
      <path d="M9 21h6" />
    </>
  ),
  stop: <rect x="7" y="7" width="10" height="10" rx="2.2" />,
  phone: (
    <>
      <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
      <path d="M10.5 18.5h3" />
    </>
  ),
  // Réglages de suivi du cash (Lot B4) — curseurs/égaliseur (absent du jeu wireframe).
  sliders: (
    <>
      <path d="M4 7h7M15 7h5" />
      <circle cx="13" cy="7" r="2" />
      <path d="M4 12h9M17 12h3" />
      <circle cx="15" cy="12" r="2" />
      <path d="M4 17h5M13 17h7" />
      <circle cx="11" cy="17" r="2" />
    </>
  ),
} satisfies Record<string, ReactElement>

export type IconName = keyof typeof ICONS
