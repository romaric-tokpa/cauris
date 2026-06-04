import { describe, it, expect } from 'vitest'
import { buildReportCsv, reportFilename, type ReportSection } from './exportReport'
import type { AnalyticsData } from '../screens/analytics/useAnalytics'

/** Donnée d'analyse minimale mais réaliste (entiers FCFA), pour un CSV déterministe. */
const DATA: AnalyticsData = {
  period: '2026-05',
  kpis: {
    depenses: 612000,
    revenus: 850000,
    epargne: 238000,
    savingsRate: 28,
    depensesDeltaPct: null,
    revenusDeltaPct: null,
    savingsRateDeltaPts: null,
  },
  averages: { revenusAvg: 0, depensesAvg: 0, epargneAvg: 0, savingsRateAvg: 0 },
  cashflow: [{ m: '2026-05', rev: 850000, dep: 612000, epa: 238000 }],
  breakdown: [
    { categoryId: 'c1', name: 'Alimentation', colorToken: 'cat-1', amount: 200000, v: 33, txnCount: 12 },
  ],
  budgets: {
    rows: [
      {
        categoryId: 'c1',
        categoryName: 'Alimentation',
        colorToken: 'cat-1',
        cap: 250000,
        spent: 200000,
        pct: 80,
        tone: 'ok',
        ecart: -50000,
        txnCount: 12,
      },
    ],
    totals: { cap: 250000, spent: 200000, ecart: -50000, tauxConso: 80 },
  },
}

const ALL: ReportSection[] = ['kpi', 'breakdown', 'trends', 'budget']

describe('buildReportCsv()', () => {
  it('écrit les montants en ENTIERS FCFA bruts (pas de séparateur de milliers)', () => {
    const csv = buildReportCsv(DATA, ['kpi'], 'fr')
    expect(csv).toContain('Dépenses,612000')
    expect(csv).toContain('Revenus,850000')
    // Surtout PAS de groupement (qui casserait le parsing) — ni fine ni normale.
    expect(csv).not.toContain(`612\u202f000`)
    expect(csv).not.toContain(`612\u0020000`)
  })

  it('ne contient QUE les sections cochées', () => {
    const onlyKpi = buildReportCsv(DATA, ['kpi'], 'fr')
    expect(onlyKpi).toContain('Synthèse & KPI')
    expect(onlyKpi).not.toContain('Répartition par catégorie')
    expect(onlyKpi).not.toContain('Budget vs réel')

    const full = buildReportCsv(DATA, ALL, 'fr')
    expect(full).toContain('Répartition par catégorie')
    expect(full).toContain('Tendances (6 mois)')
    expect(full).toContain('Budget vs réel')
  })

  it('traduit les en-têtes selon la langue', () => {
    const fr = buildReportCsv(DATA, ['kpi'], 'fr')
    const en = buildReportCsv(DATA, ['kpi'], 'en')
    expect(fr).toContain('Indicateur,Valeur')
    expect(en).toContain('Metric,Value')
    expect(en).toContain('Expenses,612000')
  })

  it('produit du contenu non vide pour chaque section réelle', () => {
    for (const s of ALL) {
      const csv = buildReportCsv(DATA, [s], 'fr')
      // En-tête rapport + bloc section → au moins 3 lignes utiles.
      expect(csv.split('\n').filter((l) => l.length > 0).length).toBeGreaterThanOrEqual(3)
    }
  })

  it('nomme le fichier par période', () => {
    expect(reportFilename('2026-05')).toBe('cauris-analytics-2026-05.csv')
  })
})
