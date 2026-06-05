import { useEffect, useRef, useState } from 'react'
import { Composer, SuggestionChips } from '../assistant/ChatThread'
import { extractDraft, todayIso, type VoiceDraft, type VoicePrefill } from '../../lib/voiceStub'
import { DraftReview } from './DraftReview'
import type { AccountRef, CategoryRef } from './useTransactions'
import styles from './transactions.module.css'

/** Suggestions cliquables (wireframe `ChatEntryMob`) — remplissent + envoient. */
const SUGGESTIONS = ['Cash 10000 maison', 'Reçu 150000 salaire'] as const

/** Mise en scène honnête : l'extraction est instantanée ; bref délai pour le rythme. */
const THINKING_MS = 500

interface ChatMsg {
  role: 'user' | 'ai'
  text: string
}

/** Message d'accueil — cadre l'attente : c'est l'utilisateur qui valide (pas d'IA magique). */
const GREETING: ChatMsg = {
  role: 'ai',
  text: 'Décrivez une opération en langage naturel — je prépare le brouillon, vous validez.',
}

/**
 * Saisie conversationnelle (Lot B3) — texte libre → brouillon de transaction.
 * L'extraction passe par la frontière partagée `extractDraft` (déterministe locale ;
 * voir `voiceStub`). La bulle « IA » est étiquetée comme l'Assistant de l'app (avatar
 * « C ») et ne promet AUCUNE intelligence supérieure : elle expose un brouillon que
 * l'utilisateur corrige/valide (composant PARTAGÉ `DraftReview`). Le cas NON RÉSOLU
 * (confiances basses) est NORMAL pour du texte libre.
 */
export function ChatCapture({
  accounts,
  categories,
  onCorrect,
  onClose,
}: {
  accounts: AccountRef[]
  categories: CategoryRef[]
  /** Modifier → ouvre le formulaire B1 pré-rempli avec le brouillon. */
  onCorrect: (prefill: VoicePrefill) => void
  onClose: () => void
}) {
  const [messages, setMessages] = useState<ChatMsg[]>([GREETING])
  const [draft, setDraft] = useState<VoiceDraft | null>(null)
  const [input, setInput] = useState('')
  const [pending, setPending] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  const send = (text: string) => {
    const t = text.trim()
    if (!t || pending) return
    setInput('')
    setDraft(null)
    setMessages((m) => [...m, { role: 'user', text: t }])
    setPending(true)
    timer.current = setTimeout(() => {
      const d = extractDraft(t, accounts, categories, todayIso())
      setMessages((m) => [...m, { role: 'ai', text: 'J’ai préparé cette transaction :' }])
      setDraft(d)
      setPending(false)
    }, THINKING_MS)
  }

  return (
    <div className={styles.chatCol}>
      <div className="chat">
        {messages.map((m, i) => {
          const showDraft = m.role === 'ai' && draft !== null && i === messages.length - 1
          return (
            <div className={`msg ${m.role === 'user' ? 'u' : 'ai'}`} key={i}>
              {m.role === 'ai' && <div className="ai-av">C</div>}
              <div className="bubble">
                {m.text}
                {showDraft && draft && (
                  <DraftReview
                    draft={draft}
                    onCorrect={onCorrect}
                    onClose={onClose}
                    correctLabel="Modifier"
                    validateLabel="Enregistrer"
                  />
                )}
              </div>
            </div>
          )
        })}
        {pending && (
          <div className="msg ai" aria-live="polite">
            <div className="ai-av">C</div>
            <div className="bubble">
              <span className={styles.chatTyping} aria-label="Analyse de votre saisie">
                <i />
                <i />
                <i />
              </span>
            </div>
          </div>
        )}
      </div>

      <SuggestionChips items={SUGGESTIONS} onPick={send} disabled={pending} />
      <Composer
        input={input}
        setInput={setInput}
        onSubmit={send}
        disabled={pending}
        placeholder="Décrivez une opération…"
      />
    </div>
  )
}
