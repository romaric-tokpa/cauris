import { useSearchParams } from 'react-router-dom'
import { Icon } from '../../components/primitives'
import { Card } from '../../components/ui'
import { useComptes } from './useComptes'
import { ComptesDesktop } from './ComptesDesktop'
import { ComptesMobile } from './ComptesMobile'
import styles from './comptes.module.css'

function Skeleton() {
  return (
    <div className={styles.skeleton} aria-hidden="true">
      <div className={styles.skelCard} />
      <div className={`${styles.skelCard} ${styles.skelTall}`} />
    </div>
  )
}

export function Comptes() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') ?? 'Tous'
  const setTab = (t: string) => {
    setParams(
      (prev) => {
        const p = new URLSearchParams(prev)
        if (t && t !== 'Tous') p.set('tab', t)
        else p.delete('tab')
        return p
      },
      { replace: true },
    )
  }

  const q = useComptes()

  if (q.isPending) return <Skeleton />
  if (q.isError || !q.data) {
    return (
      <div className={styles.centerState}>
        <Card className={styles.skeleton}>
          <div className="r">
            <Icon name="alert" size={20} className="t-neg" />
          </div>
          <div>Impossible de charger les comptes.</div>
          <button type="button" className="btn primary" onClick={() => void q.refetch()}>
            Réessayer
          </button>
        </Card>
      </div>
    )
  }

  return (
    <>
      <h1 className={styles.srOnly}>Comptes</h1>
      <ComptesDesktop data={q.data} tab={tab} setTab={setTab} className={styles.desktop} />
      <ComptesMobile data={q.data} tab={tab} setTab={setTab} className={styles.mobile} />
    </>
  )
}
