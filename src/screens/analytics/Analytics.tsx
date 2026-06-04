import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Icon } from '../../components/primitives'
import { Card, Drawer, BottomSheet } from '../../components/ui'
import { useSetPageTitle } from '../../components/shell/pageTitle'
import { useAnalytics, DEMO_MONTH, type AnalyticsData } from './useAnalytics'
import { DEFAULT_TAB } from './tabs'
import { AnalyticsDesktop } from './AnalyticsDesktop'
import { AnalyticsMobile } from './AnalyticsMobile'
import { ExportForm } from './ExportForm'
import { PeriodForm } from './PeriodForm'
import styles from './analytics.module.css'

/** Vrai sous le breakpoint shell (mobile) — choisit Drawer vs BottomSheet. */
function useIsMobile(): boolean {
  const [m, setM] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 900px)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)')
    const onChange = () => setM(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return m
}

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
  const month = params.get('month') ?? DEMO_MONTH

  const setParam = (key: string, value: string, fallback: string) => {
    setParams(
      (prev) => {
        const p = new URLSearchParams(prev)
        if (value && value !== fallback) p.set(key, value)
        else p.delete(key)
        return p
      },
      { replace: true },
    )
  }
  const setTab = (t: string) => setParam('tab', t, DEFAULT_TAB)
  const setMonth = (m: string) => setParam('month', m, DEMO_MONTH)

  const query = useAnalytics(month === DEMO_MONTH ? undefined : month)

  if (query.isPending) return <Skeleton />
  if (query.isError || !query.data) return <ErrorCard onRetry={() => void query.refetch()} />

  return <AnalyticsView data={query.data} tab={tab} setTab={setTab} month={month} setMonth={setMonth} />
}

function AnalyticsView({
  data,
  tab,
  setTab,
  month,
  setMonth,
}: {
  data: AnalyticsData
  tab: string
  setTab: (t: string) => void
  month: string
  setMonth: (m: string) => void
}) {
  useSetPageTitle('Analytics')
  const isMobile = useIsMobile()
  const [exportOpen, setExportOpen] = useState(false)
  const [periodOpen, setPeriodOpen] = useState(false)

  const onExport = () => setExportOpen(true)
  const onPeriod = () => setPeriodOpen(true)

  return (
    <>
      <h1 className={styles.srOnly}>Analytics — Mai 2026</h1>
      <AnalyticsDesktop
        data={data}
        tab={tab}
        setTab={setTab}
        onExport={onExport}
        onPeriod={onPeriod}
        className={styles.desktop}
      />
      <AnalyticsMobile
        data={data}
        tab={tab}
        setTab={setTab}
        onExport={onExport}
        onPeriod={onPeriod}
        className={styles.mobile}
      />

      {/* Exporter le rapport — Drawer (desktop) / BottomSheet (mobile) */}
      {isMobile ? (
        <BottomSheet open={exportOpen} onClose={() => setExportOpen(false)} title="Exporter le rapport">
          <ExportForm data={data} onClose={() => setExportOpen(false)} />
        </BottomSheet>
      ) : (
        <Drawer open={exportOpen} onClose={() => setExportOpen(false)} title="Exporter le rapport">
          <ExportForm data={data} onClose={() => setExportOpen(false)} />
        </Drawer>
      )}

      {/* Choisir une période — Drawer (desktop) / BottomSheet (mobile) */}
      {isMobile ? (
        <BottomSheet open={periodOpen} onClose={() => setPeriodOpen(false)} title="Choisir une période">
          <PeriodForm current={month} onApply={setMonth} onClose={() => setPeriodOpen(false)} />
        </BottomSheet>
      ) : (
        <Drawer open={periodOpen} onClose={() => setPeriodOpen(false)} title="Choisir une période">
          <PeriodForm current={month} onApply={setMonth} onClose={() => setPeriodOpen(false)} />
        </Drawer>
      )}
    </>
  )
}
