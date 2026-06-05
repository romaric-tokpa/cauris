import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { apiMutate } from '../../lib/api'
import { computeCoachAnswer } from '../../lib/coachAssembly'
import { routeChatQuestion, EVALUABLE_QUESTIONS } from '../../lib/coachChat'
import { useCoachContext } from './useCoach'
import { GREETING, type AiBar, type AiReply } from './useAssistant'

/** Message du fil — peut porter un verdict coach (lien analyse) ou un repli à chips. */
export interface ChatMsg {
  role: 'user' | 'ai'
  content: string
  bars?: AiBar[]
  /** Vrai si la bulle EST un verdict du coach reformulé (C3) → lien « analyse complète ». */
  coach?: boolean
  /** Repli honnête : questions évaluables proposées. */
  chips?: readonly string[]
}

const GREET: ChatMsg = { role: 'ai', content: GREETING.content }
const UNKNOWN_REPLY =
  'Je ne sais pas encore répondre à cette question en version démo, et je préfère ne pas inventer. Je peux analyser :'
const ERROR_REPLY = 'Désolé, je n’ai pas pu répondre pour le moment. Réessayez dans un instant.'

/**
 * Chat assistant ROUTÉ (Lot D) — véracité : on ne simule jamais la compréhension.
 *  coach → verdict déterministe C3 · data → stub askClaude ancré · unknown → aveu honnête.
 */
export function useChat() {
  const ctxQ = useCoachContext()
  const [messages, setMessages] = useState<ChatMsg[]>([GREET])
  const [input, setInput] = useState('')

  const send = useMutation({
    mutationFn: (q: string) =>
      apiMutate<AiReply>('/api/ai/chat', 'POST', { messages: [{ role: 'user', content: q }] }),
  })

  const submit = (text: string) => {
    const q = text.trim()
    if (!q || send.isPending) return
    setMessages((m) => [...m, { role: 'user', content: q }])
    setInput('')

    const route = routeChatQuestion(q)

    // 1) Scénario coach → verdict déterministe reformulé (C3) en bulle.
    if (route.kind === 'coach' && ctxQ.data) {
      const a = computeCoachAnswer(ctxQ.data, route.scenario, route.amount)
      setMessages((m) => [...m, { role: 'ai', content: a.reformulation.layers[3].text, coach: true }])
      return
    }

    // 2) Donnée simple → stub askClaude existant (ancré aux vraies données). Le coach non
    //    encore prêt (contexte en chargement) retombe ici aussi.
    if (route.kind === 'data' || route.kind === 'coach') {
      send.mutate(q, {
        onSuccess: (data) => setMessages((m) => [...m, { role: 'ai', content: data.reply, bars: data.bars }]), // prettier-ignore
        onError: () => setMessages((m) => [...m, { role: 'ai', content: ERROR_REPLY }]),
      })
      return
    }

    // 3) Aucun match → aveu honnête + questions évaluables (dégradation gracieuse au chat).
    setMessages((m) => [...m, { role: 'ai', content: UNKNOWN_REPLY, chips: EVALUABLE_QUESTIONS }])
  }

  const reset = () => {
    setMessages([GREET])
    setInput('')
  }

  return { messages, input, setInput, submit, reset, isPending: send.isPending }
}
