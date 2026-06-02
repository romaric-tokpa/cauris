import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Icon, Donut, SparkBars, Progress } from '../../components/primitives'
import { Card } from '../../components/ui'
import { money } from '../../lib/money'
import { formatIsoMonthLabel } from '../../lib/date'
import { MOBILE_TABS } from './tabs'
import type { AnalyticsData, BreakdownRow } from './useAnalytics'
import styles from './analytics.module.css'

const catVar = (t: string | null): string => (t ? `var(--${t})` : 'var(--line)')
const catClass = (t: string | null): string => (t ? (styles[t.replace('-', '')] ?? '') : '')
const fmtPct = (n: number): string => String(n).replace('.', ',')
const deltaLabel = (n: number, unit: string): string =>
  `${n >= 0 ? '+' : '−'}${fmtPct(Math.abs(n))} ${unit}`
const drillTo = (categoryId: string, period: string) =>
  `/transactions?categoryId=${categoryId}&from=${period}-01&to=${period}-31`

const donutSegments = (rows: BreakdownRow[]) =>
  [...rows].sort((a, b) => (a.colorToken ?? '').localeCompare(b.colorToken ?? ''))

interface Props {
  data: AnalyticsData
  tab: string
  setTab: (t: string) => void
  className?: string
}

/* Carte stat compacte avec delta optionnel. */
function StatCard({
  label,
  value,
  delta,
}: {
  label: string
  value: ReactNode
  delta?: { text: string; positive: boolean } | null
}) {
  return (
    <Card pad="pad-sm" className="stat">
      <div className="sl">{label}</div>
      <div className={`sv ${styles.statMobVal}`}>{value}</div>
      {delta && (
        <div className={`delta ${delta.positive ? 't-pos' : 't-neg'} ${styles.statMobDelta}`}>
          <Icon name={delta.positive ? 'up' : 'down'} size={12} /> {delta.text}
        </div>
      )}
    </Card>
  )
}

function OverviewMob({ data }: { data: AnalyticsData }) {
  const { kpis, breakdown, period } = data
  return (
    <>
      <div className={`r ${styles.statMobRow}`}>
        <StatCard
          label="Dépenses"
          value={<span className="t-mono">{money(kpis.depenses)}</span>}
          delta={
            kpis.depensesDeltaPct != null
              ? { text: deltaLabel(kpis.depensesDeltaPct, '%'), positive: kpis.depensesDeltaPct < 0 }
              : null
          }
        />
        <StatCard
          label="Épargne"
          value={<span className="t-mono">{kpis.savingsRate} %</span>}
          delta={
            kpis.savingsRateDeltaPts != null
              ? { text: deltaLabel(kpis.savingsRateDeltaPts, 'pt'), positive: kpis.savingsRateDeltaPts >= 0 }
              : null
          }
        />
      </div>

      <Card pad="pad-sm" className={`c ${styles.donutCardMob}`}>
        <div className={`card-head ${styles.donutHeadMob}`}>
          <div className="card-title">Répartition</div>
        </div>
        <Donut
          size={130}
          segments={donutSegments(breakdown.slice(0, 4)).map((c) => ({
            color: catVar(c.colorToken),
            v: c.v,
          }))}
          label={`${Math.round(kpis.depenses / 1000)} k`}
          sub="dépenses"
        />
      </Card>

      <Card pad="pad-sm">
        <div className={`card-title ${styles.mobListTitle}`}>Par catégorie</div>
        <div className={`c ${styles.mobList}`}>
          {breakdown.slice(0, 5).map((c) => (
            <Link to={drillTo(c.categoryId, period)} className="card-link-reset" key={c.categoryId}>
              <div className={`r between ${styles.mobListHead}`}>
                <span className={styles.mobCatName}>{c.name}</span>
                <span className="t-mono t-faint">{money(c.amount)}</span>
              </div>
              <Progress pct={c.v * 3.4} />
            </Link>
          ))}
        </div>
      </Card>
    </>
  )
}

function CategoriesMob({ data }: { data: AnalyticsData }) {
  const { breakdown, period, kpis } = data
  return (
    <>
      <Card pad="pad-sm" className={`c ${styles.donutCardMob}`}>
        <div className={`card-head ${styles.donutHeadMob}`}>
          <div className="card-title">Répartition</div>
        </div>
        <Donut
          size={150}
          segments={donutSegments(breakdown).map((c) => ({ color: catVar(c.colorToken), v: c.v }))}
          label={`${Math.round(kpis.depenses / 1000)} k`}
          sub="dépenses"
        />
      </Card>

      <Card pad="pad-sm">
        <div className={`card-title ${styles.mobListTitle}`}>Détail par catégorie</div>
        <div className={`c ${styles.mobList}`}>
          {breakdown.map((c) => (
            <Link to={drillTo(c.categoryId, period)} className="card-link-reset" key={c.categoryId}>
              <div className={`r between ${styles.mobListHead}`}>
                <span className={`r ${styles.g8}`}>
                  <i className={`${styles.dot} ${catClass(c.colorToken)}`} />
                  <span className={styles.mobCatName}>{c.name}</span>
                </span>
                <span className="t-mono t-faint">{money(c.amount)}</span>
              </div>
              <Progress pct={c.v * 3.4} />
              <div className={`r between t-faint ${styles.mobCatMeta}`}>
                <span>{c.txnCount} opér.</span>
                <span className="t-mono">{c.v}%</span>
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </>
  )
}

function TrendsMob({ data }: { data: AnalyticsData }) {
  const { averages, cashflow } = data
  const epaBars = cashflow.map((c) => ({ m: formatIsoMonthLabel(c.m), v: c.epa }))
  return (
    <>
      <div className={styles.statMobGrid}>
        <StatCard label="Revenu moyen" value={<span className="t-mono">{money(averages.revenusAvg)}</span>} />
        <StatCard label="Dépense moyenne" value={<span className="t-mono">{money(averages.depensesAvg)}</span>} />
        <StatCard label="Épargne moyenne" value={<span className="t-mono">{money(averages.epargneAvg)}</span>} />
        <StatCard label="Taux moyen" value={<span className="t-mono">{averages.savingsRateAvg} %</span>} />
      </div>

      <Card pad="pad-sm" className="c">
        <div className={`card-head ${styles.donutHeadMob}`}>
          <div className="card-title">Épargne mensuelle</div>
        </div>
        <SparkBars data={epaBars} height={150} />
      </Card>
    </>
  )
}

/** Écran Analytics mobile — 3 chips (Overview/Catégories/Tendances), porté du .jsx
 *  (pas de « Budget vs réel » sur mobile). Vues Catégories/Tendances : extrapolation
 *  sobre des mêmes données (sans tables denses). Onglets persistés URL. */
export function AnalyticsMobile({ data, tab, setTab, className = '' }: Props) {
  const active = (MOBILE_TABS as readonly string[]).includes(tab) ? tab : 'Overview'
  return (
    <div className={className}>
      <div className={`r ${styles.chipRowMob}`}>
        {MOBILE_TABS.map((t) => (
          <span
            key={t}
            className={`chip ${styles.chipMob}` + (active === t ? ' on' : '')}
            role="button"
            aria-pressed={active === t}
            tabIndex={0}
            onClick={() => setTab(t)}
            onKeyDown={(e) => e.key === 'Enter' && setTab(t)}
          >
            {t}
          </span>
        ))}
      </div>

      {active === 'Catégories' ? (
        <CategoriesMob data={data} />
      ) : active === 'Tendances' ? (
        <TrendsMob data={data} />
      ) : (
        <OverviewMob data={data} />
      )}
    </div>
  )
}
