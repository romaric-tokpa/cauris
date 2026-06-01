import { useSearchParams } from 'react-router-dom'
import { Icon } from '../../components/primitives'
import { Card } from '../../components/ui'
import { useBudgets } from './useBudgets'
import { BudgetsDesktop } from './BudgetsDesktop'
import { BudgetsMobile } from './BudgetsMobile'
import styles from './budgets.module.css'

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
  return (
    <>
      <h1 className={styles.srOnly}>Budgets</h1>
      <BudgetsDesktop
        budgets={budgets}
        summary={summary}
        tab={tab}
        setTab={setTab}
        className={styles.desktop}
      />
      <BudgetsMobile
        budgets={budgets}
        summary={summary}
        tab={tab}
        setTab={setTab}
        className={styles.mobile}
      />
    </>
  )
}
