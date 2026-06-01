import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Icon } from '../../components/primitives'
import { Card, Drawer, BottomSheet } from '../../components/ui'
import { useTransactions, useAccounts, useCategories, type TxnRow } from './useTransactions'
import { TxnDesktop } from './TxnDesktop'
import { TxnMobile } from './TxnMobile'
import { TransactionForm } from './TransactionForm'
import styles from './transactions.module.css'

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

export function Transactions() {
  const [params, setParams] = useSearchParams()
  const isMobile = useIsMobile()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<TxnRow | undefined>(undefined)

  // Filtres lus depuis l'URL (persistants, partageables, survivent au retour).
  const filters: Record<string, string> = {
    type: params.get('type') ?? '',
    accountId: params.get('accountId') ?? '',
    categoryId: params.get('categoryId') ?? '',
    q: params.get('q') ?? '',
  }
  const setFilter = (key: string, value: string) => {
    setParams(
      (prev) => {
        const p = new URLSearchParams(prev)
        if (value) p.set(key, value)
        else p.delete(key)
        return p
      },
      { replace: true },
    )
  }

  // Le chip « Mai 2026 » est un VRAI périmètre : la liste + les stats sont scopées
  // au mois courant (sinon une opération d'un autre mois — ex. Freelance en avril —
  // fausserait les Entrées/Net). Mai = mois de démo ; convergence avec le dashboard.
  const list = useTransactions({ ...filters, from: '2026-05-01', to: '2026-05-31' })
  const accountsQ = useAccounts()
  const categoriesQ = useCategories()

  const openAdd = () => {
    setEditing(undefined)
    setFormOpen(true)
  }
  const openEdit = (row: TxnRow) => {
    setEditing(row)
    setFormOpen(true)
  }
  const close = () => {
    setFormOpen(false)
    setEditing(undefined)
  }

  if (list.isPending) return <Skeleton />
  if (list.isError || !list.data) {
    return (
      <div className={styles.centerState}>
        <Card className={styles.skeleton}>
          <div className="r">
            <Icon name="alert" size={20} className="t-neg" />
          </div>
          <div>Impossible de charger les transactions.</div>
          <button type="button" className="btn primary" onClick={() => void list.refetch()}>
            Réessayer
          </button>
        </Card>
      </div>
    )
  }

  const accounts = accountsQ.data ?? []
  const categories = categoriesQ.data ?? []
  const formReady = accounts.length > 0

  return (
    <>
      <h1 className={styles.srOnly}>Transactions</h1>
      <TxnDesktop
        data={list.data}
        filters={filters}
        setFilter={setFilter}
        accounts={accounts}
        categories={categories}
        onAdd={openAdd}
        onRowClick={openEdit}
        className={styles.desktop}
      />
      <TxnMobile
        data={list.data}
        filters={filters}
        setFilter={setFilter}
        onRowClick={openEdit}
        className={styles.mobile}
      />

      {formReady &&
        (isMobile ? (
          <BottomSheet open={formOpen} onClose={close} title={editing ? 'Modifier' : 'Ajouter'}>
            <TransactionForm
              key={editing?.id ?? 'new'}
              initial={editing}
              accounts={accounts}
              categories={categories}
              stacked
              onClose={close}
            />
          </BottomSheet>
        ) : (
          <Drawer
            open={formOpen}
            onClose={close}
            title={editing ? 'Modifier la transaction' : 'Ajouter une transaction'}
          >
            <TransactionForm
              key={editing?.id ?? 'new'}
              initial={editing}
              accounts={accounts}
              categories={categories}
              onClose={close}
            />
          </Drawer>
        ))}
    </>
  )
}
