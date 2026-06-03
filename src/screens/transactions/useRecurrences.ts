import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch, apiMutate } from '../../lib/api'

/** Ligne de récurrence telle que renvoyée par `GET /api/recurrences` (amount signé). */
export interface RecurrenceRow {
  id: string
  name: string
  amount: number // entier FCFA signé (charge → négatif)
  frequency: string // 'monthly'
  nextDate: string // YYYY-MM-DD
  known: boolean // Confirmée (true) / À confirmer (false)
  categoryId: string | null
  accountId: string | null
}

/** Charge utile d'écriture (MAGNITUDE positive ; le serveur stocke le signe). */
export interface RecurrenceWritePayload {
  name: string
  amount: number
  frequency: string
  nextDate: string
  known: boolean
  categoryId: string | null
  accountId: string | null
}

/** Liste des récurrences (triées prochaine échéance côté serveur). `enabled` évite
 *  la requête tant qu'on n'est pas sur l'onglet Récurrentes. */
export function useRecurrences(enabled = true) {
  return useQuery({
    queryKey: ['recurrences'],
    queryFn: () =>
      apiFetch<{ recurrences: RecurrenceRow[] }>('/api/recurrences').then((r) => r.recurrences),
    enabled,
  })
}

/** create/update/delete → invalident la liste des récurrences. */
export function useRecurrenceMutations() {
  const qc = useQueryClient()
  const invalidate = () => void qc.invalidateQueries({ queryKey: ['recurrences'] })
  const create = useMutation({
    mutationFn: (data: RecurrenceWritePayload) =>
      apiMutate<{ recurrence: RecurrenceRow }>('/api/recurrences', 'POST', data),
    onSuccess: invalidate,
  })
  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: RecurrenceWritePayload }) =>
      apiMutate<{ recurrence: RecurrenceRow }>(`/api/recurrences/${id}`, 'PATCH', data),
    onSuccess: invalidate,
  })
  const remove = useMutation({
    mutationFn: (id: string) => apiMutate<{ status: string }>(`/api/recurrences/${id}`, 'DELETE'),
    onSuccess: invalidate,
  })
  return { create, update, remove }
}
