import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Icon, Donut, Progress } from '../../components/primitives'
import { Card, Drawer, BottomSheet } from '../../components/ui'
import { EmptyState } from '../../components/states'
import { useSetPageTitle } from '../../components/shell/pageTitle'
import { money } from '../../lib/money'
import { formatIsoDay, formatIsoMonthYear } from '../../lib/date'
import { useAccounts, type AccountRef } from '../transactions/useTransactions'
import { ContributionForm } from './ContributionForm'
import { GoalForm } from './GoalForm'
import { useGoal, useGoalProjection, type GoalDetailResponse } from './useObjectifs'
import styles from './objectifs.module.css'

/** Vrai sous le breakpoint shell (mobile) — choisit Drawer vs BottomSheet. */
function useIsMobile(): boolean {
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

function Skeleton() {
  return (
    <div className={styles.skeleton} aria-hidden="true">
      <div className={styles.skelCard} />
      <div className={`${styles.skelCard} ${styles.skelTall}`} />
    </div>
  )
}

export function ObjectifDetail() {
  const { id = '' } = useParams()
  const q = useGoal(id)
  const accountsQ = useAccounts()

  if (q.isPending) return <Skeleton />
  if (q.isError || !q.data) {
    return (
      <div className={styles.centerState}>
        <Card className={styles.skeleton}>
          <div className="r">
            <Icon name="alert" size={20} className="t-neg" />
          </div>
          <div>Objectif introuvable.</div>
          <Link to="/objectifs" className="btn primary">
            Retour aux objectifs
          </Link>
        </Card>
      </div>
    )
  }
  return <Detail data={q.data} accounts={accountsQ.data ?? []} />
}

function Detail({ data, accounts }: { data: GoalDetailResponse; accounts: AccountRef[] }) {
  const { goal: g, contributions } = data
  const isMobile = useIsMobile()
  const [formOpen, setFormOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  useSetPageTitle(g.name)

  // « Contribution moyenne » = fait DÉRIVABLE (moyenne des contributions affichées).
  const avg = contributions.length
    ? Math.round(contributions.reduce((s, c) => s + c.amount, 0) / contributions.length)
    : 0

  // Projection IA (PRÉVISION §1.6 : estimation encadrée — horizon + confiance + base).
  const proj = useGoalProjection(g.id).data

  const actions = (
    <>
      <button type="button" className="btn" onClick={() => setEditOpen(true)}>
        <Icon name="gear" size={16} /> Modifier
      </button>
      <button type="button" className="btn primary" onClick={() => setFormOpen(true)}>
        <Icon name="plus" size={16} /> Ajouter une contribution
      </button>
    </>
  )

  return (
    <>
      <h1 className={styles.srOnly}>{g.name}</h1>
      <div className={styles.detailCol}>
        {/* en-tête desktop / actions mobile */}
        <div className={styles.deskHead}>
          <div>
            <div className="t-eyebrow">Objectif · Épargne</div>
            <div className={styles.pageTitle}>{g.name}</div>
          </div>
          <div className={`r ${styles.headActions}`}>{actions}</div>
        </div>
        <div className={styles.mobActions}>{actions}</div>

        {/* hero : progression + stats */}
        <Card className={`r ${styles.heroCard}`}>
          <Donut
            size={150}
            segments={[{ v: g.pct, color: 'var(--accent)' }]}
            label={`${g.pct} %`}
            sub="atteint"
          />
          <div className={styles.heroRight}>
            <div className={`r ${styles.statRow}`}>
              <div className="stat">
                <div className="sl">Épargné</div>
                <div className="sv">{money(g.currentAmount)}</div>
              </div>
              <div className={`stat ${styles.statDivider}`}>
                <div className="sl">Objectif</div>
                <div className="sv">{money(g.targetAmount)}</div>
              </div>
              <div className={`stat ${styles.statDivider}`}>
                <div className="sl">Reste</div>
                <div className="sv t-warn">{money(g.reste)}</div>
              </div>
            </div>
            <div className={styles.progWrap}>
              <Progress pct={g.pct} tone="" />
            </div>
            <div className={`r between ${styles.heroNote}`}>
              <span className="wf-note">
                <Icon name="calendar" size={14} />{' '}
                {g.targetDate ? `Date cible : ${formatIsoMonthYear(g.targetDate)}` : 'Pas de date cible'}
              </span>
              {/* Rythme suggéré (réel) = rythme mensuel pour tenir la date cible. */}
              <span className="t-faint">
                Rythme suggéré :{' '}
                {proj?.suggestedPace != null ? (
                  <span className="t-mono">{money(proj.suggestedPace)} / mois</span>
                ) : (
                  'à votre rythme'
                )}
              </span>
            </div>
          </div>
        </Card>

        {/* Conseil IA — contenu réel (askClaude goal-projection), dérivé des contributions. */}
        <Card pad="pad-sm" className={`r ${styles.g12}`}>
          <div className={`ai-av ${styles.aiAv}`}>C</div>
          <div className={styles.aiText}>
            <span className={`insight-tag ${styles.aiTagOk}`}>Conseil</span>
            {proj?.advice ?? 'Analyse de cet objectif en cours…'}
          </div>
          <button
            type="button"
            className={`card-link ${styles.nowrap} ${styles.linkBtn}`}
            onClick={() => setFormOpen(true)}
          >
            Ajuster <Icon name="chevron" size={13} />
          </button>
        </Card>

        {/* 2 colonnes : historique + projection */}
        <div className={styles.gridTwo}>
          <Card>
            <div className="card-head">
              <div>
                <div className="card-title">Historique des contributions</div>
                {/* Désambiguïsation : échantillon récent (Σ ≠ solde épargné autoritaire). */}
                <div className={`t-faint ${styles.histSub}`}>Versements récents</div>
              </div>
              <span className="card-link">
                Tout voir <Icon name="chevron" size={13} />
              </span>
            </div>
            {contributions.length === 0 ? (
              <EmptyState
                icon="inbox"
                title="Aucune contribution"
                text="Ajoutez une contribution pour faire avancer cet objectif."
              />
            ) : (
              <div>
                {contributions.map((c) => (
                  <div className="row-line" key={c.id}>
                    <div className={`row-ico ${styles.histIcoPos}`}>
                      <Icon name="up" size={16} />
                    </div>
                    <div className={styles.histRowText}>
                      <div className={styles.histName}>Contribution</div>
                      <div className={`t-faint ${styles.histAcc}`}>{accountName(accounts, c.accountId)}</div>
                    </div>
                    <div className={`c ${styles.histRight}`}>
                      <span className={`row-amt t-pos ${styles.histAmt}`}>+{money(c.amount)}</span>
                      <span className={`t-faint ${styles.histWhen}`}>{formatIsoDay(c.occurredAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <div className={`card-title ${styles.projTitle}`}>Projection</div>
            <div className={`c ${styles.projCol}`}>
              {/* Prévision RÉELLE (§1.6) : estimation encadrée — horizon + confiance + base. */}
              <Card soft pad="pad-sm">
                <div className={`t-faint ${styles.projLabel}`}>À ce rythme, objectif atteint</div>
                <div className={`kpi-val ${styles.projVal}`}>
                  {proj?.eta ? `≈ ${proj.eta}` : 'À estimer'}
                </div>
                {proj?.text && <div className={`t-faint ${styles.projFraming}`}>{proj.text}</div>}
              </Card>
              {/* Fait dérivable → calculé (moyenne des contributions affichées). */}
              <Card soft pad="pad-sm">
                <div className={`t-faint ${styles.projLabel}`}>Contribution moyenne</div>
                <div className={`kpi-val ${styles.projVal}`}>
                  {money(avg)} <span className="kpi-cur">/ mois</span>
                </div>
              </Card>
            </div>
          </Card>
        </div>
      </div>

      {/* drawer (desktop) / bottom sheet (mobile) — Ajouter une contribution */}
      {isMobile ? (
        <BottomSheet open={formOpen} onClose={() => setFormOpen(false)} title="Ajouter une contribution">
          <ContributionForm goal={g} accounts={accounts} onClose={() => setFormOpen(false)} />
        </BottomSheet>
      ) : (
        <Drawer open={formOpen} onClose={() => setFormOpen(false)} title="Ajouter une contribution">
          <ContributionForm goal={g} accounts={accounts} onClose={() => setFormOpen(false)} />
        </Drawer>
      )}

      {/* drawer (desktop) / bottom sheet (mobile) — Modifier l'objectif */}
      {isMobile ? (
        <BottomSheet open={editOpen} onClose={() => setEditOpen(false)} title="Modifier l’objectif">
          <GoalForm initial={g} onClose={() => setEditOpen(false)} />
        </BottomSheet>
      ) : (
        <Drawer open={editOpen} onClose={() => setEditOpen(false)} title="Modifier l’objectif">
          <GoalForm initial={g} onClose={() => setEditOpen(false)} />
        </Drawer>
      )}
    </>
  )
}

/** Nom du compte source d'une contribution (ou « — » si non renseigné/supprimé). */
function accountName(accounts: { id: string; name: string }[], id: string | null): string {
  if (!id) return '—'
  return accounts.find((a) => a.id === id)?.name ?? '—'
}
