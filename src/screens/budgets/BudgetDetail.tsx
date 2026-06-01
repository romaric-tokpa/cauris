import { Link, useParams } from 'react-router-dom'
import { Icon, Progress } from '../../components/primitives'
import { Card } from '../../components/ui'
import { EmptyState } from '../../components/states'
import { useSetPageTitle } from '../../components/shell/pageTitle'
import { money } from '../../lib/money'
import { formatIsoDay } from '../../lib/date'
import { useBudget, type BudgetDetailResponse } from './useBudgets'
import styles from './budgets.module.css'

function Skeleton() {
  return (
    <div className={styles.skeleton} aria-hidden="true">
      <div className={styles.skelCard} />
      <div className={styles.skelCard} />
      <div className={`${styles.skelCard} ${styles.skelTall}`} />
    </div>
  )
}

export function BudgetDetail() {
  const { id = '' } = useParams()
  const q = useBudget(id)

  if (q.isPending) return <Skeleton />
  if (q.isError || !q.data) {
    return (
      <div className={styles.centerState}>
        <Card className={styles.skeleton}>
          <div className="r">
            <Icon name="alert" size={20} className="t-neg" />
          </div>
          <div>Budget introuvable.</div>
          <Link to="/budgets" className="btn primary">
            Retour aux budgets
          </Link>
        </Card>
      </div>
    )
  }
  return <Detail data={q.data} />
}

