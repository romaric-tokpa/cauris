import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch, apiMutate } from '../../lib/api'

/** Catégorie enrichie pour la page Catégories (cf. GET /api/categories enrichi). */
export interface CategoryRow {
  id: string
  name: string
  kind: string // 'expense' | 'income'
  colorToken: string | null // 'cat-1'…'cat-6'
  sort: number
  txnCount: number // opérations du mois (dérivé du ledger)
  hasBudget: boolean // un budget du mois référence cette catégorie
}

/** Payload d'écriture (création / édition). */
export interface CategoryWritePayload {
  name: string
  kind: string
  colorToken: string | null
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => apiFetch<{ categories: CategoryRow[] }>('/api/categories'),
  })
}

/**
 * Mutations Catégories. Toute écriture invalide ['categories'] (+ ['dashboard'] et
 * ['analytics'] qui dérivent des catégories : le rendu reste cohérent partout).
 */
export function useCategoryMutations() {
  const qc = useQueryClient()
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['categories'] })
    void qc.invalidateQueries({ queryKey: ['dashboard'] })
    void qc.invalidateQueries({ queryKey: ['analytics'] })
  }

  const create = useMutation({
    mutationFn: (payload: CategoryWritePayload) =>
      apiMutate<{ category: CategoryRow }>('/api/categories', 'POST', payload),
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoryWritePayload }) =>
      apiMutate<{ category: CategoryRow }>(`/api/categories/${id}`, 'PATCH', data),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id: string) => apiMutate<{ ok: true }>(`/api/categories/${id}`, 'DELETE'),
    onSuccess: invalidate,
  })

  return { create, update, remove }
}
