import { Link } from 'react-router-dom'
import { Icon, Bars, Progress } from '../../components/primitives'
import { Card, Badge } from '../../components/ui'
import { money } from '../../lib/money'
import { formatIsoMonthLabel } from '../../lib/date'
import type { DashboardData } from './useDashboard'
import styles from './dashboard.module.css'

const fmtPct = (n: number): string => String(n).replace('.', ',')

/** Dashboard mobile — porté 1:1 de dashboard-mobile.jsx (variante A, barre basse).
 *  La chrome mobile (app bar, tab bar) est fournie par l'AppShell. */
export function DashboardMobile({ d, className = '' }: { d: DashboardData; className?: string }) {
  const cashflow = d.cashflow.map((c) => ({ m: formatIsoMonthLabel(c.m), rev: c.rev, dep: c.dep }))

  return (
    <div className={className}>
      {/* solde hero */}
      <Card className="feature-card">
        <div className={styles.heroLabel}>Solde total</div>
        <div className={`kpi-val ${styles.heroVal}`}>
          {money(d.total)} <span className={styles.heroCur}>FCFA</span>
        </div>
        {d.soldeDeltaPct != null && (
          <div className={`r ${styles.g8} ${styles.heroDelta}`}>
            <span className={`r ${styles.g3} ${styles.heroUp}`}>
              <Icon name="up" size={13} /> +{fmtPct(d.soldeDeltaPct)} %
            </span>
            <span className={styles.heroVs}>vs avril</span>
          </div>
        )}
      </Card>

      {/* mini kpis */}
      <div className={styles.miniGrid}>
        <Card pad="pad-sm">
          <div className={`kpi-icon pos ${styles.miniIco}`}>
            <Icon name="up" size={16} />
          </div>
          <div className={`t-faint ${styles.miniLabel}`}>Revenus</div>
          <div className={`kpi-val ${styles.miniVal}`}>{money(d.revenus ?? 0)}</div>
        </Card>
        <Link to="/transactions?type=Dépense" className="card-link-reset">
          <Card pad="pad-sm">
            <div className={`kpi-icon neg ${styles.miniIco}`}>
              <Icon name="down" size={16} />
            </div>
            <div className={`t-faint ${styles.miniLabel}`}>Dépenses</div>
            <div className={`kpi-val ${styles.miniVal}`}>{money(d.depenses ?? 0)}</div>
          </Card>
        </Link>
      </div>

      {/* trésorerie */}
      <Card pad="pad-sm">
        <div className={`card-head ${styles.cardHeadMb}`}>
          <div className={`card-title ${styles.cardTitleSm}`}>Trésorerie</div>
          <span className={`chip on ${styles.chipSm}`}>Mois</span>
        </div>
        <Bars data={cashflow} height={96} />
      </Card>

      {/* budgets en alerte */}
      <Card pad="pad-sm">
        <div className={`card-head ${styles.cardHeadMb}`}>
          <div className={`card-title ${styles.cardTitleSm}`}>Budgets en alerte</div>
          <Link to="/budgets" className={`card-link ${styles.linkSm}`}>
            Voir
          </Link>
        </div>
        <div className={`c ${styles.g11}`}>
          {d.budgets.slice(0, 2).map((b) => (
            <div key={b.id}>
              <div className={`r between ${styles.itemHeadSm}`}>
                <span className={styles.itemNameSm}>{b.categoryName}</span>
                <Badge tone={b.tone}>{b.pct}%</Badge>
              </div>
              <Progress pct={b.pct} tone={b.tone} />
            </div>
          ))}
        </div>
      </Card>

      {/* objectifs */}
      <Card pad="pad-sm">
        <div className={`card-head ${styles.cardHeadMb}`}>
          <div className={`card-title ${styles.cardTitleSm}`}>Objectifs</div>
          <Link to="/objectifs" className={`card-link ${styles.linkSm}`}>
            Voir
          </Link>
        </div>
        <div className={`c ${styles.g11}`}>
          {d.goals.slice(0, 2).map((o) => (
            <div key={o.id}>
              <div className={`r between ${styles.itemHeadSm}`}>
                <span className={styles.itemNameSm}>{o.name}</span>
                <span className={`t-mono t-faint ${styles.goalPctSm}`}>{o.pct}%</span>
              </div>
              <Progress pct={o.pct} tone="ok" />
            </div>
          ))}
        </div>
      </Card>

      {/* transactions */}
      <Card pad="pad-sm">
        <div className={`card-head ${styles.cardHeadMb4}`}>
          <div className={`card-title ${styles.cardTitleSm}`}>Récentes</div>
          <Link to="/transactions" className={`card-link ${styles.linkSm}`}>
            Tout
          </Link>
        </div>
        {d.recentTransactions.slice(0, 3).map((t) => (
          <div className={`row-line ${styles.rowLineSm}`} key={t.id}>
            <div className={`row-ico ${styles.rowIcoSm}`}>
              <Icon name={t.amount > 0 ? 'up' : 'down'} size={15} />
            </div>
            <div className={styles.txnTextSm}>
              <div className={styles.txnNameSm}>{t.label}</div>
              <div className={`t-faint ${styles.txnMetaSm}`}>{t.categoryName}</div>
            </div>
            <span className={`row-amt ${styles.rowAmtSm}${t.amount > 0 ? ' t-pos' : ''}`}>
              {t.amount > 0 ? '+' : ''}
              {money(t.amount)}
            </span>
          </div>
        ))}
      </Card>
    </div>
  )
}
