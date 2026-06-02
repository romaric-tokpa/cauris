import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { apiMutate } from '../../lib/api'

/** Barre de répartition (lecture seule) jointe à une réponse — miroir de `server/ai.ts`. */
export interface AiBar {
  label: string
  amount: number
  pct: number
  colorToken: string | null
}

/** Réponse de l'assistant : texte + barres optionnelles. Aucun champ exécutable. */
export interface AiReply {
  reply: string
  bars?: AiBar[]
}

/** Message du fil de conversation (front). `bars` n'existe que sur les réponses. */
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  bars?: AiBar[]
}

/** Message d'accueil seedé — porté du wireframe (screens-ai.jsx, D.chat[0]). */
export const GREETING: ChatMessage = {
  role: 'assistant',
  content:
    'Bonjour Aïcha. Vos revenus couvrent vos dépenses ce mois-ci, mais le budget Transport est déjà dépassé. Que souhaitez-vous savoir ?',
}

/** Suggestions de questions — 1:1 du wireframe (D.suggestions). */
export const SUGGESTIONS = [
  'Où part mon argent ce mois-ci ?',
  'Vais-je dépasser un budget ?',
  'Quel sera mon solde en fin de mois ?',
  'Comment atteindre mon objectif plus vite ?',
  'Quelles dépenses sont inhabituelles ?',
] as const

const ERROR_REPLY =
  'Désolé, je n’ai pas pu répondre pour le moment. Réessayez dans un instant.'

/**
 * État + logique du chat assistant (sous-bloc 1). Le fil vit en local (éphémère) ;
 * chaque envoi POST l'historique au format Anthropic à `/api/ai/chat` et ajoute la
 * réponse. SUGGESTION ONLY : on n'affiche que du texte (+ barres lecture seule).
 */
export function useAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING])
  const [input, setInput] = useState('')

  const send = useMutation({
    mutationFn: (history: { role: 'user' | 'assistant'; content: string }[]) =>
      apiMutate<AiReply>('/api/ai/chat', 'POST', { messages: history }),
  })

  const submit = (text: string) => {
    const q = text.trim()
    if (!q || send.isPending) return
    const next: ChatMessage[] = [...messages, { role: 'user', content: q }]
    setMessages(next)
    setInput('')
    const history = next.map(({ role, content }) => ({ role, content }))
    send.mutate(history, {
      onSuccess: (data) =>
        setMessages((m) => [...m, { role: 'assistant', content: data.reply, bars: data.bars }]),
      onError: () => setMessages((m) => [...m, { role: 'assistant', content: ERROR_REPLY }]),
    })
  }

  /** « Nouvelle conversation » → repart du seul message d'accueil. */
  const reset = () => {
    setMessages([GREETING])
    setInput('')
  }

  return { messages, input, setInput, submit, reset, isPending: send.isPending }
}

export type AssistantState = ReturnType<typeof useAssistant>
