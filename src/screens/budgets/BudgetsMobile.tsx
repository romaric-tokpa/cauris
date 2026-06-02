import { Link } from 'react-router-dom'
import { Progress } from '../../components/primitives'
import { Card, Badge } from '../../components/ui'
import { EmptyState } from '../../components/states'
import { money } from '../../lib/money'
import type { BudgetRow, BudgetsSummary } from './useBudgets'
import { TABS_MOBILE, filterByTab } from './tabs'
import styles from './budgets.module.css'

interface Props {
  budgets: BudgetRow[]
  summary: BudgetsSummary
  tab: string
  setTab: (t: string) => void
  className?: string
}

/** Liste budgets mobile — portée 1:1 de BudgetMob (screens-budgets.jsx). Pas de
 *  Gauge (Progress uniquement), 3 chips (pas d'onglet Archivés). */
export function BudgetsMobile({ budgets, summary, tab, setTab, className = '' }: Props) {
  const visible = filterByTab(budgets, tab)

  return (
    <div className={className}>
      {/* chips */}
      <div className={`r ${styles.g7}`}>
        {TABS_MOBILE.map((t) => (
          <span
            key={t}
            className={`chip ${styles.chipSm}` + (tab === t ? ' on' : '')}
            role="button"
            aria-pressed={tab === t}
            tabIndex={0}
            onClick={() => setTab(t)}
            onKeyDown={(e) => e.key === 'Enter' && setTab(t)}
          >
            {t}
          </span>
        ))}
      </div>

      {/* summary */}
      <Card pad="pad-sm">
        <div className={`r between ${styles.summaryMobHead}`}>
          <span className={`t-faint ${styles.summaryLabel}`}>Dépensé ce mois</span>
          <Badge tone="warn">{summary.alertCount} en alerte</Badge>
        </div>
        <div className={`kpi-val ${styles.summaryMobVal}`}>
          {money(summary.totalSpent)} <span className="kpi-cur">/ {money(summary.totalCap)}</span>
        </div>
        <Progress pct={summary.pct} tone="warn" />
      </Card>

      {/* list */}
      {visible.length === 0 ? (
        <EmptyState
          icon="inbox"
          title="Aucun budget"
          text="Aucun budget ne correspond à ce filtre."
        />
      ) : (
        <div className={styles.list}>
          {visible.map((b) => (
            <Link to={`/budgets/${b.id}`} className="card-link-reset" key={b.id}>
              <Card pad="pad-sm">
                <div className={`r between ${styles.budHeadMob}`}>
                  <span className={styles.budNameMob}>{b.categoryName}</span>
                  <Badge tone={b.tone}>{b.pct}%</Badge>
                </div>
                <Progress pct={b.pct} tone={b.tone} />
                <div className={`t-mono t-faint ${styles.budMoneyMob}`}>
                  {money(b.spent)} / {money(b.cap)} FCFA
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
