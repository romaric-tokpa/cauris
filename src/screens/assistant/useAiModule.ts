import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../../lib/api'

/* ───────────────────────────── Prévisions ─────────────────────────────────
 * Miroir des types `server/ai.ts` (mode 'forecasts'). PRÉVISION §1.6 : chaque solde
 * projeté est une ESTIMATION encadrée (horizon + confiance + base) ; aucun champ
 * exécutable. */
export interface ForecastPoint {
  label: string
  amount: number
  delta: number
}
export interface BudgetRisk {
  name: string
  consumedPct: number
  projectedPct: number
  risk: 'ok' | 'warn' | 'over'
}
export interface ForecastsResult {
  available: boolean
  current: number
  points: ForecastPoint[]
  series: { labels: string[]; values: number[] }
  realizedCount: number
  budgetRisks: BudgetRisk[]
  horizon: string
  confidence: 'faible' | 'moyenne' | 'élevée'
  basis: string
  framing: string
}

/** Prévisions IA. Clé `['ai','forecasts']` — couverte par l'invalidation `['dashboard']`
 *  (les prévisions dépendent du solde/flux, qui bougent aux mutations de transaction). */
export function useForecasts() {
  return useQuery({
    queryKey: ['dashboard', 'ai', 'forecasts'],
    queryFn: () => apiFetch<ForecastsResult>('/api/ai/forecasts'),
  })
}

/* ───────────────────────────── Anomalies ──────────────────────────────────
 * Miroir des types `server/ai.ts` (mode 'anomalies'). §1.6 : chaque anomalie est
 * EXPLIQUÉE par comparaison à l'historique de sa catégorie ; jamais d'anomalie
 * inventée (liste vide → « rien à signaler »). Aucun champ exécutable. */
export interface Anomaly {
  id: string
  name: string
  category: string
  amount: number
  when: string
  level: 'Élevé' | 'Moyen'
  reason: string
  href: string
}
export interface Recurring {
  name: string
  category: string
  amount: number
}
export interface AnomaliesResult {
  anomalies: Anomaly[]
  recurring: Recurring[]
  summary: string
}

/** Anomalies IA. Clé `['dashboard','ai','anomalies']` — invalidée avec `['dashboard']`
 *  (la détection relit le ledger du mois, qui change aux mutations de transaction). */
export function useAnomalies() {
  return useQuery({
    queryKey: ['dashboard', 'ai', 'anomalies'],
    queryFn: () => apiFetch<AnomaliesResult>('/api/ai/anomalies'),
  })
}
