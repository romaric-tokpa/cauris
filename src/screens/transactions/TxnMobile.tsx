import { Icon } from '../../components/primitives'
import { Card } from '../../components/ui'
import { EmptyState } from '../../components/states'
import { money } from '../../lib/money'
import { formatIsoDay } from '../../lib/date'
import { txnIcon, accountLabel } from './helpers'
import type { TxnListResponse, TxnRow } from './useTransactions'
import styles from './transactions.module.css'

const TABS = [
  { label: 'Tous', value: '' },
  { label: 'Revenus', value: 'Revenu' },
  { label: 'Dépenses', value: 'Dépense' },
  { label: 'Transferts', value: 'Transfert' },
  { label: 'Récurrentes', value: 'Récurrente' },
]

function Row({ t, onClick }: { t: TxnRow; onClick: () => void }) {
  return (
    <div
      className={`row-line ${styles.mobRow}`}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      <div className={`row-ico ${styles.mobRowIco}`}>
        <Icon name={txnIcon(t)} size={16} />
      </div>
      <div className={styles.mobRowText}>
        <div className={styles.mobRowName}>{t.label}</div>
        <div className={`t-faint ${styles.mobRowSub}`}>
          {t.categoryName ?? '—'} · {accountLabel(t)}
        </div>
      </div>
      <span className={`row-amt ${styles.mobRowAmt}${t.amount > 0 ? ' t-pos' : ''}`}>
        {t.amount > 0 ? '+' : ''}
        {money(t.amount)}
      </span>
    </div>
  )
}

interface Props {
  data: TxnListResponse
  filters: Record<string, string>
  setFilter: (key: string, value: string) => void
  onRowClick: (row: TxnRow) => void
  className?: string
}

export function TxnMobile({ data, filters, setFilter, onRowClick, className = '' }: Props) {
  const { transactions: rows, stats } = data

  // Groupes par date (chronologique décroissant déjà fourni par l'API).
  const groups: { date: string; rows: TxnRow[] }[] = []
  for (const r of rows) {
    const last = groups[groups.length - 1]
    if (last && last.date === r.occurredAt) last.rows.push(r)
    else groups.push({ date: r.occurredAt, rows: [r] })
  }

  return (
    <div className={className}>
      {/* tabs */}
      <div className={`r ${styles.mobChips} ${styles.g7}`}>
        {TABS.map((t) => (
          <span
            key={t.label}
            className={'chip ' + styles.mobChip + (filters.type === t.value ? ' on' : '')}
            role="button"
            tabIndex={0}
            onClick={() => setFilter('type', t.value)}
            onKeyDown={(e) => e.key === 'Enter' && setFilter('type', t.value)}
          >
            {t.label}
          </span>
        ))}
      </div>

      {/* stats */}
      <div className={`r ${styles.g12}`}>
        <Card pad="pad-sm" className="stat">
          <div className="sl">Entrées</div>
          <div className={`sv t-pos ${styles.mobStatVal}`}>+{money(stats.entrees)}</div>
        </Card>
        <Card pad="pad-sm" className="stat">
          <div className="sl">Sorties</div>
          <div className={`sv t-neg ${styles.mobStatVal}`}>{money(stats.sorties)}</div>
        </Card>
      </div>

      {/* liste groupée */}
      {rows.length === 0 ? (
        <EmptyState
          icon="inbox"
          title="Aucune transaction"
          text="Aucune opération ne correspond à ces filtres."
        />
      ) : (
        <Card pad="pad-sm">
          {groups.map((g, i) => (
            <div key={g.date}>
              <div className={`t-eyebrow ${i === 0 ? styles.groupHead : styles.groupHeadLater}`}>
                {formatIsoDay(g.date)}
              </div>
              {g.rows.map((t) => (
                <Row key={t.id} t={t} onClick={() => onRowClick(t)} />
              ))}
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}
