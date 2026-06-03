import { Link } from 'react-router-dom'
import { Icon, Donut, Progress } from '../../components/primitives'
import { Card } from '../../components/ui'
import { EmptyState } from '../../components/states'
import { money } from '../../lib/money'
import type { GoalRow } from './useObjectifs'
import { TABS_MOBILE, filterByTab } from './tabs'
import styles from './objectifs.module.css'

interface Props {
  goals: GoalRow[]
  tab: string
  setTab: (t: string) => void
  onNew: () => void
  className?: string
}

/** Liste objectifs mobile — portée 1:1 de ObjMob (screens-objectifs.jsx). */
export function ObjectifsMobile({ goals, tab, setTab, onNew, className = '' }: Props) {
  const visible = filterByTab(goals, tab)

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

      {/* liste */}
      {visible.length === 0 ? (
        <EmptyState icon="target" title="Aucun objectif" text="Aucun objectif dans ce filtre." />
      ) : (
        <div className={styles.list}>
          {visible.map((o) => (
            <Link to={`/objectifs/${o.id}`} className="card-link-reset" key={o.id}>
              <Card pad="pad-sm" className={`r ${styles.mobCard}`}>
                <Donut
                  size={58}
                  hole={0.56}
                  segments={[{ v: o.pct, color: 'var(--accent)' }]}
                  label={`${o.pct}%`}
                />
                <div className={styles.mobRight}>
                  <div className={`r between ${styles.mobHead}`}>
                    <span className={styles.mobName}>{o.name}</span>
                    <Icon name="chevron" size={15} className="t-faint" />
                  </div>
                  <Progress pct={o.pct} tone="ok" />
                  <div className={`t-mono t-faint ${styles.mobMoney}`}>
                    {money(o.currentAmount)} / {money(o.targetAmount)} FCFA
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <button type="button" className="btn block" onClick={onNew}>
        <Icon name="plus" size={16} /> Nouvel objectif
      </button>
    </div>
  )
}
