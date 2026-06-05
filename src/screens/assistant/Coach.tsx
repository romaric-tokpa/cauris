import { Link } from 'react-router-dom'
import { Icon, Donut, Progress, type IconName } from '../../components/primitives'
import { Card } from '../../components/ui'
import { useSetPageTitle } from '../../components/shell/pageTitle'
import { MoneyInput } from '../onboarding/parts'
import type { Verdict } from '../../lib/coach'
import { COMPLETENESS_AXIS_LABELS, type CompletenessResult } from '../../lib/coachCompleteness'
import type { CoachReformulation, InterventionLevel } from '../../lib/coachReformulate'
import { AiTabs } from './AiTabs'
import { useCoach, type CoachQuestion } from './useCoach'
import type { CoachAnswer } from '../../lib/coachAssembly'
import styles from './assistant.module.css'

/* ── Tons & libellés dérivés du verdict (couleurs via tokens, jamais en dur) ── */
const VERDICT_TONE: Record<Verdict, { token: string; badge: 'ok' | 'warn' | 'over' }> = {
  ok: { token: 'pos', badge: 'ok' },
  ok_conditions: { token: 'pos', badge: 'ok' },
  risque: { token: 'warn', badge: 'warn' },
  deconseille: { token: 'neg', badge: 'over' },
  incoherent: { token: 'warn', badge: 'warn' },
}
const INTERVENTION_LABEL: Record<InterventionLevel, string> = {
  observation: 'Observation',
  alerte: 'Alerte douce',
  recommandation: 'Recommandation',
  opposition: 'Opposition explicite',
}
const QUESTION_TEXT: Record<CoachQuestion['scenario'], string> = {
  survive: 'Est-ce que je tiens jusqu’à la fin du mois ?',
  afford: 'Puis-je m’offrir cette dépense ce mois-ci ?',
}

type DeficitKey = keyof typeof COMPLETENESS_AXIS_LABELS
const DEFICIT_ICON: Record<DeficitKey, IconName> = {
  comptes: 'wallet',
  historique: 'analytics',
  chargesFixes: 'repeat',
  cash: 'cash',
  budgets: 'gauge',
  objectifs: 'target',
}
/** Action de fiabilisation → écran réel (anti-bouton-mort : null = informatif, non cliquable). */
function deficitHref(key: DeficitKey, cashAccountId: string | null): string | null {
  switch (key) {
    case 'cash':
      return cashAccountId ? `/comptes/${cashAccountId}/enveloppe` : null
    case 'chargesFixes':
      return '/transactions?type=Récurrente'
    case 'budgets':
      return '/budgets'
    case 'objectifs':
      return '/objectifs'
    case 'comptes':
      return '/comptes'
    case 'historique':
      return null
  }
}

export function Coach() {
  useSetPageTitle('Assistant')
  const { ctx, question, setQuestion, answer } = useCoach()

  return (
    <>
      <h1 className={styles.srOnly}>Avis du coach</h1>
      <div className={`r between ${styles.coachHead}`}>
        <div>
          <div className="t-eyebrow">IA · analyse transparente</div>
          <div className={styles.pageTitle}>Avis du coach</div>
        </div>
      </div>
      <AiTabs active="Assistant" />
      <QuestionBar question={question} setQuestion={setQuestion} />

      {ctx.isPending ? (
        <div className={styles.coachSkeleton} aria-hidden="true">
          <div className={styles.skelCard} />
          <div className={styles.skelCard} />
        </div>
      ) : ctx.isError || !answer ? (
        <Card className={`r ${styles.coachError}`}>
          <Icon name="alert" size={18} className="t-neg" />
          <span>Impossible de charger l’analyse du coach.</span>
          <button type="button" className="btn primary" onClick={() => void ctx.refetch()}>
            Réessayer
          </button>
        </Card>
      ) : (
        <Answer answer={answer} scenario={question.scenario} />
      )}
    </>
  )
}

function QuestionBar({
  question,
  setQuestion,
}: {
  question: CoachQuestion
  setQuestion: (q: CoachQuestion) => void
}) {
  return (
    <Card pad="pad-sm" className={styles.qbar}>
      <span className="lbl">Votre question</span>
      <div className={styles.qChoices} role="group" aria-label="Question">
        <button
          type="button"
          className={`choice ${styles.qChoice}${question.scenario === 'survive' ? ' on' : ''}`}
          aria-pressed={question.scenario === 'survive'}
          onClick={() => setQuestion({ ...question, scenario: 'survive' })}
        >
          {QUESTION_TEXT.survive}
        </button>
        <button
          type="button"
          className={`choice ${styles.qChoice}${question.scenario === 'afford' ? ' on' : ''}`}
          aria-pressed={question.scenario === 'afford'}
          onClick={() => setQuestion({ ...question, scenario: 'afford' })}
        >
          Puis-je dépenser un montant ?
        </button>
      </div>
      {question.scenario === 'afford' && (
        <MoneyInput
          label="Montant envisagé"
          value={question.amount}
          onChange={(v) => setQuestion({ ...question, amount: v })}
        />
      )}
    </Card>
  )
}

