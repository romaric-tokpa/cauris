import { useSearchParams } from 'react-router-dom'
import { Icon } from '../../components/primitives'
import { Card } from '../../components/ui'
import { EmptyState } from '../../components/states'
import { useSetPageTitle } from '../../components/shell/pageTitle'
import { useNotifications, useNotifMutations, type NotificationsResponse } from './useNotifications'
import { DEFAULT_TAB } from './tabs'
import { NotificationsDesktop } from './NotificationsDesktop'
import { NotificationsMobile } from './NotificationsMobile'
import styles from './notifications.module.css'

function Skeleton() {
  return (
    <div className={styles.skeleton} aria-hidden="true">
      <div className={styles.skelCard} />
      <div className={`${styles.skelCard} ${styles.skelTall}`} />
    </div>
  )
}

function ErrorCard({ onRetry }: { onRetry: () => void }) {
  return (
    <div className={styles.centerState}>
      <Card className={styles.skeleton}>
        <div className="r">
          <Icon name="alert" size={20} className="t-neg" />
        </div>
        <div>Impossible de charger les notifications.</div>
        <button type="button" className="btn primary" onClick={onRetry}>
          Réessayer
        </button>
      </Card>
    </div>
  )
}

export function Notifications() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') ?? DEFAULT_TAB
  const setTab = (t: string) => {
    setParams(
      (prev) => {
        const p = new URLSearchParams(prev)
        if (t && t !== DEFAULT_TAB) p.set('tab', t)
        else p.delete('tab')
        return p
      },
      { replace: true },
    )
  }

  const query = useNotifications()
  useSetPageTitle('Notifications')

  if (query.isPending) return <Skeleton />
  if (query.isError || !query.data) return <ErrorCard onRetry={() => void query.refetch()} />

  return <NotificationsView data={query.data} tab={tab} setTab={setTab} />
}

function NotificationsView({
  data,
  tab,
  setTab,
}: {
  data: NotificationsResponse
  tab: string
  setTab: (t: string) => void
}) {
  const { markRead, markAllRead } = useNotifMutations()
  const onActivate = (id: string) => markRead.mutate(id)
  const onMarkAll = () => markAllRead.mutate()

  if (data.notifications.length === 0) {
    return (
      <>
        <div>
          <div className="t-eyebrow">Notifications</div>
          <h1 className={styles.pageTitle}>Notifications</h1>
        </div>
        <EmptyState
          icon="bell"
          title="Aucune notification"
          text="Vous êtes à jour — rien de neuf pour le moment."
        />
      </>
    )
  }

  return (
    <>
      <h1 className={styles.srOnly}>Notifications — {data.unreadCount} non lues</h1>
      <NotificationsDesktop
        data={data}
        tab={tab}
        setTab={setTab}
        onActivate={onActivate}
        onMarkAll={onMarkAll}
        className={styles.desktop}
      />
      <NotificationsMobile
        data={data}
        tab={tab}
        setTab={setTab}
        onActivate={onActivate}
        onMarkAll={onMarkAll}
        className={styles.mobile}
      />
    </>
  )
}
