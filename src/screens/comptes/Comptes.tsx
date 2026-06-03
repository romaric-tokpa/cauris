import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Icon } from '../../components/primitives'
import { Card, Drawer, BottomSheet } from '../../components/ui'
import { useComptes, useCompteMutations, type AccountRow } from './useComptes'
import { ComptesDesktop } from './ComptesDesktop'
import { ComptesMobile } from './ComptesMobile'
import { AccountForm } from './AccountForm'
import styles from './comptes.module.css'

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

export function Comptes() {
  const [params, setParams] = useSearchParams()
  const isMobile = useIsMobile()
  const [addOpen, setAddOpen] = useState(false)
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
  const { block, unblock } = useCompteMutations()
  // Bascule blocage depuis une carte de la liste (action immédiate, réversible).
  const toggleBlock = (a: AccountRow) => {
    const m = a.blocked ? unblock : block
    m.mutate(a.id)
  }

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

  const close = () => setAddOpen(false)

  return (
    <>
      <h1 className={styles.srOnly}>Comptes</h1>
      <ComptesDesktop
        data={q.data}
        tab={tab}
        setTab={setTab}
        onAdd={() => setAddOpen(true)}
        onToggleBlock={toggleBlock}
        className={styles.desktop}
      />
      <ComptesMobile
        data={q.data}
        tab={tab}
        setTab={setTab}
        onAdd={() => setAddOpen(true)}
        className={styles.mobile}
      />

      {isMobile ? (
        <BottomSheet open={addOpen} onClose={close} title="Ajouter">
          <AccountForm stacked onClose={close} />
        </BottomSheet>
      ) : (
        <Drawer open={addOpen} onClose={close} title="Ajouter un compte">
          <AccountForm onClose={close} />
        </Drawer>
      )}
    </>
  )
}
