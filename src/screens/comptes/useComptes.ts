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
  archived: boolean
  /** Vrai si aucune opération ne référence le compte → suppression dure permise (sinon archiver). */
  deletable: boolean
  /** Vrai si le compte est en mode enveloppe (cash allégé) → entrée « Mode enveloppe ». */
  envelope: boolean
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
  const archive = useMutation({
    mutationFn: (id: string) =>
      apiMutate<{ account: AccountRow }>(`/api/accounts/${id}/archive`, 'POST'),
    onSuccess: invalidate,
  })
  const unarchive = useMutation({
    mutationFn: (id: string) =>
      apiMutate<{ account: AccountRow }>(`/api/accounts/${id}/unarchive`, 'POST'),
    onSuccess: invalidate,
  })
  const remove = useMutation({
    mutationFn: (id: string) => apiMutate<{ ok: true }>(`/api/accounts/${id}`, 'DELETE'),
    onSuccess: invalidate,
  })
  return { create, update, block, unblock, archive, unarchive, remove }
}

/* ─────────────────────────── Enveloppes cash (Lot B4) ─────────────────────── */

/** Enveloppe d'un compte : `left`/`spent` DÉRIVÉS serveur (left = solde, spent = cap − left). */
export interface EnvelopeRow {
  id: string
  accountId: string
  accountName: string
  cap: number
  period: string
  lastReconciledAt: string | null
  left: number
  spent: number
}

/** Enveloppe d'un compte (ou `null` si le compte n'en a pas → état « à activer »). */
export function useEnvelope(accountId: string) {
  return useQuery({
    queryKey: ['envelope', accountId],
    queryFn: () =>
      apiFetch<{ envelope: EnvelopeRow | null }>(`/api/accounts/${accountId}/envelope`).then(
        (r) => r.envelope,
      ),
  })
}

export function useEnvelopeMutations(accountId: string) {
  const qc = useQueryClient()
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['envelope', accountId] })
    void qc.invalidateQueries({ queryKey: ['comptes'] })
    void qc.invalidateQueries({ queryKey: ['accounts'] })
    void qc.invalidateQueries({ queryKey: ['dashboard'] })
    void qc.invalidateQueries({ queryKey: ['transactions'] })
  }
  // Active le mode enveloppe sur le compte (plafond périodique).
  const create = useMutation({
    mutationFn: (cap: number) =>
      apiMutate<{ envelope: EnvelopeRow }>(`/api/accounts/${accountId}/envelope`, 'POST', { cap }),
    onSuccess: invalidate,
  })
  // Réconciliation : « il me reste X » → dépense agrégée (left − X) au ledger + MAJ date.
  const reconcile = useMutation({
    mutationFn: (remaining: number) =>
      apiMutate<{ envelope: EnvelopeRow; spend: number }>(
        `/api/accounts/${accountId}/envelope/reconcile`,
        'POST',
        { remaining },
      ),
    onSuccess: invalidate,
  })
  return { create, reconcile }
}
