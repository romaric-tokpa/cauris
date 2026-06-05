import { useEffect, useState } from 'react'
import { useComptes, type AccountRow } from '../comptes/useComptes'

// Source unique du dérivé d'avatar (partagé avec le shell) — réexport pour les
// consommateurs existants des Paramètres.
export { initial } from '../../lib/userName'

/** Vrai sous le breakpoint shell (mobile) — choisit Drawer (desktop) vs BottomSheet. */
export function useIsMobile(): boolean {
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

/** Résumé des comptes bloqués (section Sécurité) — DÉRIVÉ de `/api/accounts`.
 *  Réutilise `useComptes` (renvoie déjà `blocked`) : aucun appel réseau supplémentaire. */
export interface BlockedSummary {
  count: number
  label: string // « 1 compte (Wave) » | « Aucun compte bloqué »
}

export function useBlockedAccounts(): { summary: BlockedSummary; isPending: boolean; isError: boolean } {
  const q = useComptes()
  const blocked: AccountRow[] = (q.data?.accounts ?? []).filter((a) => a.blocked)
  const count = blocked.length
  const label =
    count === 0
      ? 'Aucun compte bloqué'
      : `${count} compte${count > 1 ? 's' : ''} (${blocked.map((a) => a.name).join(', ')})`
  return { summary: { count, label }, isPending: q.isPending, isError: q.isError }
}
