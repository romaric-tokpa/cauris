import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../../lib/api'

/** Mois de démo (Aïcha) = mois max sélectionnable (pas de mois futurs vides). */
export const DEMO_MONTH = '2026-05'

/** KPIs Overview — totaux du mois courant + deltas MoM RÉELS (null si pas de M-1). */
export interface AnalyticsKpis {
  depenses: number
  revenus: number
  epargne: number
  savingsRate: number // % entier
  depensesDeltaPct: number | null // % m/m, une décimale
  revenusDeltaPct: number | null
  savingsRateDeltaPts: number | null // écart en POINTS de taux
}

/** Moyennes de la série (onglet Tendances) — sans delta (non dérivable naturellement). */
export interface AnalyticsAverages {
  revenusAvg: number
  depensesAvg: number
  epargneAvg: number
  savingsRateAvg: number
}

export interface CashflowPoint {
  m: string // YYYY-MM
  rev: number
  dep: number
  epa: number
}

/** Ligne de répartition (donut + tables). `v` = % du total ; PAS de trend (non dérivable). */
export interface BreakdownRow {
  categoryId: string
  name: string
  colorToken: string | null
  amount: number
  v: number
  txnCount: number // opérations de dépense du mois (dérivé du ledger)
}

export interface BudgetCompareRow {
  categoryId: string
  categoryName: string
  colorToken: string | null
  cap: number
  spent: number
  pct: number
  tone: 'ok' | 'warn' | 'over'
  ecart: number
  txnCount: number
}

export interface BudgetCompare {
  rows: BudgetCompareRow[]
  totals: { cap: number; spent: number; ecart: number; tauxConso: number }
}

export interface AnalyticsData {
  period: string // YYYY-MM
  kpis: AnalyticsKpis
  averages: AnalyticsAverages
  cashflow: CashflowPoint[]
  breakdown: BreakdownRow[]
  budgets: BudgetCompare
}

export function useAnalytics(month?: string) {
  const qs = month ? `?month=${month}` : ''
  return useQuery({
    queryKey: ['analytics', month ?? 'current'],
    queryFn: () => apiFetch<AnalyticsData>(`/api/analytics${qs}`),
  })
}
