import { Icon } from '../../components/primitives'
import { Card } from '../../components/ui'
import { EmptyState } from '../../components/states'
import { money } from '../../lib/money'
import { formatIsoDay } from '../../lib/date'
import { FilterChip } from './parts'
import { txnIcon, accountLabel } from './helpers'
import type { TxnListResponse, TxnRow, AccountRef, CategoryRef } from './useTransactions'
import styles from './transactions.module.css'

const TABS = [
  { label: 'Tous', value: '' },
  { label: 'Revenus', value: 'Revenu' },
  { label: 'Dépenses', value: 'Dépense' },
  { label: 'Transferts', value: 'Transfert' },
  { label: 'Récurrentes', value: 'Récurrente' },
]

interface Props {
  data: TxnListResponse
  filters: Record<string, string>
  setFilter: (key: string, value: string) => void
  accounts: AccountRef[]
  categories: CategoryRef[]
  onAdd: () => void
  onRowClick: (row: TxnRow) => void
  className?: string
}

export function TxnDesktop({
  data,
  filters,
  setFilter,
  accounts,
  categories,
  onAdd,
  onRowClick,
  className = '',
}: Props) {
  const { transactions: rows, stats } = data
  const accountOpts = [{ value: '', label: 'Tous' }, ...accounts.map((a) => ({ value: a.id, label: a.name }))] // prettier-ignore
  const categoryOpts = [{ value: '', label: 'Toutes' }, ...categories.map((c) => ({ value: c.id, label: c.name }))] // prettier-ignore

  return (
    <div className={className}>
      {/* title row */}
      <div className="r between">
        <div>
          <div className="t-eyebrow">Mai 2026 · {stats.count} opérations</div>
          <div className={styles.pageTitle}>Transactions</div>
        </div>
        <button type="button" className="btn primary" onClick={onAdd}>
          <Icon name="plus" size={16} /> Ajouter une transaction
        </button>
      </div>

      {/* tabs */}
      <div className="subnav">
        {TABS.map((t) => (
          <span
            key={t.label}
            className={'si' + (filters.type === t.value ? ' on' : '')}
            role="button"
            aria-pressed={filters.type === t.value}
            tabIndex={0}
            onClick={() => setFilter('type', t.value)}
            onKeyDown={(e) => e.key === 'Enter' && setFilter('type', t.value)}
          >
            {t.label}
          </span>
        ))}
      </div>

      {/* filtres */}
      <div className={`r between wrap ${styles.filterStrip} ${styles.g12}`}>
        <div className={`r ${styles.g8}`}>
          <span className="chip on">
            <Icon name="calendar" size={14} /> Mai 2026
          </span>
          <FilterChip
            label="Compte"
            value={filters.accountId}
            options={accountOpts}
            onChange={(v) => setFilter('accountId', v)}
          />
          <FilterChip
            label="Catégorie"
            value={filters.categoryId}
            options={categoryOpts}
            onChange={(v) => setFilter('categoryId', v)}
          />
        </div>
        <div className={`field ${styles.searchField}`}>
          <Icon name="search" size={16} />
          <input
            value={filters.q}
            onChange={(e) => setFilter('q', e.target.value)}
            placeholder="Rechercher un libellé…"
            aria-label="Rechercher un libellé"
          />
        </div>
      </div>

      {/* stats */}
      <Card className={`r ${styles.statStrip}`}>
        <div className="stat">
          <div className="sl">Entrées</div>
          <div className="sv t-pos">+{money(stats.entrees)}</div>
        </div>
        <div className={`stat ${styles.statDivider}`}>
          <div className="sl">Sorties</div>
          <div className="sv t-neg">{money(stats.sorties)}</div>
        </div>
        <div className={`stat ${styles.statDivider}`}>
          <div className="sl">Solde net</div>
          <div className="sv">
            {stats.net >= 0 ? '+' : ''}
            {money(stats.net)} <span className="kpi-cur">FCFA</span>
          </div>
        </div>
      </Card>

      {/* table */}
      {rows.length === 0 ? (
        <EmptyState
          icon="inbox"
          title="Aucune transaction"
          text="Aucune opération ne correspond à ces filtres."
        />
      ) : (
        <Card pad={false} className={styles.txnTable}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Date</th>
                <th>Libellé</th>
                <th>Catégorie</th>
                <th>Compte</th>
                <th className="num">Montant</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id} className={styles.txnTr} onClick={() => onRowClick(t)}>
                  <td className={`t-faint t-mono ${styles.tdDate}`}>{formatIsoDay(t.occurredAt)}</td>
                  <td>
                    <div className={`r ${styles.g10}`}>
                      <div className={`row-ico ${styles.txnIco}`}>
                        <Icon name={txnIcon(t)} size={15} />
                      </div>
                      <span className={styles.txnName}>{t.label}</span>
                    </div>
                  </td>
                  <td>
                    <span className="tag-cat">{t.categoryName ?? '—'}</span>
                  </td>
                  <td className="t-muted">{accountLabel(t)}</td>
                  <td className={`num t-mono ${styles.tdAmount}${t.amount > 0 ? ' t-pos' : ''}`}>
                    {t.amount > 0 ? '+' : ''}
                    {money(t.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
