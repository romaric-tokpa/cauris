import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch, apiMutate } from '../../lib/api'
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
  frequency: string // 'Hebdo' | 'Mensuel' | 'Annuel'
  alertPct: number // 80 | 90 | 100
  rollover: boolean
  archived: boolean
  pct: number
  tone: BudgetTone
}

/** Charge utile d'écriture (plafond entier FCFA > 0 ; serveur fixe période + spent). */
export interface BudgetWritePayload {
  categoryId: string
  cap: number
  frequency: string
  alertPct: number
  rollover: boolean
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

/** Budgets archivés (onglet « Archivés ») — `ecart = spent − cap`. `enabled` évite
 *  la requête tant qu'on n'est pas sur l'onglet. */
export function useArchivedBudgets(enabled = true) {
  return useQuery({
    queryKey: ['budgets', 'archived'],
    queryFn: () =>
      apiFetch<{ budgets: (BudgetRow & { ecart: number })[] }>('/api/budgets?archived=true').then(
        (r) => r.budgets,
      ),
    enabled,
  })
}

/** create/update/archive/unarchive → invalident la liste + détail budgets ET le dashboard
 *  (widget « budgets en alerte » dérivé du même ledger). */
export function useBudgetMutations() {
  const qc = useQueryClient()
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['budgets'] })
    void qc.invalidateQueries({ queryKey: ['dashboard'] })
  }
  const create = useMutation({
    mutationFn: (data: BudgetWritePayload) =>
      apiMutate<{ budget: BudgetRow }>('/api/budgets', 'POST', data),
    onSuccess: invalidate,
  })
  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: BudgetWritePayload }) =>
      apiMutate<{ budget: BudgetRow }>(`/api/budgets/${id}`, 'PATCH', data),
    onSuccess: invalidate,
  })
  const archive = useMutation({
    mutationFn: (id: string) => apiMutate<{ budget: BudgetRow }>(`/api/budgets/${id}/archive`, 'POST'),
    onSuccess: invalidate,
  })
  const unarchive = useMutation({
    mutationFn: (id: string) =>
      apiMutate<{ budget: BudgetRow }>(`/api/budgets/${id}/unarchive`, 'POST'),
    onSuccess: invalidate,
  })
  return { create, update, archive, unarchive }
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
