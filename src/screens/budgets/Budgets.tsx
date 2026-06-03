import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Icon } from '../../components/primitives'
import { Card, Drawer, BottomSheet } from '../../components/ui'
import { useBudgets, useArchivedBudgets, useBudgetMutations } from './useBudgets'
import { BudgetsDesktop } from './BudgetsDesktop'
import { BudgetsMobile } from './BudgetsMobile'
import { BudgetForm } from './BudgetForm'
import styles from './budgets.module.css'

/** Vrai en dessous du breakpoint shell (mobile) — choisit Drawer vs BottomSheet. */
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

export function Budgets() {
  const [params, setParams] = useSearchParams()
  const isMobile = useIsMobile()
  const [formOpen, setFormOpen] = useState(false)
  const tab = params.get('tab') ?? 'Actifs'
  const setTab = (t: string) => {
    setParams(
      (prev) => {
        const p = new URLSearchParams(prev)
        if (t && t !== 'Actifs') p.set('tab', t)
        else p.delete('tab')
        return p
      },
      { replace: true },
    )
  }

  const q = useBudgets()
  const archivedQ = useArchivedBudgets(tab === 'Archivés')
  const { unarchive } = useBudgetMutations()

  if (q.isPending) return <Skeleton />
  if (q.isError || !q.data) {
    return (
      <div className={styles.centerState}>
        <Card className={styles.skeleton}>
          <div className="r">
            <Icon name="alert" size={20} className="t-neg" />
          </div>
          <div>Impossible de charger les budgets.</div>
          <button type="button" className="btn primary" onClick={() => void q.refetch()}>
            Réessayer
          </button>
        </Card>
      </div>
    )
  }

  const { budgets, summary } = q.data
  const close = () => setFormOpen(false)

  return (
    <>
      <h1 className={styles.srOnly}>Budgets</h1>
      <BudgetsDesktop
        budgets={budgets}
        summary={summary}
        tab={tab}
        setTab={setTab}
        archived={archivedQ.data ?? []}
        onNew={() => setFormOpen(true)}
        onReactivate={(id) => unarchive.mutate(id)}
        className={styles.desktop}
      />
      <BudgetsMobile
        budgets={budgets}
        summary={summary}
        tab={tab}
        setTab={setTab}
        onNew={() => setFormOpen(true)}
        className={styles.mobile}
      />

      {isMobile ? (
        <BottomSheet open={formOpen} onClose={close} title="Nouveau budget">
          <BudgetForm onClose={close} />
        </BottomSheet>
      ) : (
        <Drawer open={formOpen} onClose={close} title="Nouveau budget">
          <BudgetForm onClose={close} />
        </Drawer>
      )}
    </>
  )
}
