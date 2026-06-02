import { useSearchParams } from 'react-router-dom'
import { Icon } from '../../components/primitives'
import { Card } from '../../components/ui'
import { useSetPageTitle } from '../../components/shell/pageTitle'
import { useAnalytics, type AnalyticsData } from './useAnalytics'
import { DEFAULT_TAB } from './tabs'
import { AnalyticsDesktop } from './AnalyticsDesktop'
import { AnalyticsMobile } from './AnalyticsMobile'
import styles from './analytics.module.css'

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
        <div>Impossible de charger les analyses.</div>
        <button type="button" className="btn primary" onClick={onRetry}>
          Réessayer
        </button>
      </Card>
    </div>
  )
}

export function Analytics() {
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

  const query = useAnalytics()

  if (query.isPending) return <Skeleton />
  if (query.isError || !query.data) return <ErrorCard onRetry={() => void query.refetch()} />

  return <AnalyticsView data={query.data} tab={tab} setTab={setTab} />
}

function AnalyticsView({
  data,
  tab,
  setTab,
}: {
  data: AnalyticsData
  tab: string
  setTab: (t: string) => void
}) {
  useSetPageTitle('Analytics')
  return (
    <>
      <h1 className={styles.srOnly}>Analytics — Mai 2026</h1>
      <AnalyticsDesktop data={data} tab={tab} setTab={setTab} className={styles.desktop} />
      <AnalyticsMobile data={data} tab={tab} setTab={setTab} className={styles.mobile} />
    </>
  )
}
