import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Icon, Donut, Bars, SparkBars, Progress } from '../../components/primitives'
import { Card, Badge } from '../../components/ui'
import { money } from '../../lib/money'
import { formatIsoMonthLabel, prevMonthLong } from '../../lib/date'
import { TABS } from './tabs'
import type {
  AnalyticsData,
  BreakdownRow,
  BudgetCompare,
  CashflowPoint,
} from './useAnalytics'
import styles from './analytics.module.css'

/* Couleur de catégorie : token → var(--cat-N) (donut) / classe CSS (pastille). */
const catVar = (t: string | null): string => (t ? `var(--${t})` : 'var(--line)')
const catClass = (t: string | null): string => (t ? (styles[t.replace('-', '')] ?? '') : '')
/* Pourcentage francophone (séparateur décimal virgule). */
const fmtPct = (n: number): string => String(n).replace('.', ',')
/* Lien de drill-down : catégorie → transactions du mois filtrées. */
const drillTo = (categoryId: string, period: string) =>
  `/transactions?categoryId=${categoryId}&from=${period}-01&to=${period}-31`

/** Libellé de delta signé (« +5,5 % », « −1,3 pt »). */
function deltaLabel(n: number, unit: string): string {
  const sign = n >= 0 ? '+' : '−'
  return `${sign}${fmtPct(Math.abs(n))} ${unit}`
}

/* ───────────────────────── KPI (label + valeur + delta) ───────────────────────── */
function KpiCard({
  label,
  value,
  delta,
}: {
  label: string
  value: ReactNode
  delta?: { text: string; positive: boolean } | null
}) {
  return (
    <Card>
      <div className="kpi-label">{label}</div>
      <div className={`kpi-val ${styles.kpiVal}`}>{value}</div>
      {delta && (
        <div className={`delta ${delta.positive ? 't-pos' : 't-neg'} ${styles.kpiDelta}`}>
          <Icon name={delta.positive ? 'up' : 'down'} size={13} /> {delta.text}
        </div>
      )}
    </Card>
  )
}

const moneyVal = (v: number) => (
  <>
    {money(v)} <span className="kpi-cur">FCFA</span>
  </>
)

/* ───────────────────────── Bars / légende revenus·dépenses ───────────────────────── */
function CashLegend() {
  return (
    <div className={`r ${styles.legend}`}>
      <span className={`r ${styles.g6}`}>
        <i className={`${styles.legendSwatch} ${styles.swInk}`} /> Revenus
      </span>
      <span className={`r ${styles.g6}`}>
        <i className={`${styles.legendSwatch} ${styles.swLine}`} /> Dépenses
      </span>
    </div>
  )
}

const toBars = (cashflow: CashflowPoint[]) =>
  cashflow.map((c) => ({ m: formatIsoMonthLabel(c.m), rev: c.rev, dep: c.dep }))

/* Donut top-N trié par token (ordre couleur stable, comme le dashboard). */
const donutSegments = (rows: BreakdownRow[]) =>
  [...rows].sort((a, b) => (a.colorToken ?? '').localeCompare(b.colorToken ?? ''))