function Detail({ data }: { data: BudgetDetailResponse }) {
  const { budget: b, categoryTotal, linkedTransactions } = data
  // Titre de l'app bar mobile (la route /budgets/:id n'est pas dans la nav).
  useSetPageTitle(b.categoryName)

  const ecart = b.ecart // spent - cap (enveloppe)
  const restantEnv = Math.max(0, b.cap - b.spent)
  const linkUrl = `/transactions?categoryId=${b.categoryId}&from=${b.period}-01&to=${b.period}-31`

  const actions = (
    <>
      {/* Ajustement du plafond = à venir (Phase ultérieure) — bouton honnête. */}
      <button type="button" className={`btn ${styles.soon}`} disabled title="Bientôt disponible">
        <Icon name="gear" size={16} /> Ajuster le plafond
      </button>
      <Link to={linkUrl} className="btn primary">
        <Icon name="exchange" size={16} /> Voir les transactions liées
      </Link>
    </>
  )

  return (
    <>
      <h1 className={styles.srOnly}>{b.categoryName}</h1>
      <div className={styles.detailCol}>
        {/* en-tête desktop */}
        <div className={styles.deskHead}>
          <div>
            <div className="t-eyebrow">Budget · Mai 2026</div>
            <div className={styles.pageTitle}>{b.categoryName}</div>
          </div>
          <div className={`r ${styles.headActions}`}>{actions}</div>
        </div>
        {/* actions mobile (l'app bar porte le titre) */}
        <div className={styles.mobActions}>{actions}</div>

        {/* bandeau d'alerte — conditionnel au ton (over = cas Transport) */}
        {b.tone === 'over' && (
          <div className="alert over">
            <i className="swatch" />
            <div className={`row-ico ${styles.alertIcoNeg}`}>
              <Icon name="gauge" size={18} />
            </div>
            <div>
              <div className={styles.alertTitle}>Plafond dépassé de {money(ecart)} FCFA</div>
              <div className={`t-muted ${styles.alertSub}`}>
                Vous êtes à {b.pct} % du budget, il reste 0 jour de marge.
              </div>
            </div>
          </div>
        )}
        {b.tone === 'warn' && (
          <div className="alert warn">
            <i className="swatch" />
            <div className={`row-ico ${styles.alertIcoWarn}`}>
              <Icon name="gauge" size={18} />
            </div>
            <div>
              <div className={styles.alertTitle}>Proche du plafond</div>
              <div className={`t-muted ${styles.alertSub}`}>
                Vous êtes à {b.pct} % de l’enveloppe {b.categoryName}.
              </div>
            </div>
          </div>
        )}

        {/* conseil IA — placeholder STATIQUE (vraie IA = Phase 12), cas dépassement */}
        {b.tone === 'over' && (
          <Card pad="pad-sm" className={`r ${styles.g12}`}>
            <div className={`ai-av ${styles.aiAv}`}>C</div>
            <div className={styles.aiText}>
              <span className={`insight-tag ${styles.aiTag}`}>Conseil</span>
              Réduire les courses Yango de 2 par semaine ramènerait ce budget sous son plafond avant
              la fin du mois.
            </div>
            <span className={`card-link ${styles.nowrap}`}>
              Voir comment <Icon name="chevron" size={13} />
            </span>
          </Card>
        )}

        {/* carte stats = ENVELOPPE (spent/cap) — INCHANGÉE (aucune mesure dérivée ici) */}
        <Card>
          <div className={styles.statRow}>
            <div className="stat">
              <div className="sl">Prévu</div>
              <div className="sv">{money(b.cap)}</div>
            </div>
            <div className={`stat ${styles.statDivider}`}>
              <div className="sl">Réalisé</div>
              <div className="sv">{money(b.spent)}</div>
            </div>
            <div className={`stat ${styles.statDivider}`}>
              <div className="sl">Écart</div>
              <div className={`sv ${ecart > 0 ? 't-neg' : ''}`}>
                {ecart > 0 ? '+' : ''}
                {money(ecart)}
              </div>
            </div>
            <div className={`stat ${styles.statDivider}`}>
              <div className="sl">Opérations</div>
              <div className="sv">{b.txnCount}</div>
            </div>
          </div>
          <Progress pct={b.pct} tone={b.tone} />
          <div className={`r between t-faint ${styles.progFoot}`}>
            <span>{money(restantEnv)} FCFA restant</span>
            <span>{b.pct} % consommé</span>
          </div>
        </Card>

        {/* transactions liées · {catégorie} — porte la distinction enveloppe ≠ catégorie */}
        <Card pad={false} className={styles.linkedCard}>
          <div className={styles.linkedHead}>
            <div className={`card-head ${styles.headFlush}`}>
              <div>
                <div className="card-title">Transactions liées · {b.categoryName}</div>
                {/* TOTAL réel de la catégorie (DÉRIVÉ) ≠ enveloppe budgétée (STOCKÉE) */}
                <div className={`t-faint ${styles.cardSub}`}>
                  Total {b.categoryName} ce mois :{' '}
                  <span className="t-mono">{money(categoryTotal)}</span> FCFA — la dépense totale de
                  la catégorie, distincte de l’enveloppe budgétée ({money(b.spent)} / {money(b.cap)}{' '}
                  FCFA).
                </div>
              </div>
              <Link to={linkUrl} className={`card-link ${styles.nowrap}`}>
                Tout filtrer dans Transactions <Icon name="chevron" size={13} />
              </Link>
            </div>
          </div>
          {linkedTransactions.length === 0 ? (
            <div className={styles.linkedHead}>
              <EmptyState
                icon="inbox"
                title="Aucune transaction liée"
                text="Aucune opération de cette catégorie sur le mois."
              />
            </div>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Libellé</th>
                  <th>Compte</th>
                  <th className="num">Montant</th>
                  <th className={styles.tdChevron} />
                </tr>
              </thead>
              <tbody>
                {linkedTransactions.map((t) => (
                  <tr key={t.id}>
                    <td className={`t-faint t-mono ${styles.tdDate}`}>
                      {formatIsoDay(t.occurredAt)}
                    </td>
                    <td className={styles.tdName}>{t.label}</td>
                    <td className="t-muted">{t.accountName}</td>
                    <td className={`num t-mono t-neg ${styles.tdAmount}`}>{money(t.amount)}</td>
                    <td className="num">
                      <Icon name="chevron" size={15} className="t-faint" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </>
  )
}
