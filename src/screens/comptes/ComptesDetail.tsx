import { Link, useParams } from 'react-router-dom'
import { Icon } from '../../components/primitives'
import { Card } from '../../components/ui'
import { EmptyState } from '../../components/states'
import { useSetPageTitle } from '../../components/shell/pageTitle'
import { money } from '../../lib/money'
import { maskedBalance } from '../../lib/account'
import { formatIsoDay } from '../../lib/date'
import { useAccount, type CompteDetailResponse } from './useComptes'
import styles from './comptes.module.css'

function Skeleton() {
  return (
    <div className={styles.skeleton} aria-hidden="true">
      <div className={styles.skelCard} />
      <div className={`${styles.skelCard} ${styles.skelTall}`} />
    </div>
  )
}

export function ComptesDetail() {
  const { id = '' } = useParams()
  const q = useAccount(id)

  if (q.isPending) return <Skeleton />
  if (q.isError || !q.data) {
    return (
      <div className={styles.centerState}>
        <Card className={styles.skeleton}>
          <div className="r">
            <Icon name="alert" size={20} className="t-neg" />
          </div>
          <div>Compte introuvable.</div>
          <Link to="/comptes" className="btn primary">
            Retour aux comptes
          </Link>
        </Card>
      </div>
    )
  }
  return <Detail data={q.data} />
}

function Detail({ data }: { data: CompteDetailResponse }) {
  const { account: a, recentTransactions } = data
  useSetPageTitle(a.name)
  const linkUrl = `/transactions?accountId=${a.id}`

  // Transfert / Opération / Blocage = à venir (lecture seule Phase 8).
  const actions = (
    <>
      <button type="button" className={`btn ${styles.soon}`} disabled title="Bientôt disponible">
        <Icon name="exchange" size={16} /> Transfert
      </button>
      <button type="button" className={`btn ${styles.soon}`} disabled title="Bientôt disponible">
        <Icon name="plus" size={16} /> Opération
      </button>
      <button type="button" className={`btn ${styles.soon}`} disabled title="Bientôt disponible">
        <Icon name={a.blocked ? 'unlock' : 'lock'} size={16} />{' '}
        {a.blocked ? 'Débloquer' : 'Bloquer le compte'}
      </button>
    </>
  )

  return (
    <>
      <h1 className={styles.srOnly}>{a.name}</h1>
      <div className={styles.detailCol}>
        <div className={styles.deskHead}>
          <div>
            <div className="t-eyebrow">
              {a.bank} · {a.accountNumber}
            </div>
            <div className={styles.pageTitle}>{a.name}</div>
          </div>
          <div className={`r ${styles.headActions}`}>{actions}</div>
        </div>
        <div className={styles.mobActions}>{actions}</div>

        {/* hero solde (masqué si bloqué — pas de Spark par compte : aucun historique) */}
        <Card className="feature-card">
          <div className={styles.heroLabel}>Solde disponible</div>
          <div className={`kpi-val ${styles.heroVal}`}>
            {maskedBalance(a.balance, a.blocked)} <span className="kpi-cur">FCFA</span>
          </div>
          {a.blocked && (
            <div className={`r ${styles.heroNote}`}>
              <Icon name="lock" size={13} /> Compte bloqué · paiements et retraits suspendus
            </div>
          )}
        </Card>

        {/* dernières opérations */}
        <Card pad="pad-sm">
          <div className={`card-head ${styles.opsHead}`}>
            <div className={`card-title ${styles.opsTitle}`}>Dernières opérations</div>
          </div>
          {recentTransactions.length === 0 ? (
            <EmptyState
              icon="inbox"
              title="Aucune opération"
              text="Aucune opération récente sur ce compte."
            />
          ) : (
            <div>
              {recentTransactions.map((t) => (
                <div className={`row-line ${styles.opRow}`} key={t.id}>
                  <div className={`row-ico ${styles.opIco}`}>
                    <Icon name={t.amount > 0 ? 'up' : 'down'} size={15} />
                  </div>
                  <div className={styles.opText}>
                    <div className={styles.opName}>{t.label}</div>
                    <div className={`t-faint ${styles.opMeta}`}>
                      {t.categoryName ?? '—'} · {formatIsoDay(t.occurredAt)}
                    </div>
                  </div>
                  <span className={`row-amt ${styles.opAmt}${t.amount > 0 ? ' t-pos' : ''}`}>
                    {t.amount > 0 ? '+' : ''}
                    {money(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Link to={linkUrl} className="btn primary block">
          Voir toutes les opérations
        </Link>
      </div>
    </>
  )
}
