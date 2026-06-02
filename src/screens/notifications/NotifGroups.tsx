import { Card } from '../../components/ui'
import { EmptyState } from '../../components/states'
import { NotifRow } from './NotifRow'
import { filterByTab } from './tabs'
import type { NotificationItem } from './useNotifications'
import styles from './notifications.module.css'

interface Props {
  items: NotificationItem[]
  tab: string
  compact?: boolean
  onActivate: (id: string) => void
}

function Group({
  label,
  items,
  compact,
  onActivate,
}: {
  label: string
  items: NotificationItem[]
  compact: boolean
  onActivate: (id: string) => void
}) {
  if (!items.length) return null
  return (
    <div className={styles.group}>
      <div className={`t-eyebrow ${styles.groupLabel}`}>{label}</div>
      <Card pad={false} className={compact ? styles.listCardSm : styles.listCard}>
        {items.map((n) => (
          <NotifRow key={n.id} n={n} compact={compact} onActivate={(x) => onActivate(x.id)} />
        ))}
      </Card>
    </div>
  )
}

/** Notifications du filtre actif, groupées Non lues / Plus tôt (par `read`).
 *  Section vide masquée ; filtre sans résultat → état vide soigné. */
export function NotifGroups({ items, tab, compact = false, onActivate }: Props) {
  const filtered = filterByTab(items, tab)
  if (!filtered.length) {
    return (
      <EmptyState
        icon="bell"
        title="Rien dans ce filtre"
        text="Aucune notification ne correspond pour le moment."
      />
    )
  }
  const unread = filtered.filter((n) => !n.read)
  const earlier = filtered.filter((n) => n.read)
  return (
    <>
      <Group label="Non lues" items={unread} compact={compact} onActivate={onActivate} />
      <Group label="Plus tôt" items={earlier} compact={compact} onActivate={onActivate} />
    </>
  )
}
