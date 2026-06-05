import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Icon } from '../../components/primitives'
import { Card, Drawer, BottomSheet } from '../../components/ui'
import { useTransactions, useAccounts, useCategories, type TxnRow } from './useTransactions'
import { useRecurrences, type RecurrenceRow } from './useRecurrences'
import { RECURRENCES_TAB } from './helpers'
import { TxnDesktop } from './TxnDesktop'
import { TxnMobile } from './TxnMobile'
import { RecurrencesDesktop, RecurrencesMobile } from './Recurrences'
import { TransactionForm } from './TransactionForm'
import { VoiceCapture } from './VoiceCapture'
import { ChatCapture } from './ChatCapture'
import { SmsCapture } from './SmsCapture'
import { RecurrenceForm } from './RecurrenceForm'
import type { VoicePrefill } from '../../lib/voiceStub'
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

function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className={styles.centerState}>
      <Card className={styles.skeleton}>
        <div className="r">
          <Icon name="alert" size={20} className="t-neg" />
        </div>
        <div>{message}</div>
        <button type="button" className="btn primary" onClick={onRetry}>
          Réessayer
        </button>
      </Card>
    </div>
  )
}

export function Transactions() {
  const [params, setParams] = useSearchParams()
  const isMobile = useIsMobile()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<TxnRow | undefined>(undefined)
  // Capture vocale (Lot B2) : le drawer d'ajout bascule entre le formulaire et le flux
  // vocal ; `prefill` porte le brouillon dicté quand l'utilisateur choisit « Corriger ».
  const [captureMode, setCaptureMode] = useState<'form' | 'voice' | 'chat' | 'sms'>('form')
  const [prefill, setPrefill] = useState<VoicePrefill | undefined>(undefined)
  // Drawer récurrence (distinct du drawer transaction).
  const [recOpen, setRecOpen] = useState(false)
  const [recEditing, setRecEditing] = useState<RecurrenceRow | undefined>(undefined)

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

  // L'onglet « Récurrentes » bascule sur la vue ENTITÉ (table `recurrences`),
  // pas un filtre de la liste des transactions.
  const isRecurrences = filters.type === RECURRENCES_TAB

  // Périmètre temporel : honore from/to de l'URL s'ils sont fournis (ex. lien
  // « Voir les transactions liées » d'un budget → catégorie + bornes du mois), sinon
  // retombe sur le mois courant. Le chip « Mai 2026 » reste un VRAI périmètre par
  // défaut (scope liste + stats au mois courant ; sinon une opération d'un autre mois
  // fausserait Entrées/Net). Convergence avec le dashboard.
  const from = params.get('from') || '2026-05-01'
  const to = params.get('to') || '2026-05-31'
  const list = useTransactions({ ...filters, from, to })
  const recs = useRecurrences(isRecurrences)
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
    setPrefill(undefined)
    setCaptureMode('form')
    setFormOpen(true)
  }
  const openEdit = (row: TxnRow) => {
    setEditing(row)
    setPrefill(undefined)
    setCaptureMode('form')
    setFormOpen(true)
  }
  // Corriger : on quitte le flux vocal vers le formulaire pré-rempli avec le brouillon.
  const onVoiceCorrect = (p: VoicePrefill) => {
    setPrefill(p)
    setCaptureMode('form')
  }
  const close = () => {
    setFormOpen(false)
    setEditing(undefined)
    setPrefill(undefined)
    setCaptureMode('form')
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

  const openNewRec = () => {
    setRecEditing(undefined)
    setRecOpen(true)
  }
  const openEditRec = (r: RecurrenceRow) => {
    setRecEditing(r)
    setRecOpen(true)
  }
  const closeRec = () => {
    setRecOpen(false)
    setRecEditing(undefined)
  }

  // Chargement / erreur : gate sur la requête pertinente selon l'onglet.
  if (isRecurrences ? recs.isPending : list.isPending) return <Skeleton />
  if (isRecurrences ? recs.isError || !recs.data : list.isError || !list.data) {
    return isRecurrences ? (
      <ErrorCard message="Impossible de charger les récurrences." onRetry={() => void recs.refetch()} />
    ) : (
      <ErrorCard message="Impossible de charger les transactions." onRetry={() => void list.refetch()} />
    )
  }

  const accounts = accountsQ.data ?? []
  const categories = categoriesQ.data ?? []
  const formReady = accounts.length > 0

  return (
    <>
      <h1 className={styles.srOnly}>Transactions</h1>

      {isRecurrences ? (
        <>
          <RecurrencesDesktop
            data={recs.data ?? []}
            filters={filters}
            setFilter={setFilter}
            onNew={openNewRec}
            onEdit={openEditRec}
            className={styles.desktop}
          />
          <RecurrencesMobile
            data={recs.data ?? []}
            filters={filters}
            setFilter={setFilter}
            onNew={openNewRec}
            onEdit={openEditRec}
            className={styles.mobile}
          />
        </>
      ) : (
        list.data && (
          <>
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
          </>
        )
      )}

      {/* Drawer transaction — se rend TOUJOURS quand on l'ouvre : si aucun compte
       *  n'existe, il explique pourquoi au lieu de laisser le bouton « Ajouter » muet
       *  (anti-inerte — un bouton agit ou se justifie, jamais cliquable sans effet). */}
      {(() => {
        const isVoice = captureMode === 'voice'
        const isChat = captureMode === 'chat'
        const isSms = captureMode === 'sms'
        const title = isVoice
          ? 'Note vocale'
          : isChat
            ? 'Langage naturel'
            : isSms
              ? 'Depuis un SMS'
              : isMobile
                ? editing
                  ? 'Modifier'
                  : 'Ajouter'
                : editing
                  ? 'Modifier la transaction'
                  : 'Ajouter une transaction'
        const body = !formReady ? (
          <NoAccountNotice onClose={close} />
        ) : isVoice ? (
          <VoiceCapture
            accounts={accounts}
            categories={categories}
            onCorrect={onVoiceCorrect}
            onClose={close}
          />
        ) : isChat ? (
          <ChatCapture
            accounts={accounts}
            categories={categories}
            onCorrect={onVoiceCorrect}
            onClose={close}
          />
        ) : isSms ? (
          <SmsCapture
            accounts={accounts}
            categories={categories}
            onCorrect={onVoiceCorrect}
            onClose={close}
          />
        ) : (
          <TransactionForm
            key={editing?.id ?? (prefill ? 'voice-prefill' : 'new')}
            initial={editing}
            prefill={prefill}
            accounts={accounts}
            categories={categories}
            stacked={isMobile}
            onClose={close}
            // Entrées capture visibles à la création seulement (pas en édition).
            onVoice={editing ? undefined : () => setCaptureMode('voice')}
            onChat={editing ? undefined : () => setCaptureMode('chat')}
            onSms={editing ? undefined : () => setCaptureMode('sms')}
          />
        )
        return isMobile ? (
          <BottomSheet open={formVisible} onClose={close} title={title}>
            {body}
          </BottomSheet>
        ) : (
          <Drawer open={formVisible} onClose={close} title={title}>
            {body}
          </Drawer>
        )
      })()}

      {/* Drawer récurrence (Nouvelle / Modifier). */}
      {isMobile ? (
        <BottomSheet open={recOpen} onClose={closeRec} title={recEditing ? 'Modifier' : 'Nouvelle'}>
          <RecurrenceForm
            key={recEditing?.id ?? 'new'}
            initial={recEditing}
            accounts={accounts}
            categories={categories}
            stacked
            onClose={closeRec}
          />
        </BottomSheet>
      ) : (
        <Drawer
          open={recOpen}
          onClose={closeRec}
          title={recEditing ? 'Modifier la récurrence' : 'Nouvelle récurrence'}
        >
          <RecurrenceForm
            key={recEditing?.id ?? 'new'}
            initial={recEditing}
            accounts={accounts}
            categories={categories}
            onClose={closeRec}
          />
        </Drawer>
      )}
    </>
  )
}
