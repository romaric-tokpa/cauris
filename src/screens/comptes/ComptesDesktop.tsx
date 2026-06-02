import { Link } from 'react-router-dom'
import { Icon, Spark, type IconName } from '../../components/primitives'
import { Card, Badge, Tag } from '../../components/ui'
import { EmptyState } from '../../components/states'
import { money } from '../../lib/money'
import { maskedBalance } from '../../lib/account'
import type { AccountRow, ComptesResponse } from './useComptes'
import { TABS, filterByTab } from './tabs'
import styles from './comptes.module.css'

const accIcon = (a: AccountRow): IconName =>
  a.blocked ? 'lock' : a.type === 'Épargne' ? 'target' : 'wallet'
const accIcoClass = (a: AccountRow): string =>
  a.blocked ? styles.accIcoBlocked : a.type === 'Mobile money' ? styles.accIcoMobile : ''

interface Props {
  data: ComptesResponse
  tab: string
  setTab: (t: string) => void
  className?: string
}

/** Liste comptes desktop — portée 1:1 de ComptesDesk (screens-comptes.jsx). */
export function ComptesDesktop({ data, tab, setTab, className = '' }: Props) {
  const { accounts, patrimoineTotal, patrimoineSpark } = data
  const visible = filterByTab(accounts, tab)
  const actifs = accounts.filter((a) => !a.blocked).length
  const bloques = accounts.filter((a) => a.blocked).length

  return (
    <div className={className}>
      {/* title row */}
      <div className="r between">
        <div>
          <div className="t-eyebrow">
            {actifs} comptes actifs · {bloques} bloqué
          </div>
          <div className={styles.pageTitle}>Comptes</div>
        </div>
        {/* Création de compte = à venir. */}
        <button type="button" className={`btn primary ${styles.soon}`} disabled title="Bientôt disponible">
          <Icon name="plus" size={16} /> Ajouter un compte
        </button>
      </div>

      {/* tabs */}
      <div className="subnav">
        {TABS.map((t) => (
          <span
            key={t}
            className={'si' + (tab === t ? ' on' : '')}
            role="button"
            tabIndex={0}
            onClick={() => setTab(t)}
            onKeyDown={(e) => e.key === 'Enter' && setTab(t)}
          >
            {t}
          </span>
        ))}
      </div>

      {/* patrimoine total + Spark (tendance = épargne cumulée) */}
      <Card className="r between">
        <div>
          <div className={`t-faint ${styles.patLabel}`}>Patrimoine total</div>
          <div className={`kpi-val ${styles.patVal}`}>
            {money(patrimoineTotal)} <span className="kpi-cur">FCFA</span>
          </div>
        </div>
        <div className="c">
          <Spark pts={patrimoineSpark} w={220} h={50} />
          {/* la courbe illustre la TENDANCE (épargne cumulée), pas les soldes absolus */}
          <span className={`t-faint ${styles.patSub}`}>épargne cumulée · 6 mois</span>
        </div>
      </Card>

      {/* grille de comptes */}
      {visible.length === 0 ? (
        <EmptyState icon="wallet" title="Aucun compte" text="Aucun compte dans ce filtre." />
      ) : (
        <div className={styles.grid}>
          {visible.map((c) => (
            <Card key={c.id} className={c.blocked ? styles.cardBlocked : ''}>
              <div className={`r between ${styles.accHead}`}>
                <div className={`r ${styles.g12} ${c.blocked ? styles.dim : ''}`}>
                  <div className={`row-ico ${styles.accIco} ${accIcoClass(c)}`}>
                    <Icon name={accIcon(c)} size={20} />
                  </div>
                  <div>
                    <div className={styles.accName}>{c.name}</div>
                    <div className={`t-faint ${styles.accBank}`}>
                      {c.bank} · {c.accountNumber}
                    </div>
                  </div>
                </div>
                <div className={`r ${styles.accTags}`}>
                  {c.blocked ? <Badge tone="over">Bloqué</Badge> : <Tag>{c.type}</Tag>}
                  {/* Blocage/déblocage = à venir. */}
                  <button
                    type="button"
                    className={`icon-btn ${styles.iconBtnSm} ${styles.soon}`}
                    disabled
                    title={c.blocked ? 'Débloquer' : 'Bloquer le compte'}
                  >
                    <Icon name={c.blocked ? 'unlock' : 'lock'} size={16} />
                  </button>
                </div>
              </div>

              <div className={`r between ${styles.accBottom} ${c.blocked ? styles.dim : ''}`}>
                <div>
                  <div className={`t-faint ${styles.soldeLabel}`}>Solde</div>
                  <div className={`kpi-val ${styles.soldeVal}`}>
                    {maskedBalance(c.balance, c.blocked)} <span className="kpi-cur">FCFA</span>
                  </div>
                </div>
                {c.blocked ? (
                  <span className={`card-link ${styles.soon}`}>
                    Débloquer <Icon name="unlock" size={13} />
                  </span>
                ) : (
                  <Link to={`/comptes/${c.id}`} className="card-link">
                    Voir les opérations <Icon name="chevron" size={13} />
                  </Link>
                )}
              </div>

              {c.blocked && (
                <div className={`r t-neg ${styles.blockedFoot}`}>
                  <Icon name="lock" size={13} /> Paiements et retraits suspendus
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
