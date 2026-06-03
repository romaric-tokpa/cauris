import { Link } from 'react-router-dom'
import { Icon, Spark } from '../../components/primitives'
import { Card, Badge, Tag } from '../../components/ui'
import { EmptyState } from '../../components/states'
import { money } from '../../lib/money'
import { maskedBalance } from '../../lib/account'
import type { AccountRow, ComptesResponse } from './useComptes'
import { TABS, filterByTab } from './tabs'
import styles from './comptes.module.css'

const accIcon = (a: AccountRow) =>
  a.blocked ? 'lock' : a.type === 'Épargne' ? 'target' : 'wallet'
const accIcoClass = (a: AccountRow): string =>
  a.blocked ? styles.accIcoBlocked : a.type === 'Mobile money' ? styles.accIcoMobile : ''

interface Props {
  data: ComptesResponse
  tab: string
  setTab: (t: string) => void
  onAdd: () => void
  className?: string
}

/** Liste comptes mobile — EXTRAPOLÉE sobrement de la carte desktop (le wireframe
 *  n'a pas de liste mobile des comptes). Mêmes onglets, cartes empilées. */
export function ComptesMobile({ data, tab, setTab, onAdd, className = '' }: Props) {
  const { accounts, patrimoineTotal, patrimoineSpark } = data
  const visible = filterByTab(accounts, tab)

  const card = (c: AccountRow) => (
    <Card pad="pad-sm" className={c.blocked ? styles.cardBlocked : ''}>
      <div className={`r between ${styles.mobHead} ${c.blocked ? styles.dim : ''}`}>
        <div className={`r ${styles.g10}`}>
          <div className={`row-ico ${styles.mobIco} ${accIcoClass(c)}`}>
            <Icon name={accIcon(c)} size={17} />
          </div>
          <div>
            <div className={styles.accName}>{c.name}</div>
            <div className={`t-faint ${styles.accBank}`}>
              {c.bank} · {c.accountNumber}
            </div>
          </div>
        </div>
        {c.blocked ? <Badge tone="over">Bloqué</Badge> : <Tag>{c.type}</Tag>}
      </div>
      <div className={`r between ${c.blocked ? styles.dim : ''}`}>
        <span className={`t-faint ${styles.soldeLabel}`}>Solde</span>
        <span className={`t-mono ${styles.opAmt}`}>
          {maskedBalance(c.balance, c.blocked)} FCFA
        </span>
      </div>
      {c.blocked && (
        <div className={`r t-neg ${styles.blockedFoot}`}>
          <Icon name="lock" size={13} /> Paiements et retraits suspendus
        </div>
      )}
    </Card>
  )

  return (
    <div className={className}>
      <div className={`r ${styles.chips}`}>
        {TABS.map((t) => (
          <span
            key={t}
            className={`chip ${styles.chipSm}` + (tab === t ? ' on' : '')}
            role="button"
            aria-pressed={tab === t}
            tabIndex={0}
            onClick={() => setTab(t)}
            onKeyDown={(e) => e.key === 'Enter' && setTab(t)}
          >
            {t}
          </span>
        ))}
      </div>

      <Card pad="pad-sm">
        <div className={`t-faint ${styles.patLabel}`}>Patrimoine total</div>
        <div className={`kpi-val ${styles.patVal}`}>
          {money(patrimoineTotal)} <span className="kpi-cur">FCFA</span>
        </div>
        <Spark pts={patrimoineSpark} w={320} h={40} />
        <span className={`t-faint ${styles.patSub}`}>épargne cumulée · 6 mois</span>
      </Card>

      <button type="button" className="btn primary block" onClick={onAdd}>
        <Icon name="plus" size={16} /> Ajouter un compte
      </button>

      {visible.length === 0 ? (
        <EmptyState icon="wallet" title="Aucun compte" text="Aucun compte dans ce filtre." />
      ) : (
        <div className={styles.list}>
          {visible.map((c) =>
            c.blocked ? (
              <div key={c.id}>{card(c)}</div>
            ) : (
              <Link to={`/comptes/${c.id}`} className="card-link-reset" key={c.id}>
                {card(c)}
              </Link>
            ),
          )}
        </div>
      )}
    </div>
  )
}
