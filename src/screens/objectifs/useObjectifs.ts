import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch, apiMutate } from '../../lib/api'

export type GoalStatus = 'En cours' | 'Atteint' | 'En retard'

export interface GoalRow {
  id: string
  name: string
  currentAmount: number
  targetAmount: number
  targetDate: string | null // YYYY-MM-DD | null
  pct: number
  reste: number
  status: GoalStatus
}

export interface Contribution {
  id: string
  goalId: string
  accountId: string | null
  amount: number // entier FCFA > 0
  occurredAt: string // YYYY-MM-DD
}

export interface GoalsResponse {
  goals: GoalRow[]
}
export interface GoalDetailResponse {
  goal: GoalRow
  contributions: Contribution[]
}

/** Charge utile d'une contribution (montant entier positif ; signe non requis). */
export interface ContributionPayload {
  accountId: string | null
  amount: number
  occurredAt: string
}

export function useGoals() {
  return useQuery({
    queryKey: ['goals'],
    queryFn: () => apiFetch<GoalsResponse>('/api/goals'),
  })
}

export function useGoal(id: string) {
  return useQuery({
    queryKey: ['goals', id],
    queryFn: () => apiFetch<GoalDetailResponse>(`/api/goals/${id}`),
  })
}

/** Projection IA d'un objectif (Phase 12 sous-bloc 4) — miroir de `server/ai.ts`.
 *  PRÉVISION §1.6 : estimation encadrée (horizon + confiance + base), jamais une
 *  certitude. Aucun champ exécutable. */
export interface GoalProjection {
  eta: string | null
  horizon: string
  confidence: 'faible' | 'moyenne' | 'élevée'
  basis: string
  text: string
  suggestedPace: number | null
  advice: string
}

/**
 * Projection d'un objectif. Clé `['goals', id, 'projection']` → couverte par
 * l'invalidation `['goals']` de `useContributionMutations` (la projection dépend
 * des contributions → se rafraîchit après ajout).
 */
export function useGoalProjection(id: string) {
  return useQuery({
    queryKey: ['goals', id, 'projection'],
    queryFn: () => apiFetch<GoalProjection>(`/api/ai/goals/${id}/projection`),
  })
}

/** Ajout d'une contribution → invalide la liste/détail objectifs ET le dashboard
 *  (la progression bouge). `['goals']` couvre `['goals', id]` (préfixe). */
export function useContributionMutations(goalId: string) {
  const qc = useQueryClient()
  const create = useMutation({
    mutationFn: (data: ContributionPayload) =>
      apiMutate<{ contribution: Contribution; goal: GoalRow }>(
        `/api/goals/${goalId}/contributions`,
        'POST',
        data,
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['goals'] })
      void qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
  return { create }
}
