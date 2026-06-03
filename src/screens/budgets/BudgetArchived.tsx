import { Icon } from '../../components/primitives'
import { Card, Badge } from '../../components/ui'
import { EmptyState } from '../../components/states'
import { money } from '../../lib/money'
import { formatIsoMonthYear } from '../../lib/date'
import type { BudgetRow } from './useBudgets'
import styles from './budgets.module.css'

/** Table des budgets archivés (mois clôturés) — portée 1:1 de BudgetArchivedDesk.
 *  « Réactiver » = désarchivage réel (POST /unarchive). */
export function BudgetArchived({
  budgets,
  onReactivate,
  className = '',
}: {
  budgets: BudgetRow[]
  onReactivate: (id: string) => void
  className?: string
}) {
  if (budgets.length === 0) {
    return (
      <div className={className}>
        <EmptyState
          icon="inbox"
          title="Aucun budget archivé"
          text="Les budgets que vous archivez apparaîtront ici."
        />
      </div>
    )
  }
  return (
    <div className={className}>
      <Card pad={false} className={styles.archTable}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Budget</th>
              <th>Période</th>
              <th className="num">Plafond</th>
              <th className="num">Réalisé</th>
              <th className="num">Résultat</th>
              <th className={styles.archActionsCol} />
            </tr>
          </thead>
          <tbody>
            {budgets.map((b) => {
              const over = b.spent > b.cap
              return (
                <tr key={b.id}>
                  <td className={styles.archName}>{b.categoryName}</td>
                  <td className="t-muted t-mono">{formatIsoMonthYear(`${b.period}-01`)}</td>
                  <td className="num t-mono t-muted">{money(b.cap)}</td>
                  <td className="num t-mono">{money(b.spent)}</td>
                  <td className="num">
                    {over ? <Badge tone="over">Dépassé</Badge> : <Badge tone="ok">Tenu</Badge>}
                  </td>
                  <td className="num">
                    <button
                      type="button"
                      className={`card-link ${styles.linkBtn}`}
                      onClick={() => onReactivate(b.id)}
                    >
                      Réactiver <Icon name="repeat" size={13} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
