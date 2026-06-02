import { NotifGroups } from './NotifGroups'
import { MOBILE_TABS } from './tabs'
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

/** Écran Notifications mobile — porté 1:1 de NotifMob (3 chips, pas « Rappels »). */
export function NotificationsMobile({ data, tab, setTab, onActivate, onMarkAll, className = '' }: Props) {
  // Onglet desktop-only (Rappels) → repli sur « Toutes » côté mobile.
  const active = (MOBILE_TABS as readonly string[]).includes(tab) ? tab : 'Toutes'
  return (
    <div className={className}>
      <div className="r between">
        <div className={`r ${styles.chipRow}`}>
          {MOBILE_TABS.map((t) => (
            <span
              key={t}
              className={`chip ${styles.chip}` + (active === t ? ' on' : '')}
              role="button"
              aria-pressed={active === t}
              tabIndex={0}
              onClick={() => setTab(t)}
              onKeyDown={(e) => e.key === 'Enter' && setTab(t)}
            >
              {t}
            </span>
          ))}
        </div>
        <button type="button" className={`card-link ${styles.linkBtn}`} onClick={onMarkAll}>
          Tout lire
        </button>
      </div>

      <NotifGroups items={data.notifications} tab={active} compact onActivate={onActivate} />
    </div>
  )
}
