import { Link } from 'react-router-dom'
import { Icon, Donut, Progress } from '../../components/primitives'
import { Card } from '../../components/ui'
import { EmptyState } from '../../components/states'
import { money } from '../../lib/money'
import type { GoalRow } from './useObjectifs'
import { TABS_DESKTOP, filterByTab } from './tabs'
import styles from './objectifs.module.css'

interface Props {
  goals: GoalRow[]
  tab: string
  setTab: (t: string) => void
  className?: string
}

/**
 * Liste objectifs desktop — le wireframe n'a PAS de liste desktop (seulement le
 * détail `ObjDetailDesk` + la liste mobile `ObjMob`). Cette grille est une
 * EXTRAPOLATION sobre de la carte-objectif mobile (Donut + Progress + montant),
 * cohérente avec le pattern liste de Budgets. Onglets identiques au mobile + Archivés.
 */
export function ObjectifsDesktop({ goals, tab, setTab, className = '' }: Props) {
  const visible = filterByTab(goals, tab)

  return (
    <div className={className}>
      {/* title row */}
      <div className="r between">
        <div>
          <div className="t-eyebrow">Mai 2026</div>
          <div className={styles.pageTitle}>Objectifs</div>
        </div>
        {/* Création d'objectif = à venir (dette onboarding différée). */}
        <button type="button" className={`btn primary ${styles.soon}`} disabled title="Bientôt disponible">
          <Icon name="plus" size={16} /> Créer un objectif
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

      {/* grille */}
      {visible.length === 0 ? (
        <EmptyState
          icon="target"
          title={tab === 'Archivés' ? 'Aucun objectif archivé' : 'Aucun objectif'}
          text={
            tab === 'Archivés'
              ? 'Les objectifs archivés apparaîtront ici.'
              : 'Aucun objectif ne correspond à ce filtre.'
          }
        />
      ) : (
        <div className={styles.grid}>
          {visible.map((o) => (
            <Link to={`/objectifs/${o.id}`} className="card-link-reset" key={o.id}>
              <Card>
                <div className={`r between ${styles.cardHead}`}>
                  <span className={styles.goalName}>{o.name}</span>
                  <span className={`t-faint ${styles.statusText}`}>{o.status}</span>
                </div>
                <div className={styles.donutWrap}>
                  <Donut
                    size={120}
                    segments={[{ v: o.pct, color: 'var(--accent)' }]}
                    label={`${o.pct} %`}
                    sub="atteint"
                  />
                </div>
                <Progress pct={o.pct} tone="ok" />
                <div className={`r between ${styles.cardFoot}`}>
                  <span className={`t-mono t-muted ${styles.cardMoney}`}>
                    {money(o.currentAmount)} / {money(o.targetAmount)}
                  </span>
                  <span className="card-link">
                    Détail <Icon name="chevron" size={13} />
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
