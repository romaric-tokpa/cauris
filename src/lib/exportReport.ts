/**
 * Génération d'un rapport Analytics RÉEL côté client (CSV), à partir des données
 * déjà dérivées par l'API (`AnalyticsData`) — aucun appel réseau, aucun fichier vide.
 * Montants en ENTIERS FCFA bruts (machine-lisible : pas de ` ` qui casserait le
 * parsing). PDF/Excel ne sont pas générés ici (formats « Bientôt » dans le drawer).
 */
import type { AnalyticsData } from '../screens/analytics/useAnalytics'
import { formatIsoMonthLabel, formatMonthLong } from './date'

/** Clés des sections cochables (ordre = ordre d'apparition dans le wireframe). */
export type ReportSection = 'kpi' | 'breakdown' | 'trends' | 'budget'
export type ReportLang = 'fr' | 'en'

export const REPORT_SECTIONS: { key: ReportSection; fr: string; en: string }[] = [
  { key: 'kpi', fr: 'Synthèse & KPI', en: 'Summary & KPIs' },
  { key: 'breakdown', fr: 'Répartition par catégorie', en: 'Category breakdown' },
  { key: 'trends', fr: 'Tendances (6 mois)', en: 'Trends (6 months)' },
  { key: 'budget', fr: 'Budget vs réel', en: 'Budget vs actual' },
]

const sectionLabel = (key: ReportSection, l: ReportLang): string =>
  REPORT_SECTIONS.find((s) => s.key === key)?.[l] ?? key

/** Libellés FR/EN (en-têtes du CSV — pilotés par le sélecteur de langue). */
const L = {
  fr: {
    report: 'Rapport Analytics',
    section: 'Section',
    metric: 'Indicateur',
    value: 'Valeur',
    expenses: 'Dépenses',
    income: 'Revenus',
    savings: 'Épargne',
    savingsRate: "Taux d'épargne",
    category: 'Catégorie',
    amount: 'Montant',
    share: 'Part (%)',
    txns: 'Opérations',
    month: 'Mois',
    rate: 'Taux (%)',
    planned: 'Prévu',
    actual: 'Réalisé',
    gap: 'Écart',
    usage: 'Consommation (%)',
  },
  en: {
    report: 'Analytics report',
    section: 'Section',
    metric: 'Metric',
    value: 'Value',
    expenses: 'Expenses',
    income: 'Income',
    savings: 'Savings',
    savingsRate: 'Savings rate',
    category: 'Category',
    amount: 'Amount',
    share: 'Share (%)',
    txns: 'Transactions',
    month: 'Month',
    rate: 'Rate (%)',
    planned: 'Planned',
    actual: 'Actual',
    gap: 'Gap',
    usage: 'Usage (%)',
  },
} as const

/** Échappe un champ CSV (guillemets si virgule, guillemet ou saut de ligne). */
function cell(v: string | number): string {
  const s = String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

const row = (cells: (string | number)[]): string => cells.map(cell).join(',')

/**
 * Construit le CSV du rapport pour les sections retenues. Renvoie une chaîne
 * (testable sans DOM). Une ligne vide sépare chaque bloc de section.
 */
export function buildReportCsv(
  data: AnalyticsData,
  sections: ReportSection[],
  lang: ReportLang,
): string {
  const t = L[lang]
  const lines: string[] = [row([t.report, formatMonthLong(data.period)]), '']

  if (sections.includes('kpi')) {
    lines.push(
      row([t.section, sectionLabel('kpi', lang)]),
      row([t.metric, t.value]),
      row([t.expenses, data.kpis.depenses]),
      row([t.income, data.kpis.revenus]),
      row([t.savings, data.kpis.epargne]),
      row([t.savingsRate, `${data.kpis.savingsRate}%`]),
      '',
    )
  }

  if (sections.includes('breakdown')) {
    lines.push(row([t.section, sectionLabel('breakdown', lang)]), row([t.category, t.amount, t.share, t.txns]))
    for (const b of data.breakdown) lines.push(row([b.name, b.amount, `${b.v}%`, b.txnCount]))
    lines.push('')
  }

  if (sections.includes('trends')) {
    lines.push(row([t.section, sectionLabel('trends', lang)]), row([t.month, t.income, t.expenses, t.savings, t.rate]))
    for (const c of data.cashflow) {
      const rate = c.rev ? Math.round((c.epa / c.rev) * 100) : 0
      lines.push(row([`${formatIsoMonthLabel(c.m)} ${c.m.slice(0, 4)}`, c.rev, c.dep, c.epa, `${rate}%`]))
    }
    lines.push('')
  }

  if (sections.includes('budget')) {
    lines.push(row([t.section, sectionLabel('budget', lang)]), row([t.category, t.planned, t.actual, t.gap, t.usage]))
    for (const b of data.budgets.rows)
      lines.push(row([b.categoryName, b.cap, b.spent, b.ecart, `${b.pct}%`]))
    lines.push('')
  }

  return lines.join('\n')
}

/** Nom de fichier : `cauris-analytics-2026-05.csv`. */
export const reportFilename = (period: string): string => `cauris-analytics-${period}.csv`

/** Ligne minimale d'opération pour l'export « tout l'historique » (Import/Export). */
export interface ExportTxnRow {
  occurredAt: string
  label: string
  categoryName: string | null
  accountName: string | null
  amount: number // entier FCFA signé
  type: string
}

/** CSV de toutes les opérations (entiers FCFA bruts). En-têtes francophones. */
export function buildTransactionsCsv(rows: ExportTxnRow[]): string {
  const lines = [row(['Date', 'Libellé', 'Catégorie', 'Compte', 'Montant', 'Type'])]
  for (const t of rows)
    lines.push(row([t.occurredAt, t.label, t.categoryName ?? '', t.accountName ?? '', t.amount, t.type]))
  return lines.join('\n')
}

/** Déclenche le téléchargement réel du CSV (BOM UTF-8 pour Excel). */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
