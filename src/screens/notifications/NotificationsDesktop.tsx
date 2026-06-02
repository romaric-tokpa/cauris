import { Icon } from '../../components/primitives'
import { NotifGroups } from './NotifGroups'
import { TABS } from './tabs'
import type { NotificationsResponse } from './useNotifications'
import styles from './notifications.module.css'

interface Props {
  data: NotificationsResponse
  tab: string
  setTab: (t: string) => void
  onActivate: (id: string) => void
  onMarkAll: () => void
  className?: string
}

/** Écran Notifications desktop — porté 1:1 de NotifDesk (screens-notifications.jsx). */
export function NotificationsDesktop({ data, tab, setTab, onActivate, onMarkAll, className = '' }: Props) {
  return (
    <div className={className}>
      {/* header */}
      <div className="r between">
        <div>
          <div className="t-eyebrow">{data.unreadCount} non lues</div>
          <div className={styles.pageTitle}>Notifications</div>
        </div>
        <div className={`r ${styles.headActions}`}>
          <button type="button" className={`btn ${styles.soon}`} disabled title="Bientôt disponible">
            <Icon name="gear" size={16} /> Préférences
          </button>
          <button type="button" className="btn primary" onClick={onMarkAll}>
            <Icon name="check" size={16} /> Tout marquer comme lu
          </button>
        </div>
      </div>

      {/* subnav (filtres persistés ?tab=) */}
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

      <div className={styles.list}>
        <NotifGroups items={data.notifications} tab={tab} onActivate={onActivate} />
      </div>
    </div>
  )
}
