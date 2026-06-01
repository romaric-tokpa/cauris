import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../../lib/api'

/** Forme du payload renvoyé par `GET /api/dashboard` (composite scopé). */
export interface DashboardData {
  month: string
  total: number
  revenus: number | null
  depenses: number | null
  epargne: number | null
  soldeDeltaPct: number | null
  cashflow: { m: string; rev: number; dep: number }[]
  breakdown: {
    categoryId: string
    name: string
    colorToken: string | null
    amount: number
    v: number
    trendPct: number
  }[]
  accounts: {
    id: string
    name: string
    bank: string
    type: string
    accountNumber: string
    balance: number
    blocked: boolean
  }[]
  budgets: {
    id: string
    categoryId: string
    categoryName: string
    colorToken: string | null
    cap: number
    spent: number
    txnCount: number
    period: string
    pct: number
    tone: 'over' | 'warn' | 'ok'
  }[]
  goals: { id: string; name: string; currentAmount: number; targetAmount: number; pct: number }[]
  recentTransactions: {
    id: string
    label: string
    amount: number
    occurredAt: string
    type: string
    accountName: string
    categoryName: string
  }[]
  notifications: {
    id: string
    title: string
    body: string
    tone: string | null
    icon: string
    read: boolean
  }[]
  loan: {
    id: string
    name: string
    remaining: number
    principal: number
    monthlyPayment: number
    rateBps: number
    nextDueDate: string | null
    progress: number
  } | null
}

export function useDashboard(month?: string) {
  return useQuery({
    queryKey: ['dashboard', month ?? 'current'],
    queryFn: () => apiFetch<DashboardData>(`/api/dashboard${month ? `?month=${month}` : ''}`),
  })
}
