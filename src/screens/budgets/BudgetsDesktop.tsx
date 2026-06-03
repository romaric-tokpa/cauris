import { Link } from 'react-router-dom'
import { Icon, Gauge, Progress } from '../../components/primitives'
import { Card, Badge } from '../../components/ui'
import { EmptyState } from '../../components/states'
import { money } from '../../lib/money'
import type { BudgetRow, BudgetsSummary } from './useBudgets'
import { BudgetArchived } from './BudgetArchived'
import { TABS_DESKTOP, STATUS, filterByTab } from './tabs'
import styles from './budgets.module.css'

interface Props {
  budgets: BudgetRow[]
  summary: BudgetsSummary
  tab: string
  setTab: (t: string) => void
  archived: BudgetRow[]
  onNew: () => void
  onReactivate: (id: string) => void
  className?: string
}

/** Liste budgets desktop — portée 1:1 de BudgetDesk (screens-budgets.jsx). */
export function BudgetsDesktop({
  budgets,
  summary,
  tab,
  setTab,
  archived,
  onNew,
  onReactivate,
  className = '',
}: Props) {
  const visible = filterByTab(budgets, tab)
  const isArchived = tab === 'Archivés'

  return (
    <div className={className}>
      {/* title row */}
      <div className="r between">
        <div>
          <div className="t-eyebrow">{isArchived ? 'Historique' : 'Mai 2026'}</div>
          <div className={styles.pageTitle}>Budgets</div>
        </div>
        <button type="button" className="btn primary" onClick={onNew}>
          <Icon name="plus" size={16} /> Créer un budget
        </button>
      </div>

      {/* tabs */}
      <div className="subnav">
        {TABS_DESKTOP.map((t) => (
          <span
            key={t}
            className={'si' + (tab === t ? ' on' : '')}
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

      {isArchived ? (
        <BudgetArchived budgets={archived} onReactivate={onReactivate} />
      ) : (
        <>
          {/* summary */}
          <Card>
            <div className={`r between ${styles.summaryTop}`}>
              <div>
                <div className={`t-faint ${styles.summaryLabel}`}>Dépensé ce mois</div>
                <div className={`kpi-val ${styles.summaryVal}`}>
                  {money(summary.totalSpent)}{' '}
                  <span className="kpi-cur">/ {money(summary.totalCap)} FCFA</span>
                </div>
              </div>
              <div className={`c ${styles.summaryAside}`}>
                <Badge tone="warn">{summary.alertCount} en alerte</Badge>
                <span className={`t-faint ${styles.reste}`}>
                  Reste {money(summary.restant)} FCFA
                </span>
              </div>
            </div>
            <Progress pct={summary.pct} tone="warn" />
          </Card>

          {/* grid */}
          {visible.length === 0 ? (
            <EmptyState
              icon="inbox"
              title="Aucun budget"
              text="Aucun budget ne correspond à ce filtre."
            />
          ) : (
            <div className={styles.grid}>
              {visible.map((b) => (
                <Link to={`/budgets/${b.id}`} className="card-link-reset" key={b.id}>
                  <Card>
                    <div className={`r between ${styles.budHead}`}>
                      <div className={`r ${styles.g10}`}>
                        <div className={`row-ico ${styles.budIco}`}>
                          <Icon name="gauge" size={17} />
                        </div>
                        <span className={styles.budName}>{b.categoryName}</span>
                      </div>
                      <Badge tone={b.tone}>{STATUS[b.tone]}</Badge>
                    </div>
                    <div className={styles.gaugeWrap}>
                      <Gauge pct={b.pct} tone={b.tone} size={158} />
                    </div>
                    <div className={`r between ${styles.budFoot}`}>
                      <span className={`t-mono t-muted ${styles.budMoney}`}>
                        {money(b.spent)} / {money(b.cap)}
                      </span>
                      <span className="card-link">
                        {b.txnCount} opér. <Icon name="chevron" size={13} />
                      </span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
