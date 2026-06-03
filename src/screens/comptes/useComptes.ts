import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch, apiMutate } from '../../lib/api'
import type { TxnRow } from '../transactions/useTransactions'

/** Compte projeté côté front. `balance` = null si bloqué (jamais le vrai solde). */
export interface AccountRow {
  id: string
  name: string
  bank: string
  type: string
  accountNumber: string
  blocked: boolean
  balance: number | null
}

export interface ComptesResponse {
  accounts: AccountRow[]
  patrimoineTotal: number // Σ soldes réels (incl. bloqué), calculé serveur
  patrimoineSpark: number[] // épargne cumulée des 6 mois (tendance, pas soldes absolus)
}

export interface CompteDetailResponse {
  account: AccountRow
  recentTransactions: TxnRow[]
}

export function useComptes() {
  return useQuery({
    queryKey: ['comptes'],
    queryFn: () => apiFetch<ComptesResponse>('/api/accounts'),
  })
}

export function useAccount(id: string) {
  return useQuery({
    queryKey: ['comptes', id],
    queryFn: () => apiFetch<CompteDetailResponse>(`/api/accounts/${id}`),
  })
}

/** Charge utile d'écriture compte (solde = MAGNITUDE entière ≥ 0). */
export interface AccountWritePayload {
  name: string
  bank: string
  type: string
  accountNumber: string
  balance: number
}

/**
 * create/update/block/unblock → invalident la liste + détail comptes (`['comptes']`),
 * le sélecteur de comptes du formulaire transaction (`['accounts']` → débloque le cold
 * start : `formReady` repasse à true) ET le dashboard (`['dashboard']` : patrimoine +
 * widget comptes recalculés).
 */
export function useCompteMutations() {
  const qc = useQueryClient()
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['comptes'] })
    void qc.invalidateQueries({ queryKey: ['accounts'] })
    void qc.invalidateQueries({ queryKey: ['dashboard'] })
  }
  const create = useMutation({
    mutationFn: (data: AccountWritePayload) =>
      apiMutate<{ account: AccountRow }>('/api/accounts', 'POST', data),
    onSuccess: invalidate,
  })
  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AccountWritePayload }) =>
      apiMutate<{ account: AccountRow }>(`/api/accounts/${id}`, 'PATCH', data),
    onSuccess: invalidate,
  })
  const block = useMutation({
    mutationFn: (id: string) => apiMutate<{ account: AccountRow }>(`/api/accounts/${id}/block`, 'POST'),
    onSuccess: invalidate,
  })
  const unblock = useMutation({
    mutationFn: (id: string) =>
      apiMutate<{ account: AccountRow }>(`/api/accounts/${id}/unblock`, 'POST'),
    onSuccess: invalidate,
  })
  return { create, update, block, unblock }
}
