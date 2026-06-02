/** Onglets de l'écran Analytics — 1:1 du wireframe (subnav AnaSub). */
export const TABS = ['Overview', 'Catégories', 'Tendances', 'Budget vs réel'] as const
export type Tab = (typeof TABS)[number]
export const DEFAULT_TAB: Tab = 'Overview'

/** Onglets disponibles sur mobile (wireframe : pas de « Budget vs réel »). */
export const MOBILE_TABS = ['Overview', 'Catégories', 'Tendances'] as const
