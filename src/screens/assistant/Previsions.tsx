import { Icon, ProjectionBars } from '../../components/primitives'
import { Card } from '../../components/ui'
import { EmptyState } from '../../components/states'
import { useSetPageTitle } from '../../components/shell/pageTitle'
import { money } from '../../lib/money'
import { AiTabs } from './AiTabs'
import { useForecasts, type ForecastsResult, type BudgetRisk } from './useAiModule'
import styles from './aiModule.module.css'

function Skeleton() {
  return (
    <div className={styles.skeleton} aria-hidden="true">
      <div className={styles.skelCard} />
      <div className={`${styles.skelCard} ${styles.skelTall}`} />
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
        <div>Impossible de charger les prévisions.</div>
        <button type="button" className="btn primary" onClick={onRetry}>
          Réessayer
        </button>
      </Card>
    </div>
  )
}

/** Onglet « Prévisions » (module IA). PRÉVISION §1.6 : chaque solde projeté est une
 *  ESTIMATION encadrée (horizon + confiance + base). Aucun bouton n'exécute d'action. */
export function Previsions() {
  const query = useForecasts()
  useSetPageTitle('Prévisions')

  return (
    <>
      <h1 className={styles.srOnly}>Prévisions — IA</h1>
      <div className={styles.col}>
        <div>
          <div className="t-eyebrow">IA · prévisions</div>
          <div className={styles.pageTitle}>Prévisions</div>
        </div>
        <AiTabs active="Prévisions" />
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

function Content({ data }: { data: ForecastsResult }) {
  // Pas assez d'historique → estimation indisponible (état honnête, §1.6).
  if (!data.available) {
    return (
      <Card className={`r ${styles.framingCard}`}>
        <div className={`ai-av ${styles.aiAv}`}>C</div>
        <div className={styles.framingText}>
          <span className={`insight-tag ${styles.tagNeutral}`}>Estimation</span>
          {data.framing}
        </div>
      </Card>
    )
  }

  return (
    <>
      {/* 3 soldes projetés (KPI) — estimations encadrées par le bandeau plus bas. */}
      <div className={styles.kpiGrid}>
        {data.points.map((p) => {
          const up = p.delta >= 0
          return (
            <Card key={p.label}>
              <div className="kpi-label">{p.label}</div>
              <div className={`kpi-val ${styles.kpiVal}`}>
                {money(p.amount)} <span className="kpi-cur">FCFA</span>
              </div>
              <div className={`delta ${up ? 't-pos' : 't-neg'} ${styles.delta}`}>
                <Icon name={up ? 'up' : 'down'} size={13} /> {up ? '+' : '−'}
                {money(Math.abs(p.delta))} vs aujourd’hui
              </div>
            </Card>
          )
        })}
      </div>

      {/* Solde projeté (graphe) + cadrage §1.6 : horizon + confiance + base. */}
      <Card>
        <div className="card-head">
          <div>
            <div className="card-title">Solde projeté</div>
            <div className={`t-faint ${styles.sub}`}>
              Horizon : {data.horizon} · confiance {data.confidence}
            </div>
          </div>
          <div className={`r ${styles.legend}`}>
            <span className="r">
              <i className={styles.swatchInk} /> Réalisé
            </span>
            <span className="r">
              <i className={styles.swatchAccent} /> Prévision
            </span>
          </div>
        </div>
        <ProjectionBars
          labels={data.series.labels}
          values={data.series.values}
          realizedCount={data.realizedCount}
        />
        <div className={`t-faint ${styles.framing}`}>{data.framing}</div>
      </Card>

      {/* Risque de dépassement par budget — projeté via la tendance RÉELLE des dépenses. */}
      <Card pad={false}>
        <div className={`wf-pad ${styles.tableHead}`}>
          <div className="card-title">Risque de dépassement par budget</div>
        </div>
        {data.budgetRisks.length === 0 ? (
          <EmptyState
            icon="gauge"
            title="Aucun budget à projeter"
            text="Créez des budgets pour estimer leur risque de dépassement."
          />
        ) : (
          <div className={styles.tableWrap}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Budget</th>
                  <th className="num">Consommé</th>
                  <th className="num">Projeté fin de mois</th>
                  <th className="num">Risque</th>
                </tr>
              </thead>
              <tbody>
                {data.budgetRisks.map((b) => (
                  <BudgetRiskRow key={b.name} b={b} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}

function BudgetRiskRow({ b }: { b: BudgetRisk }) {
  const label = b.risk === 'over' ? 'Dépassement' : b.risk === 'warn' ? 'À surveiller' : 'OK'
  return (
    <tr>
      <td className={styles.budgetName}>{b.name}</td>
      <td className="num t-mono t-muted">{b.consumedPct} %</td>
      <td className={`num t-mono ${styles.projPct}`}>{b.projectedPct} %</td>
      <td className="num">
        <span className={`badge ${b.risk}`}>{label}</span>
      </td>
    </tr>
  )
}
