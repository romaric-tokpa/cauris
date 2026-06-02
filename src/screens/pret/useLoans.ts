import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../../lib/api'

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
  progress: number
}

/** Ligne d'échéancier (les champs DB en plus — userId/id/loanId — sont ignorés ici). */
export interface AmortRow {
  periodMonth: string // YYYY-MM
  principalPart: number
  interestPart: number
  remainingAfter: number
  sort: number
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