function Answer({ answer, scenario }: { answer: CoachAnswer; scenario: CoachQuestion['scenario'] }) {
  const { reformulation: r, completeness, verdict, cashAccountId } = answer
  return (
    <div className={styles.coachGrid}>
      <div className={styles.coachMain}>
        {/* écho de la question */}
        <Card className={`r ${styles.qEcho}`}>
          <div className="avatar sm">A</div>
          <div>
            <div className="t-faint">Votre question</div>
            <div className={styles.qEchoText}>{QUESTION_TEXT[scenario]}</div>
          </div>
        </Card>

        {/* réponse en 4 couches */}
        <Card>
          <div className={`r between ${styles.fourHead}`}>
            <div className="r">
              <div className="ai-av">C</div>
              <div>
                <div className={styles.fourTitle}>Réponse en 4 couches</div>
                <div className="t-faint">{r.deterministicLabel}</div>
              </div>
            </div>
            <span className={`r ${styles.transparence}`}>
              <Icon name="eye" size={15} className="t-faint" /> Transparence
            </span>
          </div>

          <LayerStack r={r} verdict={verdict.verdict} />

          <div className={styles.optionsBlock}>
            <div className={styles.layerK}>Options proposées</div>
            <div className={`r ${styles.optionChips}`}>
              {r.options.map((o, i) => (
                <span key={o} className={`chip${i === 0 ? ' on' : ''}`}>
                  {o}
                </span>
              ))}
            </div>
          </div>
        </Card>

        {/* dégradation : actions de fiabilisation cliquables */}
        {r.degraded && (
          <Reliability actions={r.reliabilityActions} cashAccountId={cashAccountId} />
        )}
      </div>

      <div className={styles.coachRail}>
        <Completeness completeness={completeness} />
        <Intervention level={r.interventionLevel} />
        <Maturity confidence={r.confidence} />
        <Card className={`r ${styles.tonCard}`}>
          <div className={`row-ico ${styles.tonIco}`}>
            <Icon name="shield" size={18} />
          </div>
          <div>
            <div className={styles.tonTitle}>Ton non moralisateur</div>
            <div className={`t-muted ${styles.tonText}`}>
              Le coach explique l’impact et propose des arbitrages — il ne culpabilise pas et ne
              ressort pas vos choix passés.
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

function LayerStack({ r, verdict }: { r: CoachReformulation; verdict: Verdict }) {
  const tone = VERDICT_TONE[verdict]
  return (
    <div className={styles.layers}>
      <PlainLayer n={1} title={r.layers[0].title} text={r.layers[0].text} />
      <PlainLayer n={2} title={r.layers[1].title} text={r.layers[1].text} />

      {/* couche 3 — confiance */}
      <div className={styles.layer}>
        <div className={styles.ln}>3</div>
        <div className={styles.layerBody}>
          <div className={styles.layerK}>{r.layers[2].title}</div>
          <div className={`r ${styles.confRow}`}>
            <span className={styles.confbar}>
              <Progress pct={r.confidencePct} colorToken={tone.token} />
            </span>
            <span className={`t-mono ${styles.confPct}`}>{r.confidencePct}%</span>
          </div>
          <div className={`t-faint ${styles.layerText}`}>{r.layers[2].text}</div>
        </div>
      </div>

      {/* couche 4 — recommandation */}
      <div className={styles.layer}>
        <div className={`${styles.ln} ${styles.lnReco}`}>
          <Icon name="target" size={15} />
        </div>
        <div className={styles.layerBody}>
          <div className="r between">
            <div className={styles.layerK}>{r.layers[3].title}</div>
            <span className={`badge ${tone.badge}`}>{INTERVENTION_LABEL[r.interventionLevel]}</span>
          </div>
          <div className={styles.layerReco}>{r.layers[3].text}</div>
        </div>
      </div>
    </div>
  )
}

function PlainLayer({ n, title, text }: { n: number; title: string; text: string }) {
  return (
    <div className={styles.layer}>
      <div className={styles.ln}>{n}</div>
      <div className={styles.layerBody}>
        <div className={styles.layerK}>{title}</div>
        <div className={styles.layerText}>{text}</div>
      </div>
    </div>
  )
}

function Completeness({ completeness }: { completeness: CompletenessResult }) {
  const missing = new Set(completeness.deficits.map((d) => d.key))
  const keys = Object.keys(COMPLETENESS_AXIS_LABELS) as DeficitKey[]
  return (
    <Card>
      <div className={`card-head ${styles.complHead}`}>
        <div className="card-title">Complétude des données</div>
        <span className="t-faint">requis avant conseil</span>
      </div>
      <div className={`r ${styles.complRow}`}>
        <Donut
          size={96}
          segments={[{ v: completeness.score, color: 'var(--pos)' }]}
          label={`${completeness.score}%`}
          sub="complet"
          valSize={16}
        />
        <div className={styles.complList}>
          {keys.map((k) => {
            const ok = !missing.has(k)
            return (
              <div className={`r between ${styles.complItem}`} key={k}>
                <span className={`r ${styles.complLeft}`}>
                  <span className={`${styles.complDot} ${ok ? styles.complOk : styles.complWarn}`}>
                    <Icon name={ok ? 'check' : 'alert'} size={10} />
                  </span>
                  {COMPLETENESS_AXIS_LABELS[k]}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}

const LEVELS: { key: InterventionLevel; l: string; sub: string; tone: string; ic: IconName }[] = [
  { key: 'observation', l: 'Observation', sub: 'Information factuelle, sans recommandation.', tone: 'none', ic: 'eye' }, // prettier-ignore
  { key: 'alerte', l: 'Alerte douce', sub: 'Signal faible ou dérive naissante.', tone: 'warn', ic: 'bell' },
  { key: 'recommandation', l: 'Recommandation', sub: 'Arbitrage conseillé, avec justification.', tone: 'ok', ic: 'target' }, // prettier-ignore
  { key: 'opposition', l: 'Opposition explicite', sub: 'Rare · fort enjeu · confiance élevée.', tone: 'over', ic: 'alert' }, // prettier-ignore
]
function Intervention({ level }: { level: InterventionLevel }) {
  return (
    <Card>
      <div className="card-title">Niveau d’intervention</div>
      <div className={`t-faint ${styles.interSub}`}>La contradiction forte reste rare et calibrée.</div>
      <div className={styles.levels}>
        {LEVELS.map((lv) => {
          const active = lv.key === level
          return (
            <div className={`r ${styles.levelRow}${active ? '' : ' ' + styles.levelDim}`} key={lv.key}>
              <div className={`row-ico ${styles[`lvl_${lv.tone}`]}`}>
                <Icon name={lv.ic} size={15} />
              </div>
              <div className={styles.levelBody}>
                <div className={`${styles.levelL}${active ? ' ' + styles.levelLActive : ''}`}>{lv.l}</div>
                <div className="t-faint">{lv.sub}</div>
              </div>
              {active && <span className="badge ok">Actuel</span>}
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function Maturity({ confidence }: { confidence: 'high' | 'med' | 'low' }) {
  const level = confidence === 'high' ? 3 : confidence === 'med' ? 2 : 1
  const labels = ['Débutant', 'En apprentissage', 'Fiable']
  return (
    <Card>
      <div className="card-title">Maturité du coach</div>
      <div className={`t-faint ${styles.matSub}`}>Sa fiabilité augmente avec vos données.</div>
      <div className={styles.mat}>
        {labels.map((l, i) => (
          <i key={l} className={`${styles.matBar}${i < level ? ' ' + styles.matBarOn : ''}`} />
        ))}
      </div>
      <div className="r between">
        {labels.map((l, i) => (
          <span key={l} className={i === level - 1 ? styles.matCur : styles.matLbl}>
            {l}
          </span>
        ))}
      </div>
    </Card>
  )
}

function Reliability({
  actions,
  cashAccountId,
}: {
  actions: CompletenessResult['deficits']
  cashAccountId: string | null
}) {
  return (
    <Card>
      <div className="t-eyebrow">Pour fiabiliser l’analyse</div>
      <div className={styles.reliabList}>
        {actions.map((a) => {
          const href = deficitHref(a.key, cashAccountId)
          const inner = (
            <>
              <div className={`row-ico ${styles.reliabIco}`}>
                <Icon name={DEFICIT_ICON[a.key]} size={17} />
              </div>
              <div className={styles.reliabText}>
                <div className={styles.reliabTitle}>{a.action}</div>
                <div className="t-faint">{a.label}</div>
              </div>
              {href && <Icon name="chevron" size={15} className="t-faint" />}
            </>
          )
          return href ? (
            <Link key={a.key} to={href} className={`r ${styles.reliabTile}`}>
              {inner}
            </Link>
          ) : (
            <div key={a.key} className={`r ${styles.reliabTile} ${styles.reliabStatic}`}>
              {inner}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
