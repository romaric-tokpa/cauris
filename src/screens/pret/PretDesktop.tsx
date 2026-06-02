import { useState } from 'react'
import { Icon, Progress } from '../../components/primitives'
import { Card, Badge } from '../../components/ui'
import { money } from '../../lib/money'
import { formatIsoDay, formatIsoMonthYear } from '../../lib/date'
import { rateLabel } from '../../lib/rate'
import { monthlyRate, scheduleStats } from '../../lib/loanSim'
import { TABS } from './tabs'
import { PretSimulator } from './PretSimulator'
import type { AmortRow, LoanDetailResponse, LoanRow, PaymentRow } from './useLoans'
import styles from './pret.module.css'

interface Props {
  data: LoanDetailResponse
  tab: string
  setTab: (t: string) => void
  className?: string
}

/** Libellé d'échéance : « 2026-06 » → « juin 2026 » (capitalisé via CSS). */
const moLabel = (periodMonth: string) => formatIsoMonthYear(periodMonth)
/** Date de paiement : « 2026-06-15 » → « 15 juin 2026 ». */
const payDate = (iso: string) => `${formatIsoDay(iso)} ${iso.slice(0, 4)}`

function AmortTable({ rows }: { rows: AmortRow[] }) {
  return (
    <table className="tbl">
      <thead>
        <tr>
          <th>Échéance</th>
          <th className="num">Capital</th>
          <th className="num">Intérêts</th>
          <th className="num">Mensualité</th>
          <th className="num">Capital restant</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((a) => (
          <tr key={a.periodMonth}>
            <td className={styles.moCell}>{moLabel(a.periodMonth)}</td>
            <td className="num t-mono">{money(a.principalPart)}</td>
            <td className="num t-mono t-muted">{money(a.interestPart)}</td>
            <td className="num t-mono">{money(a.principalPart + a.interestPart)}</td>
            <td className={`num t-mono ${styles.bold}`}>{money(a.remainingAfter)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/* ───────────────────────── Vue générale ───────────────────────── */
function Overview({ loan, stats, amortization, setTab }: {
  loan: LoanRow
  stats: LoanDetailResponse['stats']
  amortization: AmortRow[]
  setTab: (t: string) => void
}) {
  return (
    <>
      {/* hero capital restant */}
      <Card>
        <div className={`r between ${styles.heroHead}`}>
          <div>
            <div className={`t-faint ${styles.heroLabel}`}>Capital restant dû</div>
            <div className={`kpi-val ${styles.heroVal}`}>
              {money(loan.remaining)} <span className="kpi-cur">FCFA</span>
            </div>
          </div>
          <Badge tone="warn">
            Prochaine échéance {loan.nextDueDate ? formatIsoDay(loan.nextDueDate) : '—'}
          </Badge>
        </div>
        <Progress pct={loan.progress} tone="" />
        <div className={`r between t-faint ${styles.heroFoot}`}>
          <span>
            {loan.progress} % remboursé · {money(loan.principal - loan.remaining)} FCFA
          </span>
          <span>
            {loan.monthsRemaining} / {loan.termMonths} échéances restantes
          </span>
        </div>
      </Card>

      {/* stats */}
      <Card className={`r ${styles.statStrip}`}>
        <div className="stat">
          <div className="sl">Capital emprunté</div>
          <div className="sv">{money(loan.principal)}</div>
        </div>
        <div className={`stat ${styles.statDivider}`}>
          <div className="sl">Taux annuel</div>
          <div className="sv">
            <span className="t-mono">{rateLabel(loan.rateBps)}</span> %
          </div>
        </div>
        <div className={`stat ${styles.statDivider}`}>
          <div className="sl">Mensualité</div>
          <div className="sv">{money(loan.monthlyPayment)}</div>
        </div>
        <div className={`stat ${styles.statDivider}`}>
          <div className="sl">Fin prévue</div>
          <div className={`sv ${styles.moCell}`}>
            {stats.projectedEndMonth ? formatIsoMonthYear(stats.projectedEndMonth) : '—'}
          </div>
        </div>
      </Card>

      {/* conseil — statique (vraie IA = Phase 12), aucun chiffre en dur */}
      <Card pad="pad-sm" className={`r ${styles.g12}`}>
        <div className={`ai-av ${styles.aiAv}`}>C</div>
        <div className={styles.aiText}>
          <span className={`insight-tag ${styles.aiTag}`}>Conseil</span>
          Un remboursement anticipé réduit vos intérêts et raccourcit votre prêt. Lancez une
          simulation pour estimer précisément vos économies.
        </div>
        <button
          type="button"
          className={`card-link ${styles.nowrap} ${styles.linkBtn}`}
          onClick={() => setTab('Simulation')}
        >
          Simuler <Icon name="chevron" size={13} />
        </button>
      </Card>

      {/* aperçu amortissement */}
      <Card pad={false} className={styles.tableCard}>
        <div className={styles.tableHead}>
          <div className="card-head">
            <div className={`card-title ${styles.nowrap}`}>Tableau d'amortissement</div>
            <span className={`card-link ${styles.nowrap} ${styles.soon}`} title="Bientôt disponible">
              Télécharger (PDF) <Icon name="down" size={13} />
            </span>
          </div>
        </div>
        <AmortTable rows={amortization.slice(0, 6)} />
      </Card>
    </>
  )
}

/* ───────────────────────── Amortissement ───────────────────────── */
function Amortissement({ loan, amortization }: { loan: LoanRow; amortization: AmortRow[] }) {
  const years = [...new Set(amortization.map((a) => a.periodMonth.slice(0, 4)))]
  const [year, setYear] = useState<string | null>(years[0] ?? null)
  const rows = year ? amortization.filter((a) => a.periodMonth.startsWith(year)) : amortization

  // Intérêts restants = total exact du moteur (≠ nominal), cohérent avec le simulateur.
  const interestRemaining = scheduleStats(loan.remaining, loan.monthlyPayment, monthlyRate(loan.rateBps))

  return (
    <>
      <Card className={`r ${styles.statStrip}`}>
        <div className="stat">
          <div className="sl">Capital restant</div>
          <div className="sv">{money(loan.remaining)}</div>
        </div>
        <div className={`stat ${styles.statDivider}`}>
          <div className="sl">Intérêts restants</div>
          <div className="sv t-muted">{money(interestRemaining?.totalInterest ?? 0)}</div>
        </div>
        <div className={`stat ${styles.statDivider}`}>
          <div className="sl">Mensualité</div>
          <div className="sv">{money(loan.monthlyPayment)}</div>
        </div>
        <div className={`stat ${styles.statDivider}`}>
          <div className="sl">Échéances restantes</div>
          <div className="sv">
            {loan.monthsRemaining} / {loan.termMonths}
          </div>
        </div>
      </Card>

      <div className={`r ${styles.chipRow}`}>
        {years.map((y) => (
          <button
            key={y}
            type="button"
            className={`chip ${styles.chipBtn}` + (year === y ? ' on' : '')}
            onClick={() => setYear(y)}
          >
            {y}
          </button>
        ))}
        <button
          type="button"
          className={`chip ${styles.chipBtn} ${styles.chipEnd}` + (year === null ? ' on' : '')}
          onClick={() => setYear(null)}
        >
          <Icon name="filter" size={14} /> Toutes les échéances
        </button>
      </div>

      <Card pad={false} className={styles.tableCard}>
        <AmortTable rows={rows} />
      </Card>
    </>
  )
}

/* ───────────────────────── Paiements ───────────────────────── */
function Paiements({ loan, stats, payments }: {
  loan: LoanRow
  stats: LoanDetailResponse['stats']
  payments: PaymentRow[]
}) {
  return (
    <>
      <Card className={`r ${styles.statStrip}`}>
        <div className="stat">
          <div className="sl">Payé à ce jour</div>
          <div className="sv t-pos">{money(stats.paidToDate)}</div>
        </div>
        <div className={`stat ${styles.statDivider}`}>
          <div className="sl">Reste à payer</div>
          <div className="sv">{money(stats.remainingToPay)}</div>
        </div>
        <div className={`stat ${styles.statDivider}`}>
          <div className="sl">Échéances payées</div>
          <div className="sv">
            {stats.paidCount} / {loan.termMonths}
          </div>
        </div>
        <div className={`stat ${styles.statDivider}`}>
          <div className="sl">Paiement ponctuel</div>
          <div className="sv t-pos">100 %</div>
        </div>
      </Card>

      <div className="alert warn">
        <i className="swatch" />
        <div className={`row-ico ${styles.alertIco}`}>
          <Icon name="calendar" size={18} />
        </div>
        <div>
          <div className={styles.alertTitle}>
            Prochaine échéance : {loan.nextDueDate ? payDate(loan.nextDueDate) : '—'}
          </div>
          <div className={`t-muted ${styles.alertSub}`}>
            {money(loan.monthlyPayment)} FCFA seront prélevés sur le Compte courant.
          </div>
        </div>
        <button type="button" className={`btn ${styles.alertBtn} ${styles.soon}`} disabled title="Bientôt disponible">
          Payer en avance
        </button>
      </div>

      <Card pad={false} className={styles.tableCard}>
        <div className={styles.tableHead}>
          <div className="card-title">Paiements</div>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Échéance</th>
              <th>Date</th>
              <th>Compte</th>
              <th className="num">Montant</th>
              <th className="num">Statut</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.periodMonth}>
                <td className={styles.moCell}>{moLabel(p.periodMonth)}</td>
                <td className="t-muted t-mono">{payDate(p.dueDate)}</td>
                <td className="t-muted">Compte courant</td>
                <td className={`num t-mono ${styles.bold}`}>{money(p.amount)}</td>
                <td className="num">
                  <Badge tone={p.status === 'paid' ? 'ok' : 'warn'}>
                    {p.status === 'paid' ? 'Payé' : 'À venir'}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  )
}

/** Écran Prêt desktop — 4 onglets portés de screens-pret(.jsx)/screens-pret-tabs. */
export function PretDesktop({ data, tab, setTab, className = '' }: Props) {
  const { loan, amortization, payments, stats } = data
  return (
    <div className={className}>
      {/* header */}
      <div className="r between">
        <div>
          <div className="t-eyebrow">Prêt bancaire · NSIA Banque</div>
          <div className={styles.pageTitle}>{loan.name}</div>
        </div>
        <div className={`r ${styles.headActions}`}>
          <button type="button" className="btn" onClick={() => setTab('Paiements')}>
            <Icon name="exchange" size={16} /> Historique paiements
          </button>
          <button type="button" className="btn primary" onClick={() => setTab('Simulation')}>
            <Icon name="gauge" size={16} /> Simuler un remboursement
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

      {tab === 'Amortissement' ? (
        <Amortissement loan={loan} amortization={amortization} />
      ) : tab === 'Paiements' ? (
        <Paiements loan={loan} stats={stats} payments={payments} />
      ) : tab === 'Simulation' ? (
        <PretSimulator loan={loan} />
      ) : (
        <Overview loan={loan} stats={stats} amortization={amortization} setTab={setTab} />
      )}
    </div>
  )
}
