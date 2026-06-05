import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../../lib/api'
import { computeCoachAnswer, type CoachContext, type Scenario } from '../../lib/coachAssembly'

/** Contexte brut du coach (assemblé serveur, calculé client). */
export function useCoachContext() {
  return useQuery({
    queryKey: ['coach-context'],
    queryFn: () => apiFetch<CoachContext>('/api/coach/context'),
  })
}

export interface CoachQuestion {
  scenario: Scenario
  /** Montant X pour `afford` (ignoré pour `survive`). */
  amount: number
}

/**
 * État de l'écran Coach : question (liste FERMÉE — survive / afford+montant) + réponse
 * dérivée du contexte par les libs déterministes (C1→C2→C3 via `computeCoachAnswer`).
 * Aucun parseur libre : la question est choisie, pas interprétée.
 */
export function useCoach() {
  const ctx = useCoachContext()
  const [question, setQuestion] = useState<CoachQuestion>({ scenario: 'survive', amount: 50_000 })

  const answer = useMemo(
    () => (ctx.data ? computeCoachAnswer(ctx.data, question.scenario, question.amount) : null),
    [ctx.data, question.scenario, question.amount],
  )

  return { ctx, question, setQuestion, answer }
}