/* ═══════════════════════════════ Overview ═══════════════════════════════ */
function OverviewPanel({ data }: { data: AnalyticsData }) {
  const { kpis, cashflow, breakdown, period } = data
  const prev = prevMonthLong(period)
  const top4 = breakdown.slice(0, 4)
  return (
    <>
      {/* KPI */}
      <div className={styles.kpiGrid3}>
        <KpiCard
          label="Dépenses totales"
          value={moneyVal(kpis.depenses)}
          delta={
            kpis.depensesDeltaPct != null
              ? { text: `${deltaLabel(kpis.depensesDeltaPct, '%')} vs ${prev}`, positive: kpis.depensesDeltaPct < 0 }
              : null
          }
        />
        <KpiCard
          label="Revenus totaux"
          value={moneyVal(kpis.revenus)}
          delta={
            kpis.revenusDeltaPct != null
              ? { text: `${deltaLabel(kpis.revenusDeltaPct, '%')} vs ${prev}`, positive: kpis.revenusDeltaPct >= 0 }
              : null
          }
        />
        <KpiCard
          label="Taux d'épargne"
          value={<span className="t-mono">{kpis.savingsRate} %</span>}
          delta={
            kpis.savingsRateDeltaPts != null
              ? { text: `${deltaLabel(kpis.savingsRateDeltaPts, 'pt')} vs ${prev}`, positive: kpis.savingsRateDeltaPts >= 0 }
              : null
          }
        />
      </div>

      {/* charts */}
      <div className={styles.chartGrid}>
        <Card>
          <div className="card-head">
            <div>
              <div className="card-title">Revenus vs dépenses</div>
              <div className={`t-faint ${styles.cardSub}`}>Tendance · 6 derniers mois</div>
            </div>
            <CashLegend />
          </div>
          <Bars data={toBars(cashflow)} height={180} />
        </Card>
        <Card>
          <div className="card-head">
            <div className="card-title">Répartition</div>
          </div>
          <div className={`c ${styles.donutWrap}`}>
            <Donut
              size={150}
              segments={donutSegments(top4).map((c) => ({ color: catVar(c.colorToken), v: c.v }))}
              label={`${Math.round(data.kpis.depenses / 1000)} k`}
              sub="dépenses"
            />
            <div className={`c ${styles.legendList}`}>
              {donutSegments(top4).map((s) => (
                <div className={`r between ${styles.legendRow}`} key={s.categoryId}>
                  <span className={`r ${styles.g8}`}>
                    <i className={`${styles.dot} ${catClass(s.colorToken)}`} /> {s.name}
                  </span>
                  <span className="t-mono t-muted">{s.v}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* categories table — drill */}
      <Card>
        <div className="card-head">
          <div className="card-title">Dépenses par catégorie</div>
          <span className={`t-faint ${styles.headHint}`}>
            Cliquez une catégorie → transactions filtrées
          </span>
        </div>
        <div className={`c ${styles.rowList}`}>
          {breakdown.map((c) => (
            <Link to={drillTo(c.categoryId, period)} className={`row-line ${styles.catRow}`} key={c.categoryId}>
              <span className={styles.catName}>{c.name}</span>
              <div className={styles.catBar}>
                <Progress pct={c.v * 3.4} />
              </div>
              <span className={`t-mono t-faint ${styles.catPct}`}>{c.v}%</span>
              <span className={`row-amt ${styles.catAmt}`}>{money(c.amount)}</span>
              <Icon name="chevron" size={15} className="t-faint" />
            </Link>
          ))}
        </div>
      </Card>
    </>
  )
}

/* ═══════════════════════════════ Catégories ═══════════════════════════════ */
function CategoriesPanel({ data }: { data: AnalyticsData }) {
  const { breakdown, period } = data
  return (
    <>
      <div className={`r ${styles.chipRow}`}>
        <span className="chip on">
          <Icon name="calendar" size={14} /> {formatIsoMonthLabel(period)} 2026
        </span>
        <span className={`chip ${styles.soon}`} title="Bientôt disponible">
          Toutes les dépenses <Icon name="chevron" size={13} />
        </span>
        <span className={`chip ${styles.soon}`} title="Bientôt disponible">
          Trier : montant <Icon name="chevron" size={13} />
        </span>
      </div>
      <div className={styles.catGrid}>
        <Card className={`c ${styles.donutWrap}`}>
          <div className={`card-head ${styles.donutHead}`}>
            <div className="card-title">Répartition</div>
          </div>
          <Donut
            size={188}
            segments={donutSegments(breakdown).map((c) => ({ color: catVar(c.colorToken), v: c.v }))}
            label={`${Math.round(data.kpis.depenses / 1000)} k`}
            sub="dépenses"
          />
          <div className={`c ${styles.legendList}`}>
            {donutSegments(breakdown).map((s) => (
              <div className={`r between ${styles.legendRow}`} key={s.categoryId}>
                <span className={`r ${styles.g8}`}>
                  <i className={`${styles.dot} ${catClass(s.colorToken)}`} /> {s.name}
                </span>
                <span className="t-mono t-muted">{s.v}%</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <div className="card-head">
            <div className="card-title">Détail par catégorie</div>
            <span className={`t-faint ${styles.headHint}`}>Cliquez → transactions filtrées</span>
          </div>
          <div className={`c ${styles.rowList}`}>
            {breakdown.map((c) => (
              <Link to={drillTo(c.categoryId, period)} className={`row-line ${styles.catRowDetail}`} key={c.categoryId}>
                <span className={`r ${styles.catNameWrap}`}>
                  <i className={`${styles.dot} ${catClass(c.colorToken)}`} />
                  <span className={styles.catNameStrong}>{c.name}</span>
                </span>
                <div className={styles.catBar}>
                  <Progress pct={c.v * 3.4} />
                </div>
                <span className={`t-mono t-faint ${styles.catPctSm}`}>{c.v}%</span>
                <span className={`t-faint ${styles.catCount}`}>{c.txnCount} opér.</span>
                <span className={`row-amt ${styles.catAmtSm}`}>{money(c.amount)}</span>
                <Icon name="chevron" size={15} className="t-faint" />
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </>
  )
}

/* ═══════════════════════════════ Tendances ═══════════════════════════════ */
function TrendsPanel({ data }: { data: AnalyticsData }) {
  const { averages, cashflow } = data
  const epaBars = cashflow.map((c) => ({ m: formatIsoMonthLabel(c.m), v: c.epa }))
  const rows = [...cashflow].reverse()
  return (
    <>
      {/* KPI moyennes — sans delta (non dérivable naturellement) */}
      <div className={styles.kpiGrid4}>
        <KpiCard label="Revenu moyen / mois" value={moneyVal(averages.revenusAvg)} />
        <KpiCard label="Dépense moyenne / mois" value={moneyVal(averages.depensesAvg)} />
        <KpiCard label="Épargne moyenne / mois" value={moneyVal(averages.epargneAvg)} />
        <KpiCard
          label="Taux d'épargne moyen"
          value={<span className="t-mono">{averages.savingsRateAvg} %</span>}
        />
      </div>

      <div className={styles.chartGrid}>
        <Card>
          <div className="card-head">
            <div className="card-title">Revenus vs dépenses</div>
            <CashLegend />
          </div>
          <Bars data={toBars(cashflow)} height={180} />
        </Card>
        <Card>
          <div className="card-head">
            <div className="card-title">Épargne mensuelle</div>
          </div>
          <SparkBars data={epaBars} height={180} />
        </Card>
      </div>

      <Card pad={false} className={styles.tableCard}>
        <div className={styles.tableHead}>
          <div className="card-title">Détail mensuel</div>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Mois</th>
              <th className="num">Revenus</th>
              <th className="num">Dépenses</th>
              <th className="num">Épargne</th>
              <th className="num">Taux</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.m}>
                <td className={styles.moCell}>
                  {formatIsoMonthLabel(t.m)} {t.m.slice(0, 4)}
                </td>
                <td className="num t-mono t-pos">+{money(t.rev)}</td>
                <td className="num t-mono">−{money(t.dep)}</td>
                <td className={`num t-mono ${styles.bold}`}>{money(t.epa)}</td>
                <td className="num t-mono t-muted">
                  {t.rev ? Math.round((t.epa / t.rev) * 100) : 0} %
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  )
}

/* ═══════════════════════════════ Budget vs réel ═══════════════════════════════ */
function BudgetPanel({ budgets }: { budgets: BudgetCompare }) {
  const { rows, totals } = budgets
  const globalPos = totals.ecart <= 0
  return (
    <>
      <Card>
        <div className={`r ${styles.budgetStats}`}>
          <div className="stat">
            <div className="sl">Prévu (tous budgets)</div>
            <div className="sv">{money(totals.cap)}</div>
          </div>
          <div className={`stat ${styles.statDivider}`}>
            <div className="sl">Réalisé</div>
            <div className="sv">{money(totals.spent)}</div>
          </div>
          <div className={`stat ${styles.statDivider}`}>
            <div className="sl">Écart global</div>
            <div className={`sv ${globalPos ? 't-pos' : 't-neg'}`}>
              {globalPos ? '−' : '+'}
              {money(Math.abs(totals.ecart))}
            </div>
          </div>
          <div className={`stat ${styles.statDivider}`}>
            <div className="sl">Taux de consommation</div>
            <div className="sv">{totals.tauxConso} %</div>
          </div>
        </div>
        <Progress pct={totals.tauxConso} tone="warn" />
      </Card>

      <Card pad={false} className={styles.tableCard}>
        <div className={styles.tableHead}>
          <div className="card-title">Comparaison par budget</div>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Catégorie</th>
              <th className="num">Prévu</th>
              <th className="num">Réalisé</th>
              <th className="num">Écart</th>
              <th className={styles.consoCol}>Consommation</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => {
              const over = b.ecart > 0
              return (
                <tr key={b.categoryId}>
                  <td className={styles.bold}>{b.categoryName}</td>
                  <td className="num t-mono t-muted">{money(b.cap)}</td>
                  <td className="num t-mono">{money(b.spent)}</td>
                  <td className={`num t-mono ${styles.bold} ${over ? 't-neg' : 't-pos'}`}>
                    {over ? '+' : '−'}
                    {money(Math.abs(b.ecart))}
                  </td>
                  <td>
                    <div className={`r ${styles.consoCell}`}>
                      <div className={styles.consoBar}>
                        <Progress pct={b.pct} tone={b.tone} />
                      </div>
                      <Badge tone={b.tone} className={styles.consoBadge}>
                        {b.pct}%
                      </Badge>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>
    </>
  )
}

interface Props {
  data: AnalyticsData
  tab: string
  setTab: (t: string) => void
  className?: string
}

/** Écran Analytics desktop — 4 onglets portés de screens-analytics(.jsx)/-tabs. */
export function AnalyticsDesktop({ data, tab, setTab, className = '' }: Props) {
  const eyebrow = tab === 'Tendances' ? '6 derniers mois' : `${formatIsoMonthLabel(data.period)} 2026`
  return (
    <div className={className}>
      {/* header */}
      <div className="r between">
        <div>
          <div className="t-eyebrow">{eyebrow}</div>
          <div className={styles.pageTitle}>Analytics</div>
        </div>
        <div className={`r ${styles.headActions}`}>
          <button type="button" className={`btn ${styles.soon}`} disabled title="Bientôt disponible">
            <Icon name="calendar" size={16} /> Période
          </button>
          <button
            type="button"
            className={`btn primary ${styles.soon}`}
            disabled
            title="Bientôt disponible"
          >
            <Icon name="down" size={16} /> Exporter le rapport
          </button>
        </div>
      </div>

      {/* subnav */}
      <div className="subnav">
        {TABS.map((t) => (
          <span
            key={t}
            className={'si' + (tab === t ? ' on' : '')}
            role="button"
            tabIndex={0}
            onClick={() => setTab(t)}
            onKeyDown={(e) => e.key === 'Enter' && setTab(t)}
          >
            {t}
          </span>
        ))}
      </div>

      {tab === 'Catégories' ? (
        <CategoriesPanel data={data} />
      ) : tab === 'Tendances' ? (
        <TrendsPanel data={data} />
      ) : tab === 'Budget vs réel' ? (
        <BudgetPanel budgets={data.budgets} />
      ) : (
        <OverviewPanel data={data} />
      )}
    </div>
  )
}
