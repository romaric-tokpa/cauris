import type { IconName } from '../../components/primitives'
import type { TxnRow } from './useTransactions'

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
