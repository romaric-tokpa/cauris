import type { IconName } from '../../components/primitives'
import type { TxnRow } from './useTransactions'

/** Onglets de la sous-nav Transactions (1:1 du wireframe). « Récurrentes » bascule
 *  vers la vue ENTITÉ récurrences (table `recurrences`), pas un filtre de liste. */
export const TABS = [
  { label: 'Tous', value: '' },
  { label: 'Revenus', value: 'Revenu' },
  { label: 'Dépenses', value: 'Dépense' },
  { label: 'Transferts', value: 'Transfert' },
  { label: 'Récurrentes', value: 'Récurrente' },
] as const

/** Onglet « Récurrentes » actif → on rend la vue récurrences au lieu de la liste. */
export const RECURRENCES_TAB = 'Récurrente'

/** Icône de ligne : entrée (up) / transfert (exchange) / sortie (down). */
export function txnIcon(r: TxnRow): IconName {
  return r.amount > 0 ? 'up' : r.type === 'Transfert' ? 'exchange' : 'down'
}

/** Libellé du compte : « → destination » pour un transfert, sinon le compte source. */
export function accountLabel(r: TxnRow): string {
  return r.type === 'Transfert' && r.transferAccountName
    ? `→ ${r.transferAccountName}`
    : (r.accountName ?? '')
}
