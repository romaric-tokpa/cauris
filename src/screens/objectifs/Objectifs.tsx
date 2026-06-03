import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Icon } from '../../components/primitives'
import { Card, Drawer, BottomSheet } from '../../components/ui'
import { useGoals } from './useObjectifs'
import { ObjectifsDesktop } from './ObjectifsDesktop'
import { ObjectifsMobile } from './ObjectifsMobile'
import { GoalForm } from './GoalForm'
import styles from './objectifs.module.css'

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

export function Objectifs() {
  const [params, setParams] = useSearchParams()
  const isMobile = useIsMobile()
  const [formOpen, setFormOpen] = useState(false)
  const tab = params.get('tab') ?? 'En cours'
  const setTab = (t: string) => {
    setParams(
      (prev) => {
        const p = new URLSearchParams(prev)
        if (t && t !== 'En cours') p.set('tab', t)
        else p.delete('tab')
        return p
      },
      { replace: true },
    )
  }

  const q = useGoals()

  if (q.isPending) return <Skeleton />
  if (q.isError || !q.data) {
    return (
      <div className={styles.centerState}>
        <Card className={styles.skeleton}>
          <div className="r">
            <Icon name="alert" size={20} className="t-neg" />
          </div>
          <div>Impossible de charger les objectifs.</div>
          <button type="button" className="btn primary" onClick={() => void q.refetch()}>
            Réessayer
          </button>
        </Card>
      </div>
    )
  }

  const { goals } = q.data
  const close = () => setFormOpen(false)
  return (
    <>
      <h1 className={styles.srOnly}>Objectifs</h1>
      <ObjectifsDesktop
        goals={goals}
        tab={tab}
        setTab={setTab}
        onNew={() => setFormOpen(true)}
        className={styles.desktop}
      />
      <ObjectifsMobile
        goals={goals}
        tab={tab}
        setTab={setTab}
        onNew={() => setFormOpen(true)}
        className={styles.mobile}
      />

      {isMobile ? (
        <BottomSheet open={formOpen} onClose={close} title="Nouvel objectif">
          <GoalForm onClose={close} />
        </BottomSheet>
      ) : (
        <Drawer open={formOpen} onClose={close} title="Nouvel objectif">
          <GoalForm onClose={close} />
        </Drawer>
      )}
    </>
  )
}
