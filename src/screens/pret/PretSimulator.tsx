import { useState } from 'react'
import { Icon } from '../../components/primitives'
import { Card } from '../../components/ui'
import { money } from '../../lib/money'
import { monthlyRate, scheduleStats, simulate, type Keep, type SimType } from '../../lib/loanSim'
import type { LoanRow } from './useLoans'
import styles from './pret.module.css'

/** Parse une saisie groupée (« 500 000 ») en entier FCFA. */
const parseAmount = (s: string): number => Number(s.replace(/\D/g, '') || '0')

interface ImpactRow {
  label: string
  before: string
  after: string
}

/**
 * Simulateur de remboursement — VRAI calcul déterministe (src/lib/loanSim.ts), pas un
 * placeholder. Le « avant » dérive du moteur sur le prêt (cohérent) → 22 mois = Vue
 * générale. Deux types : remboursement anticipé (conserver durée/mensualité) ou mensualité
 * ajustée. Garde-fou si la mensualité ne couvre pas les intérêts.
 *
 * Layout porté de PretSimDesk (2 colonnes desktop → empilé en mobile via CSS).
 * Champs « à partir de » (date) = à venir ; le reste est interactif.
 */
export function PretSimulator({ loan }: { loan: LoanRow }) {
  const [type, setType] = useState<SimType>('anticipe')
  const [lump, setLump] = useState(500000)
  // Défaut : conserver la mensualité → la DURÉE bouge (les 3 lignes d'impact s'améliorent,
  // comme la maquette pret-sim.png ; celle-ci surlignait « La durée » mais montrait des
  // chiffres de durée raccourcie — incohérent. On privilégie la cohérence du calcul).
  const [keep, setKeep] = useState<Keep>('mensualite')
  const [newMonthly, setNewMonthly] = useState(loan.monthlyPayment + 40000)

  const i = monthlyRate(loan.rateBps)
  const base = scheduleStats(loan.remaining, loan.monthlyPayment, i)
  const sim = simulate({
    remaining: loan.remaining,
    rateBps: loan.rateBps,
    monthlyPayment: loan.monthlyPayment,
    type,
    lumpSum: lump,
    keep,
    newMonthly,
  })

  const recalcNote =
    type === 'anticipe' && keep === 'duree'
      ? { label: 'Mensualité recalculée', value: sim ? `${money(sim.newMonthly)} FCFA` : '—' }
      : { label: 'Nouvelle durée', value: sim ? `${sim.after.months} mois` : '—' }

  const impact: ImpactRow[] | null =
    sim && base
      ? [
          {
            label: 'Durée restante',
            before: `${base.months} mois`,
            after: `${sim.after.months} mois`,
          },
          {
            label: 'Intérêts restants à payer',
            before: `${money(base.totalInterest)} FCFA`,
            after: `${money(sim.after.totalInterest)} FCFA`,
          },
          {
            label: 'Coût total restant',
            before: `${money(base.totalPaid)} FCFA`,
            after: `${money(sim.costAfter)} FCFA`,
          },
        ]
      : null

  return (
    <div className={styles.simGrid}>
      {/* ── Paramètres ── */}
      <Card className={`c ${styles.simCtrls}`}>
        <div className="card-title">Paramètres du scénario</div>

        <div>
          <span className="lbl">Type de simulation</span>
          <div className="seg-full" role="group" aria-label="Type de simulation">
            <button
              type="button"
              className={type === 'anticipe' ? 'on' : ''}
              aria-pressed={type === 'anticipe'}
              onClick={() => setType('anticipe')}
            >
              Remboursement anticipé
            </button>
            <button
              type="button"
              className={type === 'mensualite' ? 'on' : ''}
              aria-pressed={type === 'mensualite'}
              onClick={() => setType('mensualite')}
            >
              Mensualité ajustée
            </button>
          </div>
        </div>

        {type === 'anticipe' ? (
          <>
            <div>
              <span className="lbl">Montant remboursé par anticipation</span>
              <div className="inp big">
                <input
                  inputMode="numeric"
                  aria-label="Montant remboursé par anticipation"
                  value={money(lump)}
                  onChange={(e) => setLump(Math.min(parseAmount(e.target.value), loan.remaining))}
                />
                <span className="kpi-cur">FCFA</span>
              </div>
            </div>
            {/* Date de départ = à venir (le calcul applique le remboursement immédiatement). */}
            <div>
              <span className="lbl">À partir de</span>
              <div className={`inp ${styles.soon}`} title="Bientôt disponible">
                <span>Juillet 2026</span>
                <Icon name="calendar" size={15} className="t-faint" />
              </div>
            </div>
            <div>
              <span className="lbl">Conserver</span>
              <div className="seg-full" role="group" aria-label="Conserver">
                <button
                  type="button"
                  className={keep === 'duree' ? 'on' : ''}
                  aria-pressed={keep === 'duree'}
                  onClick={() => setKeep('duree')}
                >
                  La durée
                </button>
                <button
                  type="button"
                  className={keep === 'mensualite' ? 'on' : ''}
                  aria-pressed={keep === 'mensualite'}
                  onClick={() => setKeep('mensualite')}
                >
                  La mensualité
                </button>
              </div>
            </div>
          </>
        ) : (
          <div>
            <span className="lbl">Nouvelle mensualité</span>
            <div className="inp big">
              <input
                inputMode="numeric"
                aria-label="Nouvelle mensualité"
                value={money(newMonthly)}
                onChange={(e) => setNewMonthly(parseAmount(e.target.value))}
              />
              <span className="kpi-cur">FCFA</span>
            </div>
          </div>
        )}

        <Card soft pad="pad-sm" className="r between">
          <span className="wf-note">
            <Icon name="bolt" size={14} /> {recalcNote.label}
          </span>
          <span className={`t-mono ${styles.recalcVal}`}>{recalcNote.value}</span>
        </Card>
      </Card>

      {/* ── Impact ── */}
      <div className={`c ${styles.simImpact}`}>
        {impact && sim ? (
          <>
            <Card>
              <div className={`card-title ${styles.impactTitle}`}>Impact du scénario</div>
              <div className={`c ${styles.impactList}`}>
                {impact.map((r) => (
                  <div key={r.label}>
                    <div className={`t-faint ${styles.impactLabel}`}>{r.label}</div>
                    <div className={`r ${styles.impactRow}`}>
                      <span className={`t-mono t-faint ${styles.impactBefore}`}>{r.before}</span>
                      <Icon name="arrowR" size={16} className="t-faint" />
                      <span className={`t-mono t-pos ${styles.impactAfter}`}>{r.after}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            <Card className={`r between ${styles.savings}`}>
              <div>
                <div className={`t-pos ${styles.savingsVal}`}>
                  Vous économisez {money(sim.interestSaved)} FCFA
                </div>
                <div className={`t-muted ${styles.savingsSub}`}>
                  d'intérêts{sim.monthsSaved > 0 ? ` · et ${sim.monthsSaved} mois plus tôt.` : '.'}
                </div>
              </div>
              <div className={`row-ico ${styles.savingsIco}`}>
                <Icon name="up" size={20} />
              </div>
            </Card>
          </>
        ) : (
          <Card className={`r ${styles.guard}`}>
            <div className={`row-ico ${styles.guardIco}`}>
              <Icon name="alert" size={18} />
            </div>
            <div>
              <div className={styles.guardTitle}>Mensualité insuffisante</div>
              <div className={`t-muted ${styles.guardSub}`}>
                Elle ne couvre pas les intérêts du mois : le capital ne diminue jamais. Augmentez la
                mensualité.
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
