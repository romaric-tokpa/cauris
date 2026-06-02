import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../../lib/api'
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
