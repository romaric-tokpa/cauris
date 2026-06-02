import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../../lib/api'
import type { TxnRow, TxnStats } from '../transactions/useTransactions'

export type BudgetTone = 'ok' | 'warn' | 'over'

/** Une enveloppe budgétée du mois. `spent` est STOCKÉ (≠ dépense catégorie dérivée). */
export interface BudgetRow {
  id: string
  categoryId: string
  categoryName: string
  colorToken: string | null
  cap: number
  spent: number
  txnCount: number
  period: string // YYYY-MM
  pct: number
  tone: BudgetTone
}

export interface BudgetsSummary {
  totalCap: number
  totalSpent: number
  pct: number
  restant: number
  alertCount: number // budgets en alerte (tone warn)
  overCount: number // budgets dépassés (tone over)
}

export interface BudgetsResponse {
  budgets: BudgetRow[]
  summary: BudgetsSummary
}

export interface BudgetDetailResponse {
  budget: BudgetRow & { ecart: number } // ecart = spent - cap (enveloppe)
  categoryTotal: number // dépense TOTALE de la catégorie, DÉRIVÉE du ledger
  linkedTransactions: TxnRow[]
  linkedStats: TxnStats
}

/** Liste des budgets + résumé d'en-tête (période courante côté serveur). */
export function useBudgets() {
  return useQuery({
    queryKey: ['budgets'],
    queryFn: () => apiFetch<BudgetsResponse>('/api/budgets'),
  })
}

/** Détail d'un budget : enveloppe (stockée) + dépense catégorie (dérivée) + liées. */
export function useBudget(id: string) {
  return useQuery({
    queryKey: ['budgets', id],
    queryFn: () => apiFetch<BudgetDetailResponse>(`/api/budgets/${id}`),
  })
}

/** Conseil IA d'un budget (Phase 12 sous-bloc 3) — miroir de `server/ai.ts`. `href` =
 *  lien de NAVIGATION (lecture seule), jamais une action exécutable (§1.6). */
export interface BudgetAdvice {
  text: string
  tone: 'ok' | 'warn' | 'over' | ''
  href: string | null
}

/**
 * Conseil contextuel d'un budget. Clé `['budgets', id, 'advice']` → couverte par
 * l'invalidation `['budgets']` de `useTxnMutations` (le conseil cite la dépense
 * catégorie dérivée → se rafraîchit après mutation). `enabled` : seul le cas
 * dépassement affiche le conseil dans le détail.
 */
export function useBudgetAdvice(id: string, enabled: boolean) {
  return useQuery({
    queryKey: ['budgets', id, 'advice'],
    queryFn: () => apiFetch<BudgetAdvice>(`/api/ai/budgets/${id}/advice`),
    enabled,
  })
}
