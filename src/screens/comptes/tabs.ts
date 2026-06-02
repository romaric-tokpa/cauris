import type { AccountRow } from './useComptes'

/** Onglets liste — 1:1 du wireframe ComptesDesk (mêmes 5 sur desktop et mobile). */
export const TABS = ['Tous', 'Trésorerie', 'Épargne', 'Mobile money', 'Bloqués'] as const

/** Filtre par onglet : « Tous » = défaut ; « Bloqués » = blocked ; sinon par type. */
export function filterByTab(accounts: AccountRow[], tab: string): AccountRow[] {
  if (tab === 'Bloqués') return accounts.filter((a) => a.blocked)
  if (tab === 'Trésorerie' || tab === 'Épargne' || tab === 'Mobile money')
    return accounts.filter((a) => a.type === tab)
  return accounts
}
