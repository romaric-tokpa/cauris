import { Icon } from '../../components/primitives'
import { Card, Badge } from '../../components/ui'
import { EmptyState } from '../../components/states'
import { money } from '../../lib/money'
import { formatIsoDay } from '../../lib/date'
import { TxnSubnav, TxnChips } from './parts'
import type { RecurrenceRow } from './useRecurrences'
import styles from './transactions.module.css'

/** `monthly` → `Mensuel` (seule fréquence livrée). */
function freqLabel(f: string): string {
  return f === 'monthly' ? 'Mensuel' : f
}

interface Props {
  data: RecurrenceRow[]
  filters: Record<string, string>
  setFilter: (key: string, value: string) => void
  onNew: () => void
  onEdit: (r: RecurrenceRow) => void
  className?: string
}

const EMPTY_TEXT = 'Aucune charge récurrente pour le moment. Créez-en une ou laissez l’IA les détecter.'

/** Carte « Détection automatique » — texte fixe du wireframe (TxnRecurringDesk). */
function DetectionCard() {
  return (
    <Card soft className={`r ${styles.detectCard}`}>
      <span className={`row-ico ${styles.detectIco}`}>
        <Icon name="repeat" size={18} />
      </span>
      <div>
        <div className={styles.detectTitle}>Détection automatique</div>
        <div className={`t-muted ${styles.detectText}`}>
          L’IA repère les paiements qui reviennent (Canal+, Spotify…) et propose de les marquer comme
          récurrents. Vous confirmez.
        </div>
      </div>
    </Card>
  )
}

function StatusBadge({ known }: { known: boolean }) {
  return known ? <Badge tone="ok">Confirmée</Badge> : <Badge tone="warn">À confirmer</Badge>
}

export function RecurrencesDesktop({ data, filters, setFilter, onNew, onEdit, className = '' }: Props) {
  const total = data.reduce((s, r) => s + Math.abs(r.amount), 0)
  const detected = data.filter((r) => !r.known).length

  return (
    <div className={className}>
      <div className="r between">
        <div>
          <div className="t-eyebrow">Mai 2026</div>
          <div className={styles.pageTitle}>Transactions</div>
        </div>
        <button type="button" className="btn primary" onClick={onNew}>
          <Icon name="plus" size={16} /> Nouvelle récurrence
        </button>
      </div>

      <TxnSubnav active={filters.type} onSelect={(v) => setFilter('type', v)} />

      <Card className="r between">
        <div>
          <div className={`t-faint ${styles.recHeadLabel}`}>Charges récurrentes mensuelles</div>
          <div className={`kpi-val ${styles.recTotal}`}>
            {money(total)} <span className="kpi-cur">FCFA / mois</span>
          </div>
        </div>
        <div className={`c ${styles.recHeadRight}`}>
          <span className={styles.recPill}>{data.length} actives</span>
          <span className={`t-faint ${styles.recDetected}`}>{detected} détectées par l’IA</span>
        </div>
      </Card>

      {data.length === 0 ? (
        <EmptyState icon="repeat" title="Aucune récurrence" text={EMPTY_TEXT} />
      ) : (
        <Card pad={false} className={styles.recTable}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Libellé</th>
                <th>Fréquence</th>
                <th>Prochaine</th>
                <th className="num">Montant</th>
                <th className="num">Statut</th>
                <th className={styles.recActionsCol} />
              </tr>
            </thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.id}>
                  <td className={styles.recName}>{r.name}</td>
                  <td className="t-muted">{freqLabel(r.frequency)}</td>
                  <td className="t-muted t-mono">{formatIsoDay(r.nextDate)}</td>
                  <td className="num t-mono t-neg">{money(r.amount)}</td>
                  <td className="num">
                    <StatusBadge known={r.known} />
                  </td>
                  <td className="num">
                    <div className={styles.recActions}>
                      {/* Pause = à venir (aucune colonne `paused`) → désactivé honnête. */}
                      <button
                        type="button"
                        className={`icon-btn ${styles.recIconBtn} ${styles.soon}`}
                        disabled
                        title="Bientôt disponible"
                        aria-label="Mettre en pause"
                      >
                        <Icon name="pause" size={14} />
                      </button>
                      <button
                        type="button"
                        className={`icon-btn ${styles.recIconBtn}`}
                        onClick={() => onEdit(r)}
                        aria-label={`Modifier ${r.name}`}
                      >
                        <Icon name="edit" size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <DetectionCard />
    </div>
  )
}

export function RecurrencesMobile({ data, filters, setFilter, onNew, onEdit, className = '' }: Props) {
  const total = data.reduce((s, r) => s + Math.abs(r.amount), 0)

  return (
    <div className={className}>
      <TxnChips active={filters.type} onSelect={(v) => setFilter('type', v)} />

      <button type="button" className={`btn primary block ${styles.recMobNew}`} onClick={onNew}>
        <Icon name="plus" size={16} /> Nouvelle récurrence
      </button>

      <Card pad="pad-sm" className="r between">
        <div>
          <div className={`t-faint ${styles.recHeadLabel}`}>Charges mensuelles</div>
          <div className={`kpi-val ${styles.recMobTotal}`}>{money(total)}</div>
        </div>
        <span className={styles.recPill}>{data.length} actives</span>
      </Card>

      {data.length === 0 ? (
        <EmptyState icon="repeat" title="Aucune récurrence" text={EMPTY_TEXT} />
      ) : (
        <Card pad="pad-sm">
          {data.map((r) => (
            <div
              key={r.id}
              className={`row-line ${styles.recMobRow}`}
              role="button"
              tabIndex={0}
              onClick={() => onEdit(r)}
              onKeyDown={(e) => e.key === 'Enter' && onEdit(r)}
            >
              <div className={`row-ico ${styles.recMobIco}`}>
                <Icon name="repeat" size={15} />
              </div>
              <div className={styles.recMobText}>
                <div className={styles.recMobName}>{r.name}</div>
                <div className={`t-faint ${styles.recMobSub}`}>
                  {freqLabel(r.frequency)} · {formatIsoDay(r.nextDate)}
                </div>
              </div>
              <div className={styles.recMobEnd}>
                <span className="t-mono t-neg">{money(r.amount)}</span>
                <StatusBadge known={r.known} />
              </div>
            </div>
          ))}
        </Card>
      )}

      <DetectionCard />
    </div>
  )
}
