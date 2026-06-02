/** Onglets de l'écran Prêt — 1:1 du wireframe (subnav PretSub). */
export const TABS = ['Vue générale', 'Amortissement', 'Paiements', 'Simulation'] as const
export type Tab = (typeof TABS)[number]
export const DEFAULT_TAB: Tab = 'Vue générale'
