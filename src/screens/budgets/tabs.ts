import type { BudgetRow } from './useBudgets'

/** Onglets liste — desktop (avec Archivés) et mobile (sans), libellés 1:1 du wireframe. */
export const TABS_DESKTOP = ['Actifs', 'En alerte', 'Dépassés', 'Archivés'] as const
export const TABS_MOBILE = ['Actifs', 'En alerte', 'Dépassés'] as const
export type Tab = (typeof TABS_DESKTOP)[number]

/** Libellé de statut d'un budget (badge) selon son ton. */
export const STATUS: Record<BudgetRow['tone'], string> = {
  over: 'Dépassé',
  warn: 'Alerte',
  ok: 'Sur la voie',
}

/** Filtre par onglet : Actifs = tous ; En alerte = warn ; Dépassés = over ;
 *  Archivés = aucun (pas de notion d'archivage en base → état vide soigné). */
export function filterByTab(budgets: BudgetRow[], tab: string): BudgetRow[] {
  if (tab === 'En alerte') return budgets.filter((b) => b.tone === 'warn')
  if (tab === 'Dépassés') return budgets.filter((b) => b.tone === 'over')
  if (tab === 'Archivés') return []
  return budgets
}
