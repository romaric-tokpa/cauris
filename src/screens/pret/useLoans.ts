import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch, apiMutate } from '../../lib/api'
import type { AmortLine } from '../../lib/loanSim'

/** Prêt projeté côté front (champs publics + avancement dérivé serveur). */
export interface LoanRow {
  id: string
  name: string
  principal: number
  remaining: number
  rateBps: number
  monthlyPayment: number
  termMonths: number
  monthsRemaining: number
  nextDueDate: string | null
  kind: string
  taxBps: number
  insuranceBps: number
  feesUpfront: number
  firstDueDate: string | null
  progress: number
}

/** Ligne d'échéancier (les champs DB en plus — userId/id/loanId — sont ignorés ici). */
export interface AmortRow {
  periodMonth: string // YYYY-MM
  principalPart: number
  interestPart: number
  taxPart: number | null // mode tout-compris (null = prêt simple)
  insurancePart: number | null
  remainingAfter: number
  sort: number
}

/** Charge utile de création/édition : champs + échéancier calculé CLIENT (loanSim). */
export interface LoanWritePayload {
  name: string
  kind: string
  principal: number
  rateBps: number
  taxBps: number
  insuranceBps: number
  feesUpfront: number
  termMonths: number
  monthlyPayment: number
  firstDueDate: string
  firstPeriodDays: number
  schedule: AmortLine[]
}

export interface PaymentRow {
  periodMonth: string
  amount: number
  dueDate: string // YYYY-MM-DD
  status: 'paid' | 'upcoming'
}

/** Stats de paiement dérivées serveur (nominal contractuel). */
export interface LoanStats {
  paidCount: number
  paidToDate: number
  remainingToPay: number
  projectedEndMonth: string | null // YYYY-MM
}

export interface LoansResponse {
  loans: LoanRow[]
}

export interface LoanDetailResponse {
  loan: LoanRow
  amortization: AmortRow[]
  payments: PaymentRow[]
  stats: LoanStats
}

export function useLoans() {
  return useQuery({
    queryKey: ['loans'],
    queryFn: () => apiFetch<LoansResponse>('/api/loans'),
  })
}

export function useLoan(id: string) {
  return useQuery({
    queryKey: ['loans', id],
    queryFn: () => apiFetch<LoanDetailResponse>(`/api/loans/${id}`),
    enabled: !!id,
  })
}

/**
 * create/update/archive/unarchive/remove → invalident la liste/détail prêts ET le coach
 * (`coach-context` : les échéances de prêt comptent dans la marge) + le dashboard.
 */
export function useLoanMutations() {
  const qc = useQueryClient()
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['loans'] })
    void qc.invalidateQueries({ queryKey: ['coach-context'] })
    void qc.invalidateQueries({ queryKey: ['dashboard'] })
  }
  const create = useMutation({
    mutationFn: (data: LoanWritePayload) => apiMutate<{ loan: LoanRow }>('/api/loans', 'POST', data),
    onSuccess: invalidate,
  })
  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: LoanWritePayload }) =>
      apiMutate<{ loan: LoanRow }>(`/api/loans/${id}`, 'PATCH', data),
    onSuccess: invalidate,
  })
  const archive = useMutation({
    mutationFn: (id: string) => apiMutate<{ loan: LoanRow }>(`/api/loans/${id}/archive`, 'POST'),
    onSuccess: invalidate,
  })
  const unarchive = useMutation({
    mutationFn: (id: string) => apiMutate<{ loan: LoanRow }>(`/api/loans/${id}/unarchive`, 'POST'),
    onSuccess: invalidate,
  })
  const remove = useMutation({
    mutationFn: (id: string) => apiMutate<{ ok: true }>(`/api/loans/${id}`, 'DELETE'),
    onSuccess: invalidate,
  })
  return { create, update, archive, unarchive, remove }
}
