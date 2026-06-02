import { useSearchParams } from 'react-router-dom'
import { Icon } from '../../components/primitives'
import { Card } from '../../components/ui'
import { EmptyState } from '../../components/states'
import { useSetPageTitle } from '../../components/shell/pageTitle'
import { useLoans, useLoan, type LoanDetailResponse } from './useLoans'
import { DEFAULT_TAB } from './tabs'
import { PretDesktop } from './PretDesktop'
import { PretMobile } from './PretMobile'
import styles from './pret.module.css'

function Skeleton() {
  return (
    <div className={styles.skeleton} aria-hidden="true">
      <div className={`${styles.skelCard} ${styles.skelTall}`} />
      <div className={styles.skelCard} />
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
        <div>Impossible de charger le prêt.</div>
        <button type="button" className="btn primary" onClick={onRetry}>
          Réessayer
        </button>
      </Card>
    </div>
  )
}

export function Pret() {
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

  // Domaine : un prêt unique. On lit la liste puis le détail du prêt primaire.
  const list = useLoans()
  const primaryId = list.data?.loans[0]?.id ?? ''
  const detail = useLoan(primaryId)

  if (list.isPending || (primaryId && detail.isPending)) return <Skeleton />
  if (list.isError) return <ErrorCard onRetry={() => void list.refetch()} />

  // Aucun prêt en cours → état vide soigné.
  if (!primaryId) {
    return (
      <>
        <div>
          <div className="t-eyebrow">Prêt / Dette</div>
          <h1 className={styles.pageTitle}>Prêt / Dette</h1>
        </div>
        <EmptyState
          icon="bank"
          title="Aucun prêt en cours"
          text="Vous n'avez aucun crédit suivi pour le moment."
        />
      </>
    )
  }

  if (detail.isError || !detail.data) return <ErrorCard onRetry={() => void detail.refetch()} />

  return <LoanView data={detail.data} tab={tab} setTab={setTab} />
}

function LoanView({
  data,
  tab,
  setTab,
}: {
  data: LoanDetailResponse
  tab: string
  setTab: (t: string) => void
}) {
  useSetPageTitle(data.loan.name)
  return (
    <>
      <h1 className={styles.srOnly}>Prêt / Dette — {data.loan.name}</h1>
      <PretDesktop data={data} tab={tab} setTab={setTab} className={styles.desktop} />
      <PretMobile data={data} tab={tab} setTab={setTab} className={styles.mobile} />
    </>
  )
}
