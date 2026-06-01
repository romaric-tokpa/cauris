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
