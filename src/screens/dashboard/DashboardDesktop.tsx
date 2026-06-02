import { Link } from 'react-router-dom'
import { Icon, Donut, Bars, Progress } from '../../components/primitives'
import { Card, Badge, KpiTile } from '../../components/ui'
import { money } from '../../lib/money'
import { maskedBalance } from '../../lib/account'
import { formatIsoDay, formatIsoMonthLabel, prevMonthLong } from '../../lib/date'
import type { DashboardData } from './useDashboard'
import styles from './dashboard.module.css'

const catClass = (t: string | null): string => (t ? (styles[t.replace('-', '')] ?? '') : '')
const catVar = (t: string | null): string => (t ? `var(--${t})` : 'var(--line)')
const fmtPct = (n: number): string => String(n).replace('.', ',')

/** Dashboard desktop (cockpit pattern A) — porté 1:1 de dashboard-desktop-a.jsx,
 *  sans la chrome (sidebar/header) déjà fournie par l'AppShell. */
export function DashboardDesktop({
  d,
  greeting,
  className = '',
}: {
  d: DashboardData
  greeting: string
  className?: string
}) {
  const cashflow = d.cashflow.map((c) => ({ m: formatIsoMonthLabel(c.m), rev: c.rev, dep: c.dep }))
  const donutCats = [...d.breakdown]
    .slice(0, 4)
    .sort((a, b) => (a.colorToken ?? '').localeCompare(b.colorToken ?? ''))
  const soldeDelta =
    d.soldeDeltaPct != null
      ? { label: `+${fmtPct(d.soldeDeltaPct)} % vs ${prevMonthLong(d.month)}`, positive: d.soldeDeltaPct >= 0 } // prettier-ignore
      : undefined

  return (
    <div className={className}>
      {/* title row */}
      <div className="r between">
        <div>
          <div className="t-eyebrow">{formatIsoMonthLabel(d.month)} 2026</div>
          <div className={styles.greeting}>{greeting}</div>
        </div>
        <div className={`r ${styles.g10}`}>
          <button type="button" className="btn">
            <Icon name="filter" size={16} /> Filtres
          </button>
          <button type="button" className="btn primary">
            <Icon name="plus" size={16} /> Ajouter une transaction
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className={styles.kpiGrid}>
        <KpiTile label="Solde total" value={d.total} icon="wallet" delta={soldeDelta} />
        <KpiTile
          label="Revenus — mai"
          value={d.revenus ?? 0}
          icon="up"
          tone="pos"
          note="Mis à jour aujourd’hui"
        />
        <Link to="/transactions?type=Dépense" className="card-link-reset">
          <KpiTile
            label="Dépenses — mai"
            value={d.depenses ?? 0}
            icon="down"
            tone="neg"
            note="Mis à jour aujourd’hui"
          />
        </Link>
        <KpiTile
          label="Épargne du mois"
          value={d.epargne ?? 0}
          icon="target"
          note="Mis à jour aujourd’hui"
        />
      </div>

      {/* Insights IA — placeholder soigné (vraie IA = Phase 12) */}
      <Card>
        <div className="card-head">
          <div className={`r ${styles.g9}`}>
            <div className={`ai-av ${styles.aiAv}`}>C</div>
            <div className="card-title">Insights</div>
          </div>
          <Link to="/assistant-ia" className="card-link">
            Ouvrir l’assistant <Icon name="chevron" size={13} />
          </Link>
        </div>
        <div className={styles.insightsBody}>
          <div className={`row-ico ${styles.insightsIco}`}>
            <Icon name="bolt" size={16} />
          </div>
          <div className={styles.insightsText}>
            <span className={styles.insightsSoon}>Vos insights IA arrivent bientôt.</span> Analyses,
            anomalies et prévisions personnalisées apparaîtront ici.
          </div>
        </div>
      </Card>

      {/* cashflow + répartition */}
      <div className={styles.chartGrid}>
        <Card>
          <div className="card-head">
            <div>
              <div className="card-title">Flux de trésorerie</div>
              <div className={`t-faint ${styles.cardSub}`}>Revenus vs dépenses — 6 mois</div>
            </div>
            <div className={`r ${styles.g14} ${styles.legend}`}>
              <span className={`r ${styles.g6}`}>
                <i className={`${styles.legendSwatch} ${styles.swInk}`} /> Revenus
              </span>
              <span className={`r ${styles.g6}`}>
                <i className={`${styles.legendSwatch} ${styles.swLine}`} /> Dépenses
              </span>
            </div>
          </div>
          <Bars data={cashflow} height={170} />
        </Card>

        <Card>
          <div className="card-head">
            <div className="card-title">Répartition des dépenses</div>
          </div>
          <div className={`r ${styles.g18}`}>
            <Donut
              size={132}
              segments={donutCats.map((c) => ({ color: catVar(c.colorToken), v: c.v }))}
              label={`${Math.round((d.depenses ?? 0) / 1000)} k`}
              sub="ce mois"
            />
            <div className={`c ${styles.g9} ${styles.donutLegend}`}>
              {donutCats.map((s) => (
                <div className={`r between ${styles.legendRow}`} key={s.categoryId}>
                  <span className={`r ${styles.g8}`}>
                    <i className={`${styles.legendDot} ${catClass(s.colorToken)}`} /> {s.name}
                  </span>
                  <span className="t-mono t-muted">{s.v}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* budgets / objectifs / transactions */}
      <div className={styles.triGrid}>
        <Card>
          <div className="card-head">
            <div className="card-title">Budgets en alerte</div>
            <Link to="/budgets" className="card-link">
              Tout voir <Icon name="chevron" size={13} />
            </Link>
          </div>
          <div className={`c ${styles.g12}`}>
            {d.budgets.map((b) => (
              <Link to={`/budgets/${b.id}`} className="card-link-reset" key={b.id}>
                <div className={`r between ${styles.itemHead}`}>
                  <span className={styles.itemName}>{b.categoryName}</span>
                  <Badge tone={b.tone}>{b.pct}%</Badge>
                </div>
                <Progress pct={b.pct} tone={b.tone} />
                <div className={`t-faint t-mono ${styles.itemSub}`}>
                  {money(b.spent)} / {money(b.cap)} FCFA
                </div>
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <div className="card-head">
            <div className="card-title">Objectifs en cours</div>
            <Link to="/objectifs" className="card-link">
              Tout voir <Icon name="chevron" size={13} />
            </Link>
          </div>
          <div className={`c ${styles.g12}`}>
            {d.goals.map((o) => (
              <Link to={`/objectifs/${o.id}`} className="card-link-reset" key={o.id}>
                <div className={`r between ${styles.itemHead}`}>
                  <span className={styles.itemName}>{o.name}</span>
                  <span className={`t-mono t-muted ${styles.goalPct}`}>{o.pct}%</span>
                </div>
                <Progress pct={o.pct} tone="ok" />
                <div className={`t-faint t-mono ${styles.itemSub}`}>
                  {money(o.currentAmount)} / {money(o.targetAmount)} FCFA
                </div>
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <div className="card-head">
            <div className="card-title">Transactions récentes</div>
            <Link to="/transactions" className="card-link">
              Tout voir <Icon name="chevron" size={13} />
            </Link>
          </div>
          <div>
            {d.recentTransactions.map((t) => (
              <div className="row-line" key={t.id}>
                <div className="row-ico">
                  <Icon name={t.amount > 0 ? 'up' : 'down'} size={17} />
                </div>
                <div className={styles.txnText}>
                  <div className={styles.txnName}>{t.label}</div>
                  <div className={`t-faint ${styles.txnMeta}`}>
                    {t.categoryName} · {t.accountName}
                  </div>
                </div>
                <div className={`c ${styles.txnAmtCol}`}>
                  <span className={`row-amt${t.amount > 0 ? ' t-pos' : ''}`}>
                    {t.amount > 0 ? '+' : ''}
                    {money(t.amount)}
                  </span>
                  <span className={`t-faint ${styles.txnWhen}`}>{formatIsoDay(t.occurredAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* comptes + prêt */}
      <div className={styles.bottomGrid}>
        <Card>
          <div className="card-head">
            <div className="card-title">Mes comptes</div>
            <Link to="/comptes" className="card-link">
              Gérer <Icon name="chevron" size={13} />
            </Link>
          </div>
          <div className={styles.comptesGrid}>
            {d.accounts.map((c) => (
              <Link to={`/comptes/${c.id}`} className="card-link-reset" key={c.id}>
                <Card soft pad="pad-sm" className="r between">
                  <div className={`r ${styles.g10}`}>
                    <div className={`row-ico ${styles.compteIco}`}>
                      <Icon name="wallet" size={16} />
                    </div>
                    <div className={styles.compteText}>
                      <div className={styles.compteName}>{c.name}</div>
                      <div className={`t-faint ${styles.compteBank}`}>{c.bank}</div>
                    </div>
                  </div>
                  <div className={`t-mono ${styles.compteBal}`}>
                    {maskedBalance(c.balance, c.blocked)}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </Card>

        {d.loan && (
          <Link to="/pret" className="card-link-reset">
            <Card>
              <div className="card-head">
                <div className="card-title">Prêt auto</div>
                <Badge tone="warn">
                  Échéance {d.loan.nextDueDate ? formatIsoDay(d.loan.nextDueDate) : '—'}
                </Badge>
              </div>
              <div className={`r between ${styles.pretRow}`}>
                <div>
                  <div className={`t-faint ${styles.pretLabel}`}>Capital restant</div>
                  <div className={`kpi-val ${styles.pretVal}`}>
                    {money(d.loan.remaining)} <span className="kpi-cur">FCFA</span>
                  </div>
                </div>
                <div className={`c ${styles.pretRight}`}>
                  <div className={`t-faint ${styles.pretLabel}`}>Mensualité</div>
                  <div className={`t-mono ${styles.pretMens}`}>{money(d.loan.monthlyPayment)}</div>
                </div>
              </div>
              <Progress pct={d.loan.progress} tone="" />
              <div className={`r between t-faint ${styles.pretFoot}`}>
                <span>{d.loan.progress}% remboursé</span>
                <span className="card-link">
                  Simuler <Icon name="chevron" size={12} />
                </span>
              </div>
            </Card>
          </Link>
        )}
      </div>
    </div>
  )
}
