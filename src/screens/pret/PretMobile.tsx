import { Icon, Progress } from '../../components/primitives'
import { Card } from '../../components/ui'
import { money } from '../../lib/money'
import { formatIsoDay, formatIsoMonthYear } from '../../lib/date'
import { rateLabel } from '../../lib/rate'
import { PretSimulator } from './PretSimulator'
import type { LoanDetailResponse } from './useLoans'
import styles from './pret.module.css'

interface Props {
  data: LoanDetailResponse
  tab: string
  setTab: (t: string) => void
  className?: string
}

/**
 * Écran Prêt mobile — porté de PretMob (vue condensée : hero, prochaine échéance,
 * pills, CTA simuler, aperçu amortissement). Le wireframe mobile n'a ni tableaux ni
 * simulateur ; le bouton « Simuler » ouvre le simulateur responsive (extrapolation sobre).
 */
export function PretMobile({ data, tab, setTab, className = '' }: Props) {
  const { loan, amortization } = data

  if (tab === 'Simulation') {
    return (
      <div className={className}>
        <button
          type="button"
          className={`card-link ${styles.backLink}`}
          onClick={() => setTab('Vue générale')}
        >
          <Icon name="chevron" size={13} className={styles.chevLeft} /> Vue générale
        </button>
        <PretSimulator loan={loan} />
      </div>
    )
  }

  return (
    <div className={className}>
      {/* hero capital restant */}
      <Card className="feature-card">
        <div className={styles.featLabel}>Capital restant dû</div>
        <div className={`kpi-val ${styles.featVal}`}>
          {money(loan.remaining)} <span className={styles.featCur}>FCFA</span>
        </div>
        <div className={styles.featProg}>
          <Progress pct={loan.progress} tone="" />
        </div>
        <div className={`r between ${styles.featFoot}`}>
          <span>{loan.progress} % remboursé</span>
          <span>
            {loan.monthsRemaining} / {loan.termMonths} échéances
          </span>
        </div>
      </Card>

      {/* prochaine échéance */}
      <div className={`alert warn ${styles.alertMob}`}>
        <i className="swatch" />
        <div className={`row-ico ${styles.alertIcoSm}`}>
          <Icon name="calendar" size={16} />
        </div>
        <div>
          <div className={styles.alertTitleSm}>
            Prochaine échéance {loan.nextDueDate ? formatIsoDay(loan.nextDueDate) : '—'}
          </div>
          <div className={`t-muted ${styles.alertSubSm}`}>{money(loan.monthlyPayment)} FCFA</div>
        </div>
      </div>

      {/* pills */}
      <div className={`r ${styles.pills}`}>
        <Card pad="pad-sm" className="stat">
          <div className="sl">Taux</div>
          <div className={`sv ${styles.pillVal}`}>
            <span className="t-mono">{rateLabel(loan.rateBps)}</span> %
          </div>
        </Card>
        <Card pad="pad-sm" className="stat">
          <div className="sl">Mensualité</div>
          <div className={`sv ${styles.pillVal}`}>{money(loan.monthlyPayment)}</div>
        </Card>
      </div>

      <button type="button" className={`btn primary block ${styles.simBtn}`} onClick={() => setTab('Simulation')}>
        <Icon name="gauge" size={16} /> Simuler un remboursement
      </button>

      {/* aperçu amortissement */}
      <Card pad="pad-sm">
        <div className={`card-title ${styles.amortMobTitle}`}>Amortissement à venir</div>
        {amortization.slice(0, 3).map((a) => (
          <div className={`row-line ${styles.amortMobRow}`} key={a.periodMonth}>
            <div className={styles.amortMobText}>
              <div className={styles.amortMobName}>{formatIsoMonthYear(a.periodMonth)}</div>
              <div className={`t-faint ${styles.amortMobMeta}`}>
                Capital {money(a.principalPart)} · Intérêts {money(a.interestPart)}
              </div>
            </div>
            <span className={`row-amt t-mono ${styles.amortMobAmt}`}>{money(a.remainingAfter)}</span>
          </div>
        ))}
      </Card>
    </div>
  )
}
