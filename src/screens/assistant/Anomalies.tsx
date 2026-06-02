import { Link } from 'react-router-dom'
import { Icon } from '../../components/primitives'
import { Card } from '../../components/ui'
import { EmptyState } from '../../components/states'
import { useSetPageTitle } from '../../components/shell/pageTitle'
import { money } from '../../lib/money'
import { AiTabs } from './AiTabs'
import { useAnomalies, type AnomaliesResult, type Anomaly } from './useAiModule'
import styles from './aiModule.module.css'

function Skeleton() {
  return (
    <div className={styles.skeleton} aria-hidden="true">
      <div className={`${styles.skelCard} ${styles.skelTall}`} />
      <div className={styles.skelCard} />
    </div>
  )
}

function ErrorCard({ onRetry }: { onRetry: () => void }) {
  return (
    <div className={styles.centerState}>
      <Card className={styles.skeleton}>
        <div className="r">
          <Icon name="alert" size={20} className="t-neg" />
        </div>
        <div>Impossible de charger les anomalies.</div>
        <button type="button" className="btn primary" onClick={onRetry}>
          Réessayer
        </button>
      </Card>
    </div>
  )
}

/** Onglet « Anomalies » (module IA). §1.6 : chaque anomalie est EXPLIQUÉE par
 *  comparaison à l'historique de sa catégorie ; aucune anomalie inventée (liste vide →
 *  « rien à signaler »). Liens « Examiner » = navigation, jamais d'action. */
export function Anomalies() {
  const query = useAnomalies()
  useSetPageTitle('Anomalies')

  return (
    <>
      <h1 className={styles.srOnly}>Anomalies & alertes — IA</h1>
      <div className={styles.col}>
        <div>
          <div className="t-eyebrow">IA · détection</div>
          <div className={styles.pageTitle}>Anomalies &amp; alertes</div>
        </div>
        <AiTabs active="Anomalies" />
        {query.isPending ? (
          <Skeleton />
        ) : query.isError || !query.data ? (
          <ErrorCard onRetry={() => void query.refetch()} />
        ) : (
          <Content data={query.data} />
        )}
      </div>
    </>
  )
}

function Content({ data }: { data: AnomaliesResult }) {
  const { anomalies, recurring, summary } = data
  return (
    <>
      <Card>
        <div className="card-head">
          <div className="card-title">Dépenses inhabituelles</div>
          <span className={`t-faint ${styles.headCount}`}>
            {anomalies.length} détectée{anomalies.length > 1 ? 's' : ''} ce mois-ci
          </span>
        </div>
        {anomalies.length === 0 ? (
          <EmptyState icon="check" title="Rien à signaler" text={summary} />
        ) : (
          <>
            <div className={`t-faint ${styles.summary}`}>{summary}</div>
            <div className={styles.alertList}>
              {anomalies.map((a) => (
                <AnomalyRow key={a.id} a={a} />
              ))}
            </div>
          </>
        )}
      </Card>

      <Card>
        <div className="card-head">
          <div className="card-title">Paiements récurrents détectés</div>
          <Link to="/budgets" className="card-link">
            Créer des budgets <Icon name="chevron" size={13} />
          </Link>
        </div>
        {recurring.length === 0 ? (
          <EmptyState
            icon="repeat"
            title="Aucun paiement récurrent"
            text="Les paiements marqués récurrents apparaîtront ici."
          />
        ) : (
          <div>
            {recurring.map((r, i) => (
              <div className="row-line" key={i}>
                <div className="row-ico">
                  <Icon name="repeat" size={16} />
                </div>
                <div className={styles.recText}>
                  <div className={styles.recName}>{r.name}</div>
                  <div className={`t-faint ${styles.recMeta}`}>{r.category} · récurrent</div>
                </div>
                <span className={`row-amt ${styles.recAmt}`}>{money(r.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  )
}

function AnomalyRow({ a }: { a: Anomaly }) {
  const tone = a.level === 'Élevé' ? 'over' : 'warn'
  return (
    <div className={`alert ${tone} ${styles.alertItem}`}>
      <i className="swatch" />
      <div className={`row-ico ${tone === 'over' ? styles.icoNeg : styles.icoWarn}`}>
        <Icon name="alert" size={18} />
      </div>
      <div className={styles.alertBody}>
        <div className={`r ${styles.alertHead}`}>
          <span className={styles.alertName}>{a.name}</span>
          <span className="tag-cat">{a.category}</span>
          <span className={`t-faint ${styles.alertWhen}`}>{a.when}</span>
        </div>
        <div className={`t-muted ${styles.alertReason}`}>{a.reason}</div>
      </div>
      <div className={`c ${styles.alertRight}`}>
        <span className={`row-amt t-neg ${styles.alertAmt}`}>{money(a.amount)}</span>
        {/* « Examiner » = NAVIGATION vers les opérations de la catégorie (jamais d'action). */}
        <Link to={a.href} className="btn">
          Examiner
        </Link>
      </div>
    </div>
  )
}
