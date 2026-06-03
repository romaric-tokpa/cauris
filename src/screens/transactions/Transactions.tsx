import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
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

/** Contenu du drawer d'ajout quand l'utilisateur n'a encore aucun compte : on ne
 *  peut pas saisir d'opération sans compte de destination → on l'explique et on
 *  l'oriente, plutôt que d'ouvrir un formulaire inutilisable. */
function NoAccountNotice({ onClose }: { onClose: () => void }) {
  return (
    <div className={styles.noAccount}>
      <div className={`row-ico ${styles.noAccountIco}`}>
        <Icon name="wallet" size={20} />
      </div>
      <div className={styles.noAccountText}>
        Ajoutez d'abord un compte pour pouvoir enregistrer une transaction.
      </div>
      <Link to="/comptes" className="btn primary" onClick={onClose}>
        <Icon name="plus" size={16} /> Créer un compte
      </Link>
    </div>
  )
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

  // Périmètre temporel : honore from/to de l'URL s'ils sont fournis (ex. lien
  // « Voir les transactions liées » d'un budget → catégorie + bornes du mois), sinon
  // retombe sur le mois courant. Le chip « Mai 2026 » reste un VRAI périmètre par
  // défaut (scope liste + stats au mois courant ; sinon une opération d'un autre mois
  // fausserait Entrées/Net). Convergence avec le dashboard.
  const from = params.get('from') || '2026-05-01'
  const to = params.get('to') || '2026-05-31'
  const list = useTransactions({ ...filters, from, to })
  const accountsQ = useAccounts()
  const categoriesQ = useCategories()

  // Ouverture par lien : le FAB mobile navigue vers `/transactions?new=1`. On DÉRIVE
  // l'ouverture du drawer depuis l'URL (pas de setState dans un effet) → fonctionne que
  // l'écran soit déjà monté ou non. `close()` retire le param pour ne pas rouvrir au
  // refresh / retour.
  const newRequested = params.get('new') === '1'
  const formVisible = formOpen || newRequested

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
    if (newRequested) {
      setParams(
        (prev) => {
          const p = new URLSearchParams(prev)
          p.delete('new')
          return p
        },
        { replace: true },
      )
    }
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

      {/* Le drawer se rend TOUJOURS quand on l'ouvre : si aucun compte n'existe,
       *  il explique pourquoi au lieu de laisser le bouton « Ajouter » muet
       *  (anti-inerte — un bouton agit ou se justifie, jamais cliquable sans effet). */}
      {isMobile ? (
        <BottomSheet open={formVisible} onClose={close} title={editing ? 'Modifier' : 'Ajouter'}>
          {formReady ? (
            <TransactionForm
              key={editing?.id ?? 'new'}
              initial={editing}
              accounts={accounts}
              categories={categories}
              stacked
              onClose={close}
            />
          ) : (
            <NoAccountNotice onClose={close} />
          )}
        </BottomSheet>
      ) : (
        <Drawer
          open={formVisible}
          onClose={close}
          title={editing ? 'Modifier la transaction' : 'Ajouter une transaction'}
        >
          {formReady ? (
            <TransactionForm
              key={editing?.id ?? 'new'}
              initial={editing}
              accounts={accounts}
              categories={categories}
              onClose={close}
            />
          ) : (
            <NoAccountNotice onClose={close} />
          )}
        </Drawer>
      )}
    </>
  )
}
