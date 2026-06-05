import { useEffect, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Icon } from '../../components/primitives'
import { Card, Drawer, BottomSheet } from '../../components/ui'
import { EmptyState } from '../../components/states'
import { useSetPageTitle } from '../../components/shell/pageTitle'
import { useLoans, useLoan, type LoanRow, type LoanDetailResponse } from './useLoans'
import { DEFAULT_TAB } from './tabs'
import { LoanForm } from './LoanForm'
import { PretDesktop } from './PretDesktop'
import { PretMobile } from './PretMobile'
import styles from './pret.module.css'

/** Vrai sous le breakpoint shell (mobile) — Drawer vs BottomSheet. */
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

  const isMobile = useIsMobile()
  const list = useLoans()
  const loans = list.data?.loans ?? []
  const [pickedId, setPickedId] = useState<string | undefined>(undefined)
  // Prêt courant = choisi (s'il existe encore) sinon le premier.
  const selectedId = (pickedId && loans.some((l) => l.id === pickedId) ? pickedId : loans[0]?.id) ?? ''
  const detail = useLoan(selectedId)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<LoanRow | undefined>(undefined)
  const openAdd = () => {
    setEditing(undefined)
    setFormOpen(true)
  }
  const openEdit = () => {
    if (detail.data) {
      setEditing(detail.data.loan)
      setFormOpen(true)
    }
  }
  const close = () => {
    setFormOpen(false)
    setEditing(undefined)
  }
  // Après archive/suppression : repartir du premier prêt (le courant n'existe plus).
  const onExit = () => {
    setPickedId(undefined)
    close()
  }

  if (list.isPending || (selectedId && detail.isPending)) return <Skeleton />
  if (list.isError) return <ErrorCard onRetry={() => void list.refetch()} />

  const drawer = isMobile ? (
    <BottomSheet open={formOpen} onClose={close} title={editing ? 'Modifier le prêt' : 'Nouveau prêt'}>
      <LoanForm key={editing?.id ?? 'new'} initial={editing} onClose={close} onExit={onExit} />
    </BottomSheet>
  ) : (
    <Drawer open={formOpen} onClose={close} title={editing ? 'Modifier le prêt' : 'Ajouter un prêt'}>
      <LoanForm key={editing?.id ?? 'new'} initial={editing} onClose={close} onExit={onExit} />
    </Drawer>
  )

  // Cold start réparé : état vide + action « Ajouter un prêt ».
  if (!selectedId) {
    return (
      <>
        <div className={`r between ${styles.topBar}`}>
          <div>
            <div className="t-eyebrow">Prêt / Dette</div>
            <h1 className={styles.pageTitle}>Prêt / Dette</h1>
          </div>
        </div>
        <EmptyState
          icon="bank"
          title="Aucun prêt en cours"
          text="Suivez un crédit et son tableau d'amortissement réel."
          actions={
            <button type="button" className="btn primary" onClick={openAdd}>
              <Icon name="plus" size={16} /> Ajouter un prêt
            </button>
          }
        />
        {drawer}
      </>
    )
  }

  if (detail.isError || !detail.data) return <ErrorCard onRetry={() => void detail.refetch()} />

  return (
    <LoanView
      data={detail.data}
      loans={loans}
      selectedId={selectedId}
      onSelect={setPickedId}
      onAdd={openAdd}
      onEdit={openEdit}
      tab={tab}
      setTab={setTab}
      drawer={drawer}
    />
  )
}

function LoanView({
  data,
  loans,
  selectedId,
  onSelect,
  onAdd,
  onEdit,
  tab,
  setTab,
  drawer,
}: {
  data: LoanDetailResponse
  loans: LoanRow[]
  selectedId: string
  onSelect: (id: string) => void
  onAdd: () => void
  onEdit: () => void
  tab: string
  setTab: (t: string) => void
  drawer: ReactNode
}) {
  useSetPageTitle(data.loan.name)
  return (
    <>
      <h1 className={styles.srOnly}>Prêt / Dette — {data.loan.name}</h1>

      {/* Barre : sélecteur multi-prêts (si ≥ 2) + actions. */}
      <div className={`r between ${styles.topBar}`}>
        {loans.length > 1 ? (
          <div className={`r ${styles.loanChips}`} role="group" aria-label="Choisir un prêt">
            {loans.map((l) => (
              <button
                key={l.id}
                type="button"
                className={`chip${l.id === selectedId ? ' on' : ''}`}
                aria-pressed={l.id === selectedId}
                onClick={() => onSelect(l.id)}
              >
                {l.name}
              </button>
            ))}
          </div>
        ) : (
          <div className="t-eyebrow">Prêt / Dette</div>
        )}
        <div className={`r ${styles.topActions}`}>
          <button type="button" className="btn" onClick={onEdit}>
            <Icon name="edit" size={15} /> Modifier
          </button>
          <button type="button" className="btn primary" onClick={onAdd}>
            <Icon name="plus" size={15} /> Ajouter un prêt
          </button>
        </div>
      </div>

      <PretDesktop data={data} tab={tab} setTab={setTab} className={styles.desktop} />
      <PretMobile data={data} tab={tab} setTab={setTab} className={styles.mobile} />
      {drawer}
    </>
  )
}
