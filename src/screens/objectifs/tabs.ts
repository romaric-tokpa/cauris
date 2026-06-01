import type { GoalRow } from './useObjectifs'

/** Onglets liste — desktop (avec Archivés) et mobile (sans), libellés 1:1 du wireframe. */
export const TABS_DESKTOP = ['En cours', 'Atteints', 'En retard', 'Archivés'] as const
export const TABS_MOBILE = ['En cours', 'Atteints', 'En retard'] as const

/** Filtre par onglet (statut dérivé) : « En cours » = défaut ; « Archivés » = aucun
 *  (pas de notion d'archivage en base → état vide soigné). */
export function filterByTab(goals: GoalRow[], tab: string): GoalRow[] {
  if (tab === 'Atteints') return goals.filter((g) => g.status === 'Atteint')
  if (tab === 'En retard') return goals.filter((g) => g.status === 'En retard')
  if (tab === 'Archivés') return []
  return goals.filter((g) => g.status === 'En cours')
}
