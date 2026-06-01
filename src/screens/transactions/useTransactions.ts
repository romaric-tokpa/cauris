import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch, apiMutate } from '../../lib/api'

export interface TxnRow {
  id: string
  accountId: string
  categoryId: string | null
  transferAccountId: string | null
  label: string
  note: string | null
  amount: number // entier FCFA signé
  occurredAt: string // YYYY-MM-DD
  type: string
  accountName: string | null
  categoryName: string | null
  transferAccountName: string | null
}

export interface TxnStats {
  entrees: number
  sorties: number
  net: number
  count: number
}

export interface TxnListResponse {
  transactions: TxnRow[]
  stats: TxnStats
}

export interface AccountRef {
  id: string
  name: string
  bank: string
  type: string
  balance: number
  blocked: boolean
}
export interface CategoryRef {
  id: string
  name: string
  kind: string
  colorToken: string | null
}

/** Charge utile d'écriture envoyée au serveur (MAGNITUDE positive ; signe dérivé serveur). */
export interface TxnWritePayload {
  type: string
  label: string
  note: string | null
  amount: number
  accountId: string
  categoryId: string | null
  transferAccountId: string | null
  occurredAt: string
}

/** Filtres = clés stables pour la queryKey (dérivées de l'URL). */
export type TxnFilters = Record<string, string>

function buildQuery(filters: TxnFilters): string {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(filters)) if (v) p.set(k, v)
  const s = p.toString()
  return s ? `?${s}` : ''
}

export function useTransactions(filters: TxnFilters) {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => apiFetch<TxnListResponse>(`/api/transactions${buildQuery(filters)}`),
  })
}

export function useAccounts() {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: () => apiFetch<{ accounts: AccountRef[] }>('/api/accounts').then((r) => r.accounts),
  })
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () =>
      apiFetch<{ categories: CategoryRef[] }>('/api/categories').then((r) => r.categories),
  })
}

/** create/update/delete → invalident la liste ET le dashboard (cohérence des vues). */
export function useTxnMutations() {
  const qc = useQueryClient()
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['transactions'] })
    void qc.invalidateQueries({ queryKey: ['dashboard'] })
    // Le détail budget dérive son total catégorie du ledger → re-dériver après mutation.
    void qc.invalidateQueries({ queryKey: ['budgets'] })
  }
  const create = useMutation({
    mutationFn: (data: TxnWritePayload) =>
      apiMutate<{ transaction: TxnRow }>('/api/transactions', 'POST', data),
    onSuccess: invalidate,
  })
  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: TxnWritePayload }) =>
      apiMutate<{ transaction: TxnRow }>(`/api/transactions/${id}`, 'PATCH', data),
    onSuccess: invalidate,
  })
  const remove = useMutation({
    mutationFn: (id: string) => apiMutate<{ status: string }>(`/api/transactions/${id}`, 'DELETE'),
    onSuccess: invalidate,
  })
  return { create, update, remove }
}
